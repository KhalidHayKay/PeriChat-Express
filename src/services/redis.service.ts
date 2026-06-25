import { env } from '../../config/env.js';
import { createClient } from 'redis';

const client = createClient({ url: env.redis.url });
client.on('error', console.error);

export const redisService = {
  connect: () => client.connect(),

  get: (key: string) => client.get(key),

  set: (key: string, value: string, ttl?: number) =>
    client.set(
      key,
      value,
      ttl ? { expiration: { type: 'EX', value: ttl } } : undefined,
    ),

  disconnect: () => client.quit(),
};
