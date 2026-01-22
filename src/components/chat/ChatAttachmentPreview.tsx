import { FileText, File, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatAttachmentPreviewProps {
  url: string;
  name: string;
  type: string;
  isOwnMessage?: boolean;
}

export function ChatAttachmentPreview({ url, name, type, isOwnMessage }: ChatAttachmentPreviewProps) {
  const handleOpen = () => window.open(url, '_blank');

  if (type === 'image') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
        <img 
          src={url} 
          alt={name} 
          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleOpen}
        />
        <div className="flex items-center justify-between p-1 bg-black/10">
          <span className="text-xs truncate flex-1">{name}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleOpen}>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  const getFileIcon = () => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className={`mt-2 flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isOwnMessage ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-secondary hover:bg-secondary/80'
      }`}
      onClick={handleOpen}
    >
      <div className={`w-8 h-8 rounded flex items-center justify-center ${
        isOwnMessage ? 'bg-primary-foreground/20' : 'bg-background'
      }`}>
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {type.toUpperCase()}
        </p>
      </div>
      <Download className="w-4 h-4 flex-shrink-0" />
    </div>
  );
}
