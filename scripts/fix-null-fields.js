"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=fix-null-fields.js.map