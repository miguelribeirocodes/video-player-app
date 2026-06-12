# syntax=docker/dockerfile:1

# ----- base -----
FROM node:20-bookworm-slim AS base
# OpenSSL é exigido pelo engine do Prisma.
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ----- deps (instala dependências) -----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --ignore-scripts evita rodar o postinstall (prisma generate) aqui, pois o
# schema ainda não foi copiado. O generate roda no estágio builder, abaixo.
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# ----- builder (gera client Prisma, banco base e build do Next) -----
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Cria um banco SQLite "base" já com as tabelas. Ele é copiado para o volume
# persistente no primeiro boot (ver docker-entrypoint.sh).
RUN DATABASE_URL="file:/app/prisma/base.db" npx prisma db push --skip-generate
RUN npm run build

# ----- runner (imagem final) -----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
# Banco e mídia ficam no volume persistente montado em /data.
ENV DATABASE_URL="file:/data/prod.db"
ENV VIDEO_STORAGE_DIR="/data/videos"

# Servidor standalone do Next (inclui um node_modules mínimo).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Engine + client do Prisma e o banco base (o tracer do Next pode não incluir
# o binário do engine, então copiamos explicitamente).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /data/videos

EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]
