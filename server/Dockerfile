FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js battle-worker.js ./
COPY game ./game
ENV PORT=8151
EXPOSE 8151
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8151/health || exit 1
CMD ["node", "server.js"]
