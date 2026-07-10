#!/bin/sh
if [ "$APP_ENV" = "local" ]; then
    yarn install --frozen-lockfile
    exec ./node_modules/.bin/tsx watch src/server.ts
else
    exec node dist/src/server.js
fi