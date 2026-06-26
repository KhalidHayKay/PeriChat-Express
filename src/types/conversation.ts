// export interface Conversation {
//   id: bigint;
//   groupId: bigint | null;
//   lastMessageId: bigint | null;
//   createdAt: Date | null;
// }

export type ConversationSubject = {
  type: 'private' | 'group';
  id: bigint;
  type_id: bigint; // userId for private, groupId for group
  name: string;
  avatar: string | null;
  last_message: string | null;
  last_message_sender_id: bigint | null;
  last_message_date: Date | null;
  unread_messages_count: number;
  last_message_attachment_count: number;
};
