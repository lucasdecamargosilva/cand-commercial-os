FROM node:22-alpine

WORKDIR /app

# Sem dependências externas — só o código.
COPY package.json server.js index.html ./
COPY api ./api
COPY js ./js

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Não roda como root.
USER node

CMD ["node", "server.js"]
