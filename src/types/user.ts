export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  emailVerifiedAt?: Date | null;
}
