FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js battle-worker.js accounts.js ./
COPY game ./game
ENV PORT=8151
# Accounts and cloud saves (SQLite) live here; docker-compose keeps this folder on your machine.
ENV DATA_DIR=/app/data
VOLUME /app/data
EXPOSE 8151
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8151/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
