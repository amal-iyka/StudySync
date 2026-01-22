import { useState, useCallback, ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface ChatDropZoneProps {
  children: ReactNode;
  onFileDrop: (file: File) => void;
  disabled?: boolean;
}

export function ChatDropZone({ children, onFileDrop, disabled }: ChatDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileDrop(files[0]);
    }
  }, [disabled, onFileDrop]);

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="w-8 h-8" />
            <span className="font-medium">Drop file to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}
