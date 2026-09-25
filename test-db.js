const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.count()
  .then(c => { console.log('User count:', c); return prisma.$disconnect(); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });