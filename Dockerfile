FROM node:alpine

RUN apk add --no-cache bash python3 build-base

RUN npm install -g npm@10.7.0

WORKDIR /app

COPY package*.json ./

EXPOSE 3000
