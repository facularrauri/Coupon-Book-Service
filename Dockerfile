FROM node:22.14.0 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22.14.0-slim

WORKDIR /app

COPY --from=builder /app/dist ./src
COPY --from=builder /app/migrate.ts ./migrate.ts
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/config ./config
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm install --omit=dev

CMD ["npm", "start"]