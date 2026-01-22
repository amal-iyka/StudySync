import { z } from 'zod';

// Group validations
export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name must be less than 100 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional().default('')
});

export const joinGroupSchema = z.object({
  invite_code: z.string().trim().min(1, 'Invite code is required').max(50, 'Invalid invite code').regex(/^[a-zA-Z0-9]+$/, 'Invite code must be alphanumeric')
});

// Subject validations
export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Subject name is required').max(100, 'Subject name must be less than 100 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional().default(''),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
});

// Topic validations
export const topicSchema = z.object({
  name: z.string().trim().min(1, 'Topic name is required').max(200, 'Topic name must be less than 200 characters')
});

// Study material validations
export const materialSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters').optional().default(''),
  type: z.enum(['pdf', 'link'], { errorMap: () => ({ message: 'Type must be pdf or link' }) }),
  url: z.string().trim().url('Invalid URL format').max(2000, 'URL is too long')
});

// Message validations
export const messageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long')
});

// Study session validations
export const sessionSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  topicIds: z.array(z.string().uuid('Invalid topic ID')),
  notes: z.string().trim().max(5000, 'Notes are too long').optional().default(''),
  sessionDate: z.date()
});

// Export types
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type TopicInput = z.infer<typeof topicSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
