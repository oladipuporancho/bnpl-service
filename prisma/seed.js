"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
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
    console.log('✅ Admin user created or updated successfully.');
}
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error('Error seeding admin user:', e);
    await prisma.$disconnect();
    process.exit(1);
});
