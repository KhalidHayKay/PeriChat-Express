import type { User } from './user.js';

export type Group = {
  id: number;
  name: string;
  avatar: string | null;
  description: string | null;
  is_private: boolean;
  member_ids: number[];
  owner: User;
  created_at: string;
  conversation_id: number;
};
