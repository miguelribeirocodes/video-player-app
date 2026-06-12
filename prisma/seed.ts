import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.upsert({
    where: { slug: "introducao-a-psicologia" },
    update: {},
    create: {
      slug: "introducao-a-psicologia",
      title: "Introdução à Psicologia",
      description:
        "Curso introdutório com os fundamentos da psicologia ministrado pela Sabrina.",
    },
  });

  console.log("Seed concluído. Curso de exemplo criado:", course.title);
  console.log(
    "Faça upload de vídeos pela página /admin para popular a plataforma."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
