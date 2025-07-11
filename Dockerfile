FROM node:alpine

RUN apk add --no-cache bash python3 build-base

RUN npm install -g npm@11.4.2

WORKDIR /app

COPY package*.json ./

EXPOSE 3000
