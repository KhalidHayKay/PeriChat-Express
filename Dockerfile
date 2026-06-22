FROM node:22-alpine

RUN apk add --no-cache python3 make g++ git bash
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /var/www

ARG APP_ENV

COPY . .

RUN if [ "$APP_ENV" != "local" ]; then \
    RUN yarn install --frozen-lockfile \
    RUN yarn typecheck; \
    yarn build; \
    fi

RUN chown -R node:node /var/www
USER node

ENTRYPOINT ["/bin/sh", "start.sh"]