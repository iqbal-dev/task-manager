export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

export type SafeUser = Omit<User, 'password'>;
