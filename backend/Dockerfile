FROM node:24-alpine AS app

WORKDIR /app

ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/exams_portal?schema=public
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm run start:prod"]
