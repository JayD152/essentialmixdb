const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const mixes = await prisma.mix.findMany({ include: { _count: { select: { tracks: true } } }, orderBy: { number: 'asc' } });
  console.table(mixes.map(m => ({ number: m.number, tracks: m._count.tracks })));
  await prisma.$disconnect();
})();
