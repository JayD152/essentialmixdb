import { Sequelize, DataTypes, Model, Op } from 'sequelize';
// Ensure sqlite3 module is explicitly provided to Sequelize to avoid dynamic require issues
// in bundled environments (e.g., Next.js server runtime)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqlite3 = require('sqlite3');

// Resolve SQLite storage path from env DATABASE_URL (e.g., file:./prisma/dev.db) or fallback
function resolveSqlitePath() {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('file:')) {
    // strip file: prefix
    const rel = url.slice('file:'.length);
    return rel || './prisma/dev.db';
  }
  // allow SQLITE_PATH override
  return process.env.SQLITE_PATH || './prisma/dev.db';
}

let _sequelize: Sequelize | null = null;
export function getSequelize(): Sequelize {
  if (!_sequelize) {
    const url = process.env.DATABASE_URL || '';
    const isPostgres = url.startsWith('postgres://') || url.startsWith('postgresql://');

    if (isPostgres) {
      _sequelize = new Sequelize(url, {
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 10,
          min: 0,
          idle: 10000,
          acquire: 30000
        }
      });
    } else {
      _sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: resolveSqlitePath(),
        logging: false,
        // Avoid "Please install sqlite3 package manually" by passing the module directly
        dialectModule: sqlite3
      });
    }
  }
  return _sequelize;
}

// Define Models matching previous Prisma schema
export class User extends Model<any, any> {}
export class Account extends Model<any, any> {}
export class Session extends Model<any, any> {}
export class VerificationToken extends Model<any, any> {}
export class Mix extends Model<any, any> {}
export class Track extends Model<any, any> {}
export class Review extends Model<any, any> {}
export class LibraryEntry extends Model<any, any> {}
export class RecommendedMix extends Model<any, any> {}

export const initModels = () => {
  const sequelize = getSequelize();
  User.init({
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: true },
    emailVerified: { type: DataTypes.DATE, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true },
    isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isBanned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    passwordHash: { type: DataTypes.STRING, allowNull: true }
  }, { sequelize, modelName: 'User', tableName: 'User', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });

  Account.init({
    id: { type: DataTypes.STRING, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    providerAccountId: { type: DataTypes.STRING, allowNull: false },
    refresh_token: { type: DataTypes.TEXT },
    access_token: { type: DataTypes.TEXT },
    expires_at: { type: DataTypes.INTEGER },
    token_type: { type: DataTypes.STRING },
    scope: { type: DataTypes.STRING },
    id_token: { type: DataTypes.TEXT },
    session_state: { type: DataTypes.STRING }
  }, { sequelize, modelName: 'Account', tableName: 'Account', timestamps: false, indexes: [{ unique: true, fields: ['provider', 'providerAccountId'] }] });

  Session.init({
    id: { type: DataTypes.STRING, primaryKey: true },
    sessionToken: { type: DataTypes.STRING, unique: true },
    userId: { type: DataTypes.STRING, allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: false }
  }, { sequelize, modelName: 'Session', tableName: 'Session', timestamps: false });

  VerificationToken.init({
    identifier: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, unique: true, allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: false }
  }, { sequelize, modelName: 'VerificationToken', tableName: 'VerificationToken', timestamps: false, indexes: [{ unique: true, fields: ['identifier', 'token'] }] });

  Mix.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    number: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    artist: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING },
    releaseDate: { type: DataTypes.DATE, allowNull: false },
    artworkUrl: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    durationSeconds: { type: DataTypes.INTEGER },
    audioPath: { type: DataTypes.STRING },
    externalUrl: { type: DataTypes.STRING },
    soundcloudUrl: { type: DataTypes.STRING },
    mixcloudUrl: { type: DataTypes.STRING },
    youtubeUrl: { type: DataTypes.STRING },
    spotifyUrl: { type: DataTypes.STRING },
    heroImageUrl: { type: DataTypes.STRING },
    genre: { type: DataTypes.STRING },
    bpmLow: { type: DataTypes.INTEGER },
    bpmHigh: { type: DataTypes.INTEGER },
    location: { type: DataTypes.STRING },
    rating: { type: DataTypes.FLOAT },
    ratingCount: { type: DataTypes.INTEGER }
  }, { sequelize, modelName: 'Mix', tableName: 'Mix', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });

  Track.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false },
    index: { type: DataTypes.INTEGER, allowNull: false },
    timecodeSeconds: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    artist: { type: DataTypes.STRING },
    label: { type: DataTypes.STRING }
  }, { sequelize, modelName: 'Track', tableName: 'Track', timestamps: false, indexes: [{ unique: true, fields: ['mixId', 'index'] }] });

  Review.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.STRING },
    userName: { type: DataTypes.STRING, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    body: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'Review', tableName: 'Review', timestamps: false });

  LibraryEntry.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.STRING, allowNull: false },
    mixId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'LibraryEntry', tableName: 'LibraryEntry', timestamps: false, indexes: [{ unique: true, fields: ['userId', 'mixId'] }] });

  RecommendedMix.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mixId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'RecommendedMix', tableName: 'RecommendedMix', timestamps: false });

  // Associations
  Account.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(Account, { foreignKey: 'userId' });

  Session.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(Session, { foreignKey: 'userId' });

  Track.belongsTo(Mix, { foreignKey: 'mixId', onDelete: 'CASCADE' });
  Mix.hasMany(Track, { foreignKey: 'mixId' });

  Review.belongsTo(Mix, { foreignKey: 'mixId', onDelete: 'CASCADE' });
  Mix.hasMany(Review, { foreignKey: 'mixId' });

  Review.belongsTo(User, { foreignKey: 'userId', onDelete: 'SET NULL' });
  User.hasMany(Review, { foreignKey: 'userId' });

  LibraryEntry.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(LibraryEntry, { foreignKey: 'userId' });

  LibraryEntry.belongsTo(Mix, { foreignKey: 'mixId', onDelete: 'CASCADE' });
  Mix.hasMany(LibraryEntry, { foreignKey: 'mixId' });

  RecommendedMix.belongsTo(Mix, { foreignKey: 'mixId', onDelete: 'CASCADE' });
  Mix.hasOne(RecommendedMix, { foreignKey: 'mixId' });

  return {
    User, Account, Session, VerificationToken, Mix, Track, Review, LibraryEntry, RecommendedMix, Op
  } as const;
};

export type DbModels = ReturnType<typeof initModels>;
