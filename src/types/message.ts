import type { User } from './user.js';

export type Message = {
  id: string;
  content: string | null;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  group_id: string | null;
  sender: User;
  attachments: Attachment[] | null;
  created_at: string;
};

export type Attachment = {
  id: string;
  message_id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
};
