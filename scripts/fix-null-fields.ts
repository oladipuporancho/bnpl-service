import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixNullFields() {
  await prisma.user.updateMany({
    where: { bvn: null },
    data: { bvn: 'not_set' },
  });

  await prisma.user.updateMany({
    where: { bankAccount: null },
    data: { bankAccount: 'not_set' },
  });

  console.log("✅ NULL fields fixed.");
}

fixNullFields()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
