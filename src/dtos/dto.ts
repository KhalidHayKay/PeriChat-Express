import { z } from 'zod';
import type { validator } from '../validator/schema.js';

export type NewMessageData = z.infer<typeof validator.messaging.new>;

export type NewMessageAttachmentData = NonNullable<
  NewMessageData['message_attachments']
>[number];
