FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY shared ./shared
COPY client/package.json ./client/package.json

RUN npm ci --workspace client

COPY client ./client

RUN npm --workspace client run build

FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/client/dist ./dist

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
