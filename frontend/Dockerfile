FROM node:24-alpine AS app

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]
