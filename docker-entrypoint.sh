#!/bin/sh
set -e

# Garante o diretório de vídeos no volume persistente.
mkdir -p /data/videos

# No primeiro boot o volume está vazio: copiamos o banco base (já com as
# tabelas criadas no build) para o caminho persistente. Nos boots seguintes
# o banco existente é preservado.
if [ ! -f /data/prod.db ]; then
  echo "[entrypoint] Inicializando banco em /data/prod.db a partir do base.db"
  cp /app/prisma/base.db /data/prod.db
fi

echo "[entrypoint] Subindo servidor Next na porta ${PORT:-8080}"
exec node server.js
