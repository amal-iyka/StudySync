import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shuffle } from 'lucide-react';

export interface AvatarConfig {
  faceShape: 'round' | 'oval' | 'square';
  skinTone: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bald' | 'spiky';
  hairColor: string;
  eyeStyle: 'normal' | 'happy' | 'sleepy';
  accessory: 'none' | 'glasses' | 'headphones' | 'hat';
}

const SKIN_TONES = ['#FFDFC4', '#F0C8A0', '#D4A574', '#A67C52', '#8D5524', '#5C3317'];
const HAIR_COLORS = ['#2C1810', '#4A3728', '#8B4513', '#D4A574', '#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'];

const defaultConfig: AvatarConfig = {
  faceShape: 'round',
  skinTone: SKIN_TONES[0],
  hairStyle: 'short',
  hairColor: HAIR_COLORS[0],
  eyeStyle: 'normal',
  accessory: 'none'
};

interface ProceduralAvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

export function ProceduralAvatar({ config, size = 80, className = '' }: ProceduralAvatarProps) {
  const getFacePath = () => {
    switch (config.faceShape) {
      case 'oval': return 'M50,15 C75,15 85,35 85,55 C85,80 70,90 50,90 C30,90 15,80 15,55 C15,35 25,15 50,15';
      case 'square': return 'M20,20 L80,20 L80,75 Q80,90 65,90 L35,90 Q20,90 20,75 Z';
      default: return 'M50,10 C80,10 90,40 90,55 C90,80 75,95 50,95 C25,95 10,80 10,55 C10,40 20,10 50,10';
    }
  };

  const getHairPath = () => {
    switch (config.hairStyle) {
      case 'long': return 'M15,40 Q10,20 30,10 Q50,0 70,10 Q90,20 85,40 L85,70 Q85,80 80,85 L80,50 Q50,45 20,50 L20,85 Q15,80 15,70 Z';
      case 'curly': return 'M25,35 Q15,25 25,15 Q35,5 50,8 Q65,5 75,15 Q85,25 75,35 Q85,30 80,40 Q75,35 70,38 Q80,25 65,20 Q55,15 45,20 Q30,25 30,38 Q25,35 20,40 Q15,30 25,35';
      case 'bald': return '';
      case 'spiky': return 'M30,30 L25,5 L40,25 L50,0 L60,25 L75,5 L70,30 Q50,20 30,30';
      default: return 'M20,45 Q15,25 35,12 Q50,5 65,12 Q85,25 80,45 Q50,35 20,45';
    }
  };

  const getEyes = () => {
    switch (config.eyeStyle) {
      case 'happy': return (
        <>
          <path d="M32,50 Q37,45 42,50" stroke="#2C1810" strokeWidth="2" fill="none" />
          <path d="M58,50 Q63,45 68,50" stroke="#2C1810" strokeWidth="2" fill="none" />
        </>
      );
      case 'sleepy': return (
        <>
          <ellipse cx="37" cy="50" rx="6" ry="3" fill="#2C1810" />
          <ellipse cx="63" cy="50" rx="6" ry="3" fill="#2C1810" />
        </>
      );
      default: return (
        <>
          <ellipse cx="37" cy="50" rx="5" ry="6" fill="white" />
          <ellipse cx="63" cy="50" rx="5" ry="6" fill="white" />
          <circle cx="38" cy="50" r="3" fill="#2C1810" />
          <circle cx="64" cy="50" r="3" fill="#2C1810" />
          <circle cx="39" cy="48" r="1" fill="white" />
          <circle cx="65" cy="48" r="1" fill="white" />
        </>
      );
    }
  };

  const getAccessory = () => {
    switch (config.accessory) {
      case 'glasses': return (
        <g stroke="#2C1810" strokeWidth="2" fill="none">
          <circle cx="37" cy="50" r="10" />
          <circle cx="63" cy="50" r="10" />
          <line x1="47" y1="50" x2="53" y2="50" />
          <line x1="27" y1="50" x2="15" y2="45" />
          <line x1="73" y1="50" x2="85" y2="45" />
        </g>
      );
      case 'headphones': return (
        <g>
          <path d="M15,50 Q15,20 50,20 Q85,20 85,50" stroke="#444" strokeWidth="4" fill="none" />
          <ellipse cx="15" cy="55" rx="8" ry="12" fill="#666" />
          <ellipse cx="85" cy="55" rx="8" ry="12" fill="#666" />
        </g>
      );
      case 'hat': return (
        <g>
          <ellipse cx="50" cy="18" rx="35" ry="8" fill="#4A90D9" />
          <rect x="30" y="5" width="40" height="15" rx="5" fill="#4A90D9" />
        </g>
      );
      default: return null;
    }
  };

  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={`rounded-full ${className}`}
    >
      <defs>
        <clipPath id="faceClip">
          <path d={getFacePath()} />
        </clipPath>
      </defs>
      
      {/* Background */}
      <rect width="100" height="100" fill="hsl(210 40% 96%)" rx="50" />
      
      {/* Face */}
      <path d={getFacePath()} fill={config.skinTone} />
      
      {/* Hair */}
      {config.hairStyle !== 'bald' && (
        <path d={getHairPath()} fill={config.hairColor} />
      )}
      
      {/* Eyes */}
      {getEyes()}
      
      {/* Eyebrows */}
      <path d="M30,42 Q37,38 44,42" stroke="#2C1810" strokeWidth="2" fill="none" />
      <path d="M56,42 Q63,38 70,42" stroke="#2C1810" strokeWidth="2" fill="none" />
      
      {/* Nose */}
      <path d="M50,55 Q52,62 50,65 Q48,62 50,55" stroke={config.skinTone} strokeWidth="2" fill="none" 
        style={{ filter: 'brightness(0.9)' }} />
      
      {/* Mouth */}
      <path d="M42,72 Q50,78 58,72" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Accessory */}
      {getAccessory()}
    </svg>
  );
}

