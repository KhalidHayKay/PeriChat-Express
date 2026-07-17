interface EnvConfig {
  app: {
    name: string;
    version: string;
    env: string;
    key: string;
    port: string;
    url: string;
  };

  db: {
    connection: string;
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  };

  redis: {
    url: string;
  };

  cors: {
    origins: string[];
  };

  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export const env: EnvConfig = {
  app: {
    name: process.env['APP_NAME'] || 'PeriChat',
    version: process.env['APP_VERSION'] || '1.0.0',
    env: process.env['APP_ENV'] || 'local',
    key: process.env['APP_KEY'] ?? '',
    port: process.env['APP_PORT'] ?? '',
    url: process.env['APP_URL'] ?? 'http://localhost:4000',
  },

  db: {
    connection: process.env['DB_CONNECTION'] ?? '',
    host: process.env['DB_HOST'] ?? '',
    port: process.env['DB_PORT'] ?? '',
    database: process.env['APP_DATABASE'] ?? '',
    username: process.env['APP_USERNAME'] ?? '',
    password: process.env['APP_PASSWORD'] ?? '',
  },

  redis: {
    url: process.env['REDIS_URL'] ?? '',
  },

  cors: {
    origins: (process.env['CORS_ORIGINS'] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'] ?? '',
    apiKey: process.env['CLOUDINARY_API_KEY'] ?? '',
    apiSecret: process.env['CLOUDINARY_API_SECRET'] ?? '',
  },
};
