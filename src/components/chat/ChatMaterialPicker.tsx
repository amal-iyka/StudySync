import { useState } from 'react';
import { BookOpen, FileText, Link as LinkIcon, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  subject?: { name: string; color: string } | null;
}

interface ChatMaterialPickerProps {
  materials: Material[];
  onSelect: (material: Material) => void;
  disabled?: boolean;
}

export function ChatMaterialPicker({ materials, onSelect, disabled }: ChatMaterialPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.description?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleSelect = (material: Material) => {
    onSelect(material);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={disabled || materials.length === 0}
          title={materials.length === 0 ? 'No materials to share' : 'Share a material'}
        >
          <BookOpen className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-0 p-0 focus-visible:ring-0"
            />
            {search && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSearch('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[250px]">
          {filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No materials found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredMaterials.map(material => (
                <button
                  key={material.id}
                  onClick={() => handleSelect(material)}
                  className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                    material.type === 'pdf' ? 'bg-red-500/10' : 'bg-blue-500/10'
                  }`}>
                    {material.type === 'pdf' ? (
                      <FileText className="w-4 h-4 text-red-500" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                    {material.subject && (
                      <Badge 
                        variant="outline" 
                        className="text-xs mt-1"
                        style={{ borderColor: material.subject.color, color: material.subject.color }}
                      >
                        {material.subject.name}
                      </Badge>
                    )}
                    {material.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {material.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
