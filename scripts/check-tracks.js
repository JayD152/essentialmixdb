// Diagnostic: list mix numbers and track counts using the local prisma shim (Sequelize-backed)
const path = require('path');

(async () => {
  try { require('ts-node/register'); } catch {}
  const { prisma } = require(path.resolve(__dirname, '..', 'lib', 'prisma.ts'));
  const mixes = await prisma.mix.findMany({ orderBy: { number: 'asc' } });
  const tracks = await prisma.track.findMany({});
  const counts = tracks.reduce((acc, t) => { acc[t.mixId] = (acc[t.mixId] || 0) + 1; return acc; }, {});
  console.table(mixes.map(m => ({ number: m.number, tracks: counts[m.id] || 0 })));
})();
