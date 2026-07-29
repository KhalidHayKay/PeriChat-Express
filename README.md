# PeriChat Express Backend

A real-time messaging backend built with Express, TypeScript, Prisma, PostgreSQL, Redis, and Socket.IO. It powers private conversations, group chats, media attachments, unread message tracking, and live real-time messaging for the PeriChat application.

## 🌍 Try it Live

[https://perichat-livid.vercel.app](https://perichat-livid.vercel.app)

Frontend Repository: [https://github.com/KhalidHayKay/PeriChat](https://github.com/KhalidHayKay/PeriChat)

---

## What it does

- Handles user authentication with token-based sessions
- Supports private one-to-one conversations
- Supports group conversations and membership actions
- Stores and delivers messages in real time over Socket.IO
- Tracks unread counts per conversation
- Supports file and media attachments in messages
- Runs in Docker with PostgreSQL and Redis for local development and deployment

## Tech stack

- Node.js 22
- Express 5 + TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- Docker Compose

## Project structure

```text
src/
  app.ts
  server.ts
  config/
  controllers/
  dtos/
  errors/
  lib/
  middlewares/
  routes/
  services/
  types/
  validator/
prisma/
  schema.prisma
compose.yaml
compose.override.yaml
Dockerfile
start.sh
```

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/KhalidHayKay/PeriChat-Express.git
cd PeriChat-Express
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Update the values in `.env` for your local or deployment environment. The repository includes a ready-to-use example with defaults for local Docker development.

### 3. Create the local development Compose override

The base `compose.yaml` is intentionally simple and production-friendly. For local development, the repository already includes `compose.override.yaml`, which mounts the source code into the container so the app can be developed with hot reload support.

If you need to recreate it, the relevant content is:

```yaml
services:
  app:
    volumes:
      - ./:/var/www/
```

### 4. Start the services

```bash
docker compose up --build -d
```

This starts:

- `app` — the Express API
- `db` — PostgreSQL
- `redis` — Redis

### 5. Run Prisma migrations

```bash
docker compose exec app yarn prisma generate
docker compose exec app yarn prisma migrate deploy
```

### 6. Access the API

- API base URL: http://localhost:8050
- Health check: http://localhost:8050/health

## Running locally without Docker

If you want to run the app directly on your machine:

```bash
yarn install
yarn prisma generate
yarn dev
```

The development script uses `tsx watch`, so changes to the source are picked up automatically.

## Environment variables

The app uses the values from `.env`. The most important ones are:

```env
APP_ENV=local
APP_PORT=8050
APP_URL=http://localhost:8050

DB_HOST=db
DB_PORT=5432
DB_DATABASE=perichat
DB_USERNAME=perichat-postgres
DB_PASSWORD=admin

DATABASE_URL=postgresql://perichat-postgres:admin@db:5432/perichat?schema=public

REDIS_URL=redis://redis:6379

CORS_ORIGINS=http://localhost:5173
```

## API routes

All API routes are mounted under `/api`.

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### Conversations

```text
GET /api/conversations
GET /api/conversations/suggestions
GET /api/conversations/:id
GET /api/conversations/:id/older
```

### Messaging

```text
POST /api/messaging
POST /api/messaging/first
```

### Groups

```text
POST /api/group
GET /api/group/candidates
POST /api/group/:id/join
POST /api/group/:id/leave
```

## Real-time events

The backend exposes Socket.IO for live messaging. Clients connect with a token in the handshake and can join conversation rooms to receive updates.

Key events include:

- `message:sent` — broadcast when a message is created
- `created:conversation` — emitted when a first message creates a new conversation
- `created:group` — emitted when a group is created
- `users:online`, `user:online`, `user:offline` — presence updates

## Docker notes

The Docker setup is defined in `compose.yaml` and `compose.override.yaml`:

- `app` runs the Express server on the port defined by `APP_PORT`
- `db` runs PostgreSQL with a named volume for persistence
- `redis` runs Redis with a named volume for persistence
- Local development uses the override file to mount the working directory into the container

## Notes

- The app uses Prisma for database access and schema management.
- The server also exposes `/health` for simple uptime checks.
- The default local development environment is configured for Docker-based development, but you can also run the API directly with Yarn.
