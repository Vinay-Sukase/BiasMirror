FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY shared ./shared
COPY server/package.json ./server/package.json

RUN npm ci --workspace server

COPY server ./server

WORKDIR /app/server

EXPOSE 4000

CMD ["npm", "run", "start"]
