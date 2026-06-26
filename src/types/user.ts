export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  emailVerifiedAt?: Date | null;
}
