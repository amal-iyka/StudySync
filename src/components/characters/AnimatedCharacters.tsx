import { motion } from 'framer-motion';

interface CharacterProps {
  className?: string;
}

// Logic Buddy - Celebrates streaks (friendly robot)
export function LogicBuddy({ className = '' }: CharacterProps) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 ${className}`}
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.8, 1, 0.8], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body */}
      <rect x="25" y="35" width="50" height="45" rx="8" fill="hsl(217 91% 60%)" />
      {/* Head */}
      <rect x="30" y="15" width="40" height="30" rx="6" fill="hsl(217 91% 70%)" />
      {/* Eyes */}
      <motion.circle
        cx="42" cy="28" r="5"
        fill="white"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
      <motion.circle
        cx="58" cy="28" r="5"
        fill="white"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
      <circle cx="42" cy="28" r="2" fill="hsl(222 47% 11%)" />
      <circle cx="58" cy="28" r="2" fill="hsl(222 47% 11%)" />
      {/* Antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="hsl(217 91% 60%)" strokeWidth="3" />
      <motion.circle
        cx="50" cy="5" r="4"
        fill="hsl(38 92% 50%)"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Smile */}
      <path d="M 40 36 Q 50 42 60 36" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Arms */}
      <motion.rect
        x="15" y="45" width="10" height="20" rx="4"
        fill="hsl(217 91% 50%)"
        animate={{ rotate: [0, 20, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
        style={{ transformOrigin: '25px 45px' }}
      />
      <rect x="75" y="45" width="10" height="20" rx="4" fill="hsl(217 91% 50%)" />
    </motion.svg>
  );
}

// Focus Fox - Reminds after inactivity
export function FocusFox({ className = '' }: CharacterProps) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 ${className}`}
      initial={{ y: 0 }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Ears */}
      <polygon points="25,35 35,10 45,35" fill="hsl(25 95% 53%)" />
      <polygon points="55,35 65,10 75,35" fill="hsl(25 95% 53%)" />
      <polygon points="30,32 35,18 40,32" fill="hsl(25 95% 70%)" />
      <polygon points="60,32 65,18 70,32" fill="hsl(25 95% 70%)" />
      {/* Face */}
      <ellipse cx="50" cy="55" rx="30" ry="28" fill="hsl(25 95% 53%)" />
      {/* White face patch */}
      <ellipse cx="50" cy="65" rx="18" ry="18" fill="hsl(25 95% 90%)" />
      {/* Eyes */}
      <motion.ellipse
        cx="38" cy="50" rx="6" ry="7"
        fill="hsl(222 47% 11%)"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
      />
      <motion.ellipse
        cx="62" cy="50" rx="6" ry="7"
        fill="hsl(222 47% 11%)"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
      />
      <circle cx="40" cy="48" r="2" fill="white" />
      <circle cx="64" cy="48" r="2" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="62" rx="4" ry="3" fill="hsl(222 47% 11%)" />
      {/* Whiskers */}
      <line x1="20" y1="58" x2="35" y2="60" stroke="hsl(222 47% 11%)" strokeWidth="1" />
      <line x1="20" y1="65" x2="35" y2="65" stroke="hsl(222 47% 11%)" strokeWidth="1" />
      <line x1="65" y1="60" x2="80" y2="58" stroke="hsl(222 47% 11%)" strokeWidth="1" />
      <line x1="65" y1="65" x2="80" y2="65" stroke="hsl(222 47% 11%)" strokeWidth="1" />
    </motion.svg>
  );
}

// Debugger Owl - Encourages retry
export function DebuggerOwl({ className = '' }: CharacterProps) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 ${className}`}
      animate={{ rotate: [0, -5, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body */}
      <ellipse cx="50" cy="65" rx="28" ry="25" fill="hsl(262 83% 45%)" />
      {/* Wing patterns */}
      <ellipse cx="50" cy="70" rx="20" ry="18" fill="hsl(262 83% 55%)" />
      {/* Head */}
      <circle cx="50" cy="38" r="25" fill="hsl(262 83% 50%)" />
      {/* Ear tufts */}
      <polygon points="28,20 35,35 22,35" fill="hsl(262 83% 45%)" />
      <polygon points="72,20 78,35 65,35" fill="hsl(262 83% 45%)" />
      {/* Eye circles */}
      <circle cx="40" cy="38" r="12" fill="hsl(262 83% 90%)" />
      <circle cx="60" cy="38" r="12" fill="hsl(262 83% 90%)" />
      {/* Eyes */}
      <motion.circle
        cx="40" cy="38" r="6"
        fill="hsl(38 92% 50%)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="60" cy="38" r="6"
        fill="hsl(38 92% 50%)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <circle cx="40" cy="38" r="3" fill="hsl(222 47% 11%)" />
      <circle cx="60" cy="38" r="3" fill="hsl(222 47% 11%)" />
      <circle cx="41" cy="36" r="1.5" fill="white" />
      <circle cx="61" cy="36" r="1.5" fill="white" />
      {/* Beak */}
      <polygon points="50,45 45,52 55,52" fill="hsl(38 92% 50%)" />
      {/* Graduation cap */}
      <rect x="35" y="12" width="30" height="4" fill="hsl(222 47% 11%)" />
      <polygon points="50,5 35,15 65,15" fill="hsl(222 47% 11%)" />
      <line x1="65" y1="12" x2="72" y2="20" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      <circle cx="73" cy="22" r="3" fill="hsl(38 92% 50%)" />
    </motion.svg>
  );
}

// Motivational character display based on context
interface MotivationalCharacterProps {
  type: 'streak' | 'inactive' | 'encourage' | 'welcome';
  message?: string;
  className?: string;
}

export function MotivationalCharacter({ type, message, className = '' }: MotivationalCharacterProps) {
  const characters = {
    streak: { Component: LogicBuddy, defaultMessage: "Amazing streak! Keep it going! 🔥" },
    inactive: { Component: FocusFox, defaultMessage: "Hey! Ready to study today? 📚" },
    encourage: { Component: DebuggerOwl, defaultMessage: "Don't give up! You've got this! 💪" },
    welcome: { Component: LogicBuddy, defaultMessage: "Welcome back! Let's learn! ✨" }
  };

  const { Component, defaultMessage } = characters[type];

  return (
    <motion.div
      className={`flex items-center gap-3 p-4 rounded-lg bg-card border ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Component />
      <p className="text-sm font-medium text-foreground">{message || defaultMessage}</p>
    </motion.div>
  );
}
