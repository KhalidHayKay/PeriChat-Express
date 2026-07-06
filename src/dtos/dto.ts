export type NewMessageAttachmentData = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer<ArrayBufferLike>;
};

export type NewMessageData = {
  conversation_id: number;
  content?: string | undefined;
  receiver_id?: number | undefined;
  group_id?: number | undefined;
  message_attachments?: NewMessageAttachmentData[] | undefined;
};

export type NewMessageWithConversationData = {
  content?: string | undefined;
  receiver_id: number;
  message_attachments?: NewMessageAttachmentData[] | undefined;
};

export type NewGroupData = {
  name: string;
  description: string | null;
  avatar: string | null;
  is_private: boolean;

  member_ids: number[];
};
