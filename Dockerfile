
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

RUN npm install typeorm@^0.3.27 --legacy-peer-deps

COPY . .
RUN npm run build


FROM node:20-alpine
WORKDIR /app


COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY --from=builder /app/dist ./dist

COPY .env ./

EXPOSE 4000
CMD ["node", "dist/src/main.js"]