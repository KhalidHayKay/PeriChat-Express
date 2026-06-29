import { z } from 'zod';
import type { validator } from '../validator/schema.js';

export type NewMessageData = z.infer<typeof validator.messaging.new>;

export type NewMessageAttachmentData = NonNullable<
  NewMessageData['message_attachments']
>[number];

export type NewGroupData = {
  name: string;
  description: string | null;
  avatar: string | null;
  isPrivate: boolean;

  userIds: string[];
};
