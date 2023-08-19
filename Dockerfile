FROM node:alpine

RUN apk add --no-cache bash python3 build-base

RUN npm install -g npm@latest

WORKDIR /app

COPY package*.json ./

EXPOSE 3000
