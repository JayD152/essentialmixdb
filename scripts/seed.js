// Simple JS seed runner to avoid ESM loader complications
const { subDays } = require('date-fns');
const { Sequelize, DataTypes } = require('sequelize');

async function main() {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: process.env.DATABASE_URL?.startsWith('file:') ? process.env.DATABASE_URL.slice(5) : (process.env.SQLITE_PATH || './prisma/dev.db'), logging: false });
  const Mix = sequelize.define('Mix', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    number: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    artist: { type: DataTypes.STRING, allowNull: false },
    title: DataTypes.STRING,
    releaseDate: { type: DataTypes.DATE, allowNull: false },
    artworkUrl: DataTypes.STRING,
    bio: DataTypes.TEXT,
    durationSeconds: DataTypes.INTEGER,
    audioPath: DataTypes.STRING,
    externalUrl: DataTypes.STRING,
    soundcloudUrl: DataTypes.STRING,
    mixcloudUrl: DataTypes.STRING,
    youtubeUrl: DataTypes.STRING,
    spotifyUrl: DataTypes.STRING,
    heroImageUrl: DataTypes.STRING,
    genre: DataTypes.STRING,
    bpmLow: DataTypes.INTEGER,
    bpmHigh: DataTypes.INTEGER,
    location: DataTypes.STRING,
    rating: DataTypes.FLOAT,
    ratingCount: DataTypes.INTEGER
  }, { tableName: 'Mix', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });
  const Track = sequelize.define('Track', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false },
    index: { type: DataTypes.INTEGER, allowNull: false },
    timecodeSeconds: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    artist: DataTypes.STRING,
    label: DataTypes.STRING
  }, { tableName: 'Track', timestamps: false });
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false },
    userId: DataTypes.STRING,
    userName: { type: DataTypes.STRING, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    body: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { tableName: 'Review', timestamps: false });
  const RecommendedMix = sequelize.define('RecommendedMix', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { tableName: 'RecommendedMix', timestamps: false });
  await sequelize.sync();

  const baseDate = new Date();
  const mixesData = [
    { number: 1, artist: 'Pete Tong', title: 'Foundations', releaseDate: subDays(baseDate, 4000), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1600&q=80', bio: 'The inaugural Essential Mix that set the tone.', durationSeconds: 7200, audioPath: '/audio/mix001.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix001', soundcloudUrl: 'https://soundcloud.com/example/mix001', mixcloudUrl: 'https://www.mixcloud.com/example/mix001', genre: 'House', bpmLow: 120, bpmHigh: 126, location: 'BBC Studios', rating: 4.6, ratingCount: 124 },
    { number: 2, artist: 'Daft Punk', title: 'Alive Warmup', releaseDate: subDays(baseDate, 3200), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1526481280698-8fcc1ddfc3c8?auto=format&fit=crop&w=1600&q=80', bio: 'A formative early French touch showcase.', durationSeconds: 7190, audioPath: '/audio/mix002.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix002', youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U' },
    { number: 3, artist: 'Sasha & John Digweed', title: 'Progressive Journey', releaseDate: subDays(baseDate, 2800), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1600&q=80', bio: 'Defining progressive house narrative.', durationSeconds: 7135, audioPath: '/audio/mix003.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix003', mixcloudUrl: 'https://www.mixcloud.com/example/mix003' },
    { number: 4, artist: 'Carl Cox', title: '3 Deck Energy', releaseDate: subDays(baseDate, 2500), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80', bio: 'Relentless techno + house hybrid energy.', durationSeconds: 7180, audioPath: '/audio/mix004.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix004', soundcloudUrl: 'https://soundcloud.com/example/mix004', youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U', genre: 'Techno', bpmLow: 126, bpmHigh: 134, location: 'Space Ibiza', rating: 4.9, ratingCount: 2847 },
    { number: 5, artist: 'Nina Kraviz', title: 'Siberian Echoes', releaseDate: subDays(baseDate, 800), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1600&q=80', bio: 'Dreamy acid + leftfield textures.', durationSeconds: 7020, audioPath: '/audio/mix005.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix005', soundcloudUrl: 'https://soundcloud.com/example/mix005' },
    { number: 6, artist: 'Amelie Lens', title: 'Warehouse Pulse', releaseDate: subDays(baseDate, 300), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1500315331616-db9127b1f9d9?auto=format&fit=crop&w=1600&q=80', bio: 'Peak hour rolling techno intensity.', durationSeconds: 7210, audioPath: '/audio/mix006.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix006', youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U' },
    { number: 7, artist: 'Fred again..', title: 'Emotive Collage', releaseDate: subDays(baseDate, 120), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1518972559570-0bde6a760b4e?auto=format&fit=crop&w=1600&q=80', bio: 'Field recordings meet club euphoria.', durationSeconds: 7205, audioPath: '/audio/mix007.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix007', spotifyUrl: 'https://open.spotify.com/episode/example007' },
    { number: 8, artist: 'Peggy Gou', title: 'Global Groove', releaseDate: subDays(baseDate, 60), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80', bio: 'Sunrise deep rhythms & playful edges.', durationSeconds: 7195, audioPath: '/audio/mix008.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix008', mixcloudUrl: 'https://www.mixcloud.com/example/mix008' },
    { number: 9, artist: 'Four Tet', title: 'Textural Flow', releaseDate: subDays(baseDate, 20), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80', bio: 'Organic percussion + melodic abstractions.', durationSeconds: 7188, audioPath: '/audio/mix009.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix009', soundcloudUrl: 'https://soundcloud.com/example/mix009' },
    { number: 10, artist: 'Ben UFO', title: 'Selector Mode', releaseDate: subDays(baseDate, 1), artworkUrl: null, heroImageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80', bio: 'Cross-genre precision mixing.', durationSeconds: 7212, audioPath: '/audio/mix010.mp3', externalUrl: 'https://www.bbc.co.uk/programmes/mix010', youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U' },
  ];

  const mixes = [];
  for (const data of mixesData) {
    const existing = await Mix.findOne({ where: { number: data.number } });
    if (existing) mixes.push(existing);
    else mixes.push(await Mix.create(data));
  }

  const priorities = [
    { number: 3, priority: 10 },
    { number: 2, priority: 9 },
    { number: 9, priority: 8 },
    { number: 7, priority: 7 },
  ];
  for (const p of priorities) {
    const mix = mixes.find(m => m.number === p.number);
    const existing = await RecommendedMix.findOne({ where: { mixId: mix.id } });
    if (existing) await existing.update({ priority: p.priority });
    else await RecommendedMix.create({ mixId: mix.id, priority: p.priority });
  }

  for (const mix of mixes) {
    const existing = await Track.count({ where: { mixId: mix.id } });
    if (existing > 0) continue;
    const duration = mix.durationSeconds || 7200;
    const interval = 420;
    const trackCount = Math.min(10, Math.max(6, Math.floor(duration / interval)));
    const mockTracks = [];
    for (let i = 0; i < trackCount; i++) {
      const timecodeSeconds = Math.min(i * interval, duration - 1);
      mockTracks.push({ index: i + 1, timecodeSeconds, title: `${String(mix.artist).split(' ')[0]} Exclusive ID ${i + 1}`, artist: i % 3 === 0 ? mix.artist : sampleArtist(i), label: sampleLabel(i), mixId: mix.id });
    }
    await Track.bulkCreate(mockTracks);
  }

  const carl = mixes.find(m => m.number === 4);
  if (carl) {
    const existingReviews = await Review.count({ where: { mixId: carl.id } });
    if (existingReviews === 0) {
      await Review.bulkCreate([
        { mixId: carl.id, userName: 'TechnoHead92', rating: 5, body: 'Absolutely legendary energy from start to finish. The transition at 45:30 is pure history.' },
        { mixId: carl.id, userName: 'IbizaVibes', rating: 5, body: 'I was there that night—this captures the atmosphere perfectly. Goosebumps every time.' }
      ]);
    }
  }

  console.log('Seed complete (sequelize)');
  await sequelize.close();
}

function sampleArtist(i) {
  const artists = ['Unknown Producer', 'Deep Architect', 'Night Driver', 'Analog Dreams', 'Pulse Shaper', 'Waveform Unit'];
  return artists[i % artists.length];
}
function sampleLabel(i) {
  const labels = ['White Label', 'Test Press', 'Midnight Cuts', 'Circuit Records', 'Afterhours', 'Arcadia'];
  return labels[i % labels.length];
}

main().catch(err => { console.error(err); process.exit(1); });
