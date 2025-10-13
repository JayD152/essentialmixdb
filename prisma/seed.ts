import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Seed some mixes
  const baseDate = new Date();
  const mixesData = [
    { number: 1, artist: 'Pete Tong', title: 'Foundations', releaseDate: subDays(baseDate, 4000), artworkUrl: null, bio: 'The inaugural Essential Mix that set the tone.' },
    { number: 2, artist: 'Daft Punk', title: 'Alive Warmup', releaseDate: subDays(baseDate, 3200), artworkUrl: null, bio: 'A formative early French touch showcase.' },
    { number: 3, artist: 'Sasha & John Digweed', title: 'Progressive Journey', releaseDate: subDays(baseDate, 2800), artworkUrl: null, bio: 'Defining progressive house narrative.' },
    { number: 4, artist: 'Carl Cox', title: '3 Deck Energy', releaseDate: subDays(baseDate, 2500), artworkUrl: null, bio: 'Relentless techno + house hybrid energy.' },
    { number: 5, artist: 'Nina Kraviz', title: 'Siberian Echoes', releaseDate: subDays(baseDate, 800), artworkUrl: null, bio: 'Dreamy acid + leftfield textures.' },
    { number: 6, artist: 'Amelie Lens', title: 'Warehouse Pulse', releaseDate: subDays(baseDate, 300), artworkUrl: null, bio: 'Peak hour rolling techno intensity.' },
    { number: 7, artist: 'Fred again..', title: 'Emotive Collage', releaseDate: subDays(baseDate, 120), artworkUrl: null, bio: 'Field recordings meet club euphoria.' },
    { number: 8, artist: 'Peggy Gou', title: 'Global Groove', releaseDate: subDays(baseDate, 60), artworkUrl: null, bio: 'Sunrise deep rhythms & playful edges.' },
    { number: 9, artist: 'Four Tet', title: 'Textural Flow', releaseDate: subDays(baseDate, 20), artworkUrl: null, bio: 'Organic percussion + melodic abstractions.' },
    { number: 10, artist: 'Ben UFO', title: 'Selector Mode', releaseDate: subDays(baseDate, 1), artworkUrl: null, bio: 'Cross-genre precision mixing.' },
  ];

  const mixes = [];
  for (const data of mixesData) {
    const mix = await prisma.mix.upsert({
      where: { number: data.number },
      update: {},
      create: data,
    });
    mixes.push(mix);
  }

  // Recommend a few
  const priorities = [
    { number: 3, priority: 10 },
    { number: 2, priority: 9 },
    { number: 9, priority: 8 },
    { number: 7, priority: 7 },
  ];
  for (const p of priorities) {
    const mix = mixes.find(m => m.number === p.number)!;
    await prisma.recommendedMix.upsert({
      where: { mixId: mix.id },
      update: { priority: p.priority },
      create: { mixId: mix.id, priority: p.priority }
    });
  }

  console.log('Seed complete');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
