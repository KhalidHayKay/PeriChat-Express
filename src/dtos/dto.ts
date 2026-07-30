export type NewMessageAttachmentData = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer<ArrayBufferLike>;
};

export type NewMessageData = {
  conversation_id: number;
  content?: string | undefined;
  message_attachments?: NewMessageAttachmentData[] | undefined;
  sender_id: number;
  receiver_id?: number | undefined;
  group_id?: number | undefined;
};

export type NewMessageWithConversationData = {
  content?: string | undefined;
  message_attachments?: NewMessageAttachmentData[] | undefined;
  sender_id: number;
  receiver_id: number;
};

export type NewGroupData = {
  name: string;
  description: string | null;
  avatar: string | null;
  is_private: boolean;

  member_ids: number[];
};
