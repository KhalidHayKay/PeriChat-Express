// export interface Conversation {
//   id: bigint;
//   groupId: bigint | null;
//   lastMessageId: bigint | null;
//   createdAt: Date | null;
// }

export type ConversationSubject = {
  type: 'private' | 'group';
  id: number;
  type_id: number; // userId for private, groupId for group
  name: string;
  avatar: string | null;
  last_message: string | null;
  last_message_sender_id: number | null;
  last_message_date: string | null;
  unread_messages_count: number;
  last_message_attachment_count: number;
};
