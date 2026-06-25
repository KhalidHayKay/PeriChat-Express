export interface User {
  id: bigint;
  name: string;
  email: string;
  avatar?: string | null;
  emailVerifiedAt?: Date | null;
}
