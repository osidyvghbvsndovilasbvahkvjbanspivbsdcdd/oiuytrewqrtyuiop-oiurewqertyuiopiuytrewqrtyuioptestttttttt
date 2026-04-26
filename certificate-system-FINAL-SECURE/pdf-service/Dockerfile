FROM ghcr.io/puppeteer/puppeteer:21.6.0

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
