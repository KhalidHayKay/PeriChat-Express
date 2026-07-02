import type { User } from './user.js';

export type Message = {
  id: number;
  content: string | null;
  conversation_id: number;
  sender_id: number;
  receiver_id: number | null;
  group_id: number | null;
  sender: User;
  attachments: Attachment[] | null;
  created_at: string;
};

export type Attachment = {
  id: number;
  message_id: number;
  name: string;
  mime: string;
  size: number;
  url: string;
};
