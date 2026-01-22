// User & Profile Types
export interface User {
  id: string;
  email: string;
  name: string;
  branch: string;
  year: string;
  avatar?: string;
  createdAt: string;
}

// Subject & Topic Types
export interface Subject {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  status: 'not-started' | 'in-progress' | 'learned';
  order: number;
}

// Study Session Types
export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  topicIds: string[];
  date: string;
  duration?: number;
  notes: string;
  createdAt: string;
}

// Streak Types
export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  subjectStreaks: Record<string, SubjectStreak>;
}

export interface SubjectStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

// Study Group Types
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
  currentStreak: number;
  topicsCompleted: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

// Study Materials Types
export interface StudyMaterial {
  id: string;
  userId: string;
  userName: string;
  subjectId: string;
  title: string;
  description: string;
  type: 'pdf' | 'link';
  url: string;
  usefulCount: number;
  createdAt: string;
  sharedWith?: string[]; // Group IDs
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: 'streak' | 'learning' | 'social' | 'consistency';
}

export interface UserBadge {
  badgeId: string;
  earnedAt: string;
  progress: number; // 0-100
}

// Analytics Types
export interface WeeklyStats {
  totalSessions: number;
  totalDuration: number;
  topicsCompleted: number;
  mostStudiedSubject: string | null;
  consistencyScore: number;
  previousWeekSessions: number;
}

export interface DailyActivity {
  date: string;
  sessionsCount: number;
  subjectsStudied: string[];
}
