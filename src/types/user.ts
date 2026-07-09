export interface User {
  id: number;
  name: string;
  avatar: string | null;
  email: string;
  emailVerifiedAt?: string | null;
}

export const publicUserSelect = {
  id: true,
  name: true,
  avatar: true,
  email: true,
};
