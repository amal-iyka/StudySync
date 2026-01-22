import { useState, useRef } from 'react';
import { Paperclip, X, FileText, Image, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatFileUploadProps {
  userId: string;
  groupId: string;
  onFileUploaded: (url: string, name: string, type: string) => void;
  disabled?: boolean;
}

export function ChatFileUpload({ userId, groupId, onFileUploaded, disabled }: ChatFileUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 10MB' });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Allowed: Images, PDFs, Word docs, Text files' });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${groupId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type === 'application/pdf' ? 'pdf' : 'document';

      setPreview({ url: urlData.publicUrl, name: file.name, type: fileType });
      onFileUploaded(urlData.publicUrl, file.name, fileType);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearPreview = () => {
    setPreview(null);
    onFileUploaded('', '', '');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 mb-2">
          {preview.type === 'image' ? (
            <img src={preview.url} alt={preview.name} className="w-10 h-10 object-cover rounded" />
          ) : (
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              {getFileIcon(preview.type)}
            </div>
          )}
          <span className="text-sm truncate flex-1">{preview.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearPreview}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
