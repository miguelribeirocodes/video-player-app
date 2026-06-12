/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O upload usa um Route Handler com streaming do corpo bruto da requisição
  // direto para o disco (src/app/api/upload), então não dependemos do limite
  // de body de Server Actions. Arquivos grandes são suportados nativamente.
};

export default nextConfig;
