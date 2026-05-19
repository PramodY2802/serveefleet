FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm prune --production
EXPOSE 5000
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
