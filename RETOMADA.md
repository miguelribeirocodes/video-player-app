# Prompt de Retomada — Psico Cursos (plataforma de vídeos/cursos)

> Cole o conteúdo abaixo numa nova conversa (Cowork/Claude) em outra máquina,
> depois de fazer `git clone`, para retomar o projeto com todo o contexto.

---

## 🧩 Prompt para o assistente

Você é um **engenheiro de software senior** e eu (Miguel) sou o **tech lead**
deste projeto. Vamos continuar de onde paramos. Leia o contexto abaixo antes de
agir e, quando precisar de decisões de produto/arquitetura, me pergunte.

### O que é o projeto
Plataforma fullstack de **vídeos/cursos de psicologia** para a Sabrina (minha
parceira). Os vídeos são **hospedados e reproduzidos pelo próprio app** (sem
YouTube/Vimeo): upload salva o arquivo no servidor e um player embutido faz o
streaming. Funciona em desktop e mobile, e é instalável como **PWA**.

### Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Vidstack** (player de vídeo embutido)
- **Prisma** + **SQLite** (MVP; migrar para Postgres na fase 2)
- **TailwindCSS**
- **PWA**: manifest + ícones + service worker
- Deploy em **Fly.io** com **volume persistente** (Docker, output standalone)

### Arquitetura / arquivos-chave
```
src/app/
  page.tsx                 # catálogo (home)
  admin/page.tsx           # upload + lista de vídeos (protegido por senha)
  watch/[slug]/page.tsx    # player + aulas relacionadas
  manifest.ts              # PWA manifest
  api/upload/route.ts      # upload via streaming do corpo bruto -> disco
  api/stream/[id]/route.ts # streaming com HTTP Range Requests (seek)
  api/videos/[id]/route.ts # DELETE de vídeo
src/components/            # VideoPlayer (Vidstack), UploadForm, DeleteVideoButton, RegisterSW
src/lib/                   # prisma.ts (singleton), storage.ts (paths, slug, nome único)
prisma/schema.prisma       # Course, Video (+ User/Subscription/Enrollment comentados p/ fase 2)
Dockerfile, fly.toml, docker-entrypoint.sh  # deploy Fly
storage/videos/            # vídeos enviados (NÃO versionado; em prod fica no volume)
```

### Decisões já tomadas
- Player com biblioteca pronta (Vidstack), não do zero.
- Storage em **disco local** no MVP (sem S3/R2 ainda).
- Auth do admin é uma **senha simples** (`ADMIN_PASSWORD`) via header
  `x-admin-password` — proposital para o MVP, será trocada por auth real.
- Banco **SQLite** num arquivo dentro do volume do Fly (`/data/prod.db`);
  vídeos em `/data/videos`.
- Controle **manual** de start/stop no Fly (sem auto-start por requisição).

### Estado atual (junho/2026)
- MVP **no ar**: `https://psico-cursos-sabrina.fly.dev/`
- App Fly: `psico-cursos-sabrina` (região `gru`), 1 VM `shared-cpu-1x` 512MB,
  volume `data` (3GB) em `/data`.
- Aguardando **feedback da Sabrina** para definir prioridades.

### ⚠️ Armadilhas já resolvidas (não repetir)
1. **`prisma generate` no `deps` do Docker falha** ("schema.prisma not found")
   porque o `postinstall` roda antes do schema ser copiado. Solução já aplicada:
   `npm ci --ignore-scripts` no estágio `deps`; o generate roda no `builder`.
2. **`manifest.ts`**: o tipo do Next não aceita `purpose: "any maskable"` —
   use só `"any"`.
3. **Fly + Prisma SQLite**: ao rodar `fly launch` foi provisionado um Managed
   Postgres que criou um secret `DATABASE_URL=postgresql://...`, sobrescrevendo
   o `file:/data/prod.db`. Como o schema é SQLite, dava erro "URL must start with
   `file:`". Solução: `fly secrets unset DATABASE_URL` (deixa o valor do
   `fly.toml`/Docker valer). O Postgres ocioso foi destruído.
4. **Fly religando sozinho**: `auto_start_machines` estava `true`. Mudado para
   `false` + `auto_stop_machines = "off"` para controle manual.
5. **Vídeo sem áudio**: quase sempre é codec não suportado pelo navegador
   (Chrome/Edge só decodificam **AAC** dentro de `.mp4`) ou arquivo sem faixa de
   áudio — não é bug do player. Verificar com `ffprobe`.

### Como rodar localmente
```bash
npm install
copy .env.example .env     # editar ADMIN_PASSWORD
npm run db:push
npm run dev                # http://localhost:3000
# opcional: npm run db:seed (cria um curso de exemplo)
```

### Deploy / operação no Fly
```bash
fly deploy                          # build + deploy
fly machine list                    # ver id da máquina
fly machine start <id>              # LIGAR (compartilhar com a Sabrina)
fly machine stop  <id>              # DESLIGAR
fly secrets set ADMIN_PASSWORD="..."# trocar senha do admin
```
Nunca escalar para >1 máquina (o volume é por-instância).

### Roadmap — Fase 2 (venda de acessos)
O schema já tem `User`/`Subscription`/`Enrollment` comentados. Próximos passos:
- Autenticação real (Auth.js/Clerk) substituindo a senha de admin.
- Papéis (admin × aluno) e proteção dos vídeos por matrícula/assinatura.
- Pagamentos/mensalidade (Stripe ou Mercado Pago).
- Migrar SQLite → Postgres e storage → S3/Cloudflare R2.
- (Opcional) transcodificação/HLS no upload para padronizar codec (resolve o
  caso do áudio AAC) e permitir streaming adaptativo no mobile.

### Pendências imediatas
- [ ] Aplicar feedback da Sabrina.
- [ ] Atualizar `next` para versão sem o CVE-2025-66478 (`npm i next@latest`,
      testar, commitar, redeploy).
- [ ] Definir senha de admin forte em produção (hoje é fraca).
