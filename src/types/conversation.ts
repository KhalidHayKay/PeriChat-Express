// export interface Conversation {
//   id: bigint;
//   groupId: bigint | null;
//   lastMessageId: bigint | null;
//   createdAt: Date | null;
// }

export type ConversationSubject = {
  id: number;
  name: string;
  type: 'private' | 'group';
  type_id: number;
  avatar: string | null;
  last_message: string | null;
  last_message_sender_id: number | null;
  last_message_date: string | null;
  unread_messages_count: number;
  last_message_attachment_count: number;
  group_member_ids: number[] | null;
  group_owner: {
    id: number;
    name: string;
  } | null;
};
