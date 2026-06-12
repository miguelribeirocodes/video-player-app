# Psico Cursos — Plataforma de vídeos/cursos (MVP)

Plataforma fullstack para a **Sabrina** publicar aulas de psicologia em vídeo.
Os vídeos são **hospedados e reproduzidos pelo próprio app** (sem YouTube/Vimeo):
o upload salva o arquivo no servidor e um player embutido (Vidstack) faz o
streaming com suporte a *seek* via HTTP Range Requests.

Funciona no computador e no celular, e é instalável como app (PWA).

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Vidstack** (player de vídeo embutido)
- **Prisma** + **SQLite** (MVP — trocável por Postgres)
- **TailwindCSS**
- **PWA**: `manifest`, ícones e service worker

## Rodando localmente (Windows/macOS/Linux)

> Pré-requisito: Node.js 20+ (testado com Node 22).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env     # no Windows (PowerShell): copy .env.example .env
#   edite ADMIN_PASSWORD em .env

# 3. Criar o banco SQLite e o client do Prisma
npm run db:push
npm run db:seed          # (opcional) cria um curso de exemplo

# 4. Subir em desenvolvimento
npm run dev
# abra http://localhost:3000
```

### Build de produção

```bash
npm run build
npm run start
```

## Como usar

1. Acesse **/admin**.
2. Preencha título/descrição, escolha (opcional) um curso, selecione o arquivo
   de vídeo e informe a **senha de admin** (a mesma de `ADMIN_PASSWORD`).
3. O upload mostra barra de progresso. Ao concluir, o vídeo aparece no catálogo
   (**/**) e pode ser assistido em **/watch/[slug]**.

## Estrutura

```
src/
  app/
    page.tsx                 # catálogo (home)
    admin/page.tsx           # área de upload + lista de vídeos
    watch/[slug]/page.tsx    # player + aulas relacionadas
    manifest.ts              # PWA manifest
    api/
      upload/route.ts        # upload streaming -> disco (+ registro no banco)
      stream/[id]/route.ts   # streaming do vídeo com HTTP Range
      videos/[id]/route.ts   # DELETE de vídeo
  components/
    VideoPlayer.tsx          # player Vidstack (client)
    UploadForm.tsx           # formulário de upload com progresso (client)
    DeleteVideoButton.tsx
  lib/
    prisma.ts                # client Prisma (singleton)
    storage.ts               # caminhos de arquivo, slug, nome único
prisma/
  schema.prisma              # Course, Video (+ User/Subscription comentados p/ fase 2)
  seed.ts
storage/videos/              # arquivos enviados (NÃO versionados)
public/                      # ícones PWA, service worker
```

## Onde ficam os vídeos

No disco do servidor, em `storage/videos/` (configurável por
`VIDEO_STORAGE_DIR`). Os arquivos **não** vão para o git (ver `.gitignore`).
O caminho é resolvido com `path.basename` para evitar *path traversal*.

## Segurança (MVP)

O upload/exclusão são protegidos por uma senha simples (`ADMIN_PASSWORD`) enviada
no header `x-admin-password`. É proposital para o MVP — **substituir por auth real
na fase 2**.

## Roadmap — Fase 2 (venda de acessos)

O schema já está preparado: as entidades `User`, `Subscription` e `Enrollment`
estão comentadas em `prisma/schema.prisma`. Próximos passos sugeridos:

- Autenticação (Auth.js/Clerk) substituindo a senha de admin.
- Papéis (admin x aluno) e proteção das rotas de vídeo por matrícula/assinatura.
- Pagamentos/mensalidade (Stripe ou Mercado Pago) atualizando `Subscription`.
- Migrar storage para S3/Cloudflare R2 e SQLite → Postgres.
- Transcodificação/HLS para streaming adaptativo em conexões móveis.

## Deploy no Fly.io (recomendado: CLI)

O app guarda o banco SQLite e os vídeos **em disco**. No Fly isso exige um
**volume persistente** — por isso o deploy precisa do CLI (`flyctl`), já que o
volume não é criado pelo "Launch from GitHub" da web.

```bash
# 1. Login
fly auth login

# 2. Criar o app a partir do fly.toml (NÃO faça deploy ainda)
#    Troque o nome em fly.toml se "psico-cursos-sabrina" já existir.
fly launch --no-deploy --copy-config --name psico-cursos-sabrina --region gru

# 3. Criar o volume persistente (mesmo nome do mount em fly.toml: "data")
fly volumes create data --region gru --size 3   # 3 GB; aumente conforme os vídeos

# 4. Definir a senha de admin como secret (não vai pro git)
fly secrets set ADMIN_PASSWORD="sua-senha-forte"

# 5. Deploy
fly deploy

# 6. Abrir
fly open
```

O `Dockerfile` cria um banco "base" com as tabelas no build; no primeiro boot o
`docker-entrypoint.sh` copia esse banco para `/data/prod.db` no volume. Vídeos
enviados ficam em `/data/videos`. Ambos sobrevivem a deploys e restarts.

> **Não escale para mais de 1 máquina**: o volume é por-instância, então
> múltiplas máquinas teriam bancos/vídeos divergentes. Mantenha 1 VM.

### Sobre o "Launch from GitHub" (web)

Esse fluxo é prático (redeploy automático a cada push), mas **não cria volume**.
Sem volume, o `[[mounts]]` do `fly.toml` faz a máquina falhar no boot, e mesmo
removendo o mount o banco/vídeos seriam apagados a cada deploy. Se quiser CD pelo
GitHub, crie o app pelo CLI (passos acima) e depois conecte o GitHub Actions /
auto-deploy — assim o volume já existe.

## Notas gerais

- SQLite + disco local exigem filesystem persistente (Fly com volume, VPS,
  Render, Railway). Em serverless puro (ex.: Vercel) o disco é efêmero — nesse
  caso migre storage para R2/S3 e o banco para Postgres.
