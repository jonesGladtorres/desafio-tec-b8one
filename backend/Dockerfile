# --- Build stage ---
FROM node:24-alpine AS builder

WORKDIR /app

ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/exams_portal?schema=public
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm run prisma:generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./

EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm run start:prod"]
