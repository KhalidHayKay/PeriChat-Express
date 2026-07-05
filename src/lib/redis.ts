import { env } from '../config/env.js';
import { createClient } from 'redis';

const client = createClient({ url: env.redis.url });
client.on('error', console.error);

export const redis = {
  connect: () => client.connect(),

  get: (key: string) => client.get(key),

  set: (key: string, value: string, ttl?: number) =>
    client.set(
      key,
      value,
      ttl ? { expiration: { type: 'EX', value: ttl } } : undefined,
    ),

  sAdd: (key: string, value: number | string) =>
    client.sAdd(key, String(value)),

  sRem: (key: string, value: number | string) =>
    client.sRem(key, String(value)),

  sMembers: async (key: string) => {
    const members = await client.sMembers(key);

    return members
      .map((member) => Number(member))
      .filter((member) => !Number.isNaN(member));
  },

  delete: (key: string) => client.del(key),

  disconnect: () => client.quit(),
};
