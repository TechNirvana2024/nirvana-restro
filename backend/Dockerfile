# Stage 1: Dependencies
FROM node:20-alpine3.20 AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Stage 2: Production
FROM node:20-alpine3.20 AS production
WORKDIR /app

RUN apk add --no-cache libc6-compat && npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
EXPOSE 3333

