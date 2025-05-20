import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin 123', 10);

  await prisma.user.upsert({
    where: { email: 'admin123@bnpl.com' },
    update: {},
    create: {
      id: 'Admin 123',
      fullName: 'Rancho Ola',
      email: 'admin123@bnpl.com',
      phone: '08000000000',
      password: hashedPassword,
      isAdmin: true,
    },
  });

  console.log(' Admin user created or updated successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Error seeding admin user:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
