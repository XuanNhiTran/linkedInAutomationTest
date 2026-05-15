import path from 'node:path';

export type UserProfile = {
  name: string;
  email: string;
  password: string;
  storageStatePath: string;
};

export const users: UserProfile[] = [
  {
    name: 'user1',
    email: process.env.LINKEDIN_USER1_EMAIL!,
    password: process.env.LINKEDIN_USER1_PASSWORD!,
    storageStatePath: path.join('playwright', '.auth', 'user1.json'),
  },
  {
    name: 'user2',
    email: process.env.LINKEDIN_USER2_EMAIL!,
    password: process.env.LINKEDIN_USER2_PASSWORD!,
    storageStatePath: path.join('playwright', '.auth', 'user2.json'),
  },
];