interface AvatarGeneratorProps {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export function AvatarGenerator({ value, onChange }: AvatarGeneratorProps) {
  const randomize = () => {
    onChange({
      faceShape: (['round', 'oval', 'square'] as const)[Math.floor(Math.random() * 3)],
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      hairStyle: (['short', 'long', 'curly', 'bald', 'spiky'] as const)[Math.floor(Math.random() * 5)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      eyeStyle: (['normal', 'happy', 'sleepy'] as const)[Math.floor(Math.random() * 3)],
      accessory: (['none', 'glasses', 'headphones', 'hat'] as const)[Math.floor(Math.random() * 4)]
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <ProceduralAvatar config={value} size={120} />
      </div>
      
      <Button onClick={randomize} variant="outline" className="w-full">
        <Shuffle className="w-4 h-4 mr-2" /> Randomize
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Face Shape</Label>
          <div className="flex gap-1 mt-1">
            {(['round', 'oval', 'square'] as const).map(shape => (
              <button
                key={shape}
                onClick={() => onChange({ ...value, faceShape: shape })}
                className={`px-2 py-1 text-xs rounded ${value.faceShape === shape ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Hair Style</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {(['short', 'long', 'curly', 'spiky', 'bald'] as const).map(style => (
              <button
                key={style}
                onClick={() => onChange({ ...value, hairStyle: style })}
                className={`px-2 py-1 text-xs rounded ${value.hairStyle === style ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Skin Tone</Label>
          <div className="flex gap-1 mt-1">
            {SKIN_TONES.map(tone => (
              <button
                key={tone}
                onClick={() => onChange({ ...value, skinTone: tone })}
                className={`w-6 h-6 rounded-full border-2 ${value.skinTone === tone ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: tone }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Hair Color</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {HAIR_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onChange({ ...value, hairColor: color })}
                className={`w-5 h-5 rounded-full border-2 ${value.hairColor === color ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Eyes</Label>
          <div className="flex gap-1 mt-1">
            {(['normal', 'happy', 'sleepy'] as const).map(style => (
              <button
                key={style}
                onClick={() => onChange({ ...value, eyeStyle: style })}
                className={`px-2 py-1 text-xs rounded ${value.eyeStyle === style ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Accessory</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {(['none', 'glasses', 'headphones', 'hat'] as const).map(acc => (
              <button
                key={acc}
                onClick={() => onChange({ ...value, accessory: acc })}
                className={`px-2 py-1 text-xs rounded ${value.accessory === acc ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { defaultConfig as defaultAvatarConfig };
