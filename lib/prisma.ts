import { getSequelize, initModels, Mix as MixModel, Track as TrackModel, Review as ReviewModel, User as UserModel, LibraryEntry as LibraryEntryModel, RecommendedMix as RecommendedMixModel, Account as AccountModel, Session as SessionModel, VerificationToken as VerificationTokenModel } from './sequelize';
import { Op, Transaction } from 'sequelize';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Lazy initialize to avoid running during Next build's analysis.
// Important: model classes are module-scoped and can be recreated during HMR,
// so model init must run per-module-load, while sync can remain global.
const globalDb = globalThis as unknown as { __dbSynced?: boolean; __superAdminBootstrapped?: boolean };
let localModelsInitialized = false;

async function ensureSuperAdminBootstrap() {
	if (globalDb.__superAdminBootstrapped) return;
	const bootstrapEnabled = (process.env.SUPER_ADMIN_BOOTSTRAP ?? '1') === '1';
	const username = (process.env.SUPER_ADMIN_USERNAME || 'essentialmixadmin').trim();
	const password = (process.env.SUPER_ADMIN_PASSWORD || '').trim();
	const resetPasswordOnBoot = (process.env.SUPER_ADMIN_RESET_PASSWORD_ON_BOOT ?? '0') === '1';

	if (!bootstrapEnabled || !username || !password) {
		globalDb.__superAdminBootstrapped = true;
		return;
	}

	const existing = await UserModel.findOne({ where: { name: username } });
	const passwordHash = await bcrypt.hash(password, 10);

	if (!existing) {
		await UserModel.create({
			id: randomUUID(),
			name: username,
			passwordHash,
			isAdmin: true,
			isBanned: false
		});
	} else {
		const updates: any = {};
		if (!existing.get('isAdmin')) updates.isAdmin = true;
		if (existing.get('isBanned')) updates.isBanned = false;
		if (resetPasswordOnBoot) updates.passwordHash = passwordHash;
		if (Object.keys(updates).length) {
			await existing.update(updates);
		}
	}

	globalDb.__superAdminBootstrapped = true;
}

async function ensureInit() {
	if (!localModelsInitialized) {
		initModels();
		localModelsInitialized = true;
	}
	if (!globalDb.__dbSynced) {
		const sequelize = getSequelize();
		let lastError: unknown = null;
		for (let attempt = 1; attempt <= 12; attempt++) {
			try {
				await sequelize.sync();
				lastError = null;
				break;
			} catch (error) {
				lastError = error;
				if (attempt === 12) break;
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}
		if (lastError) throw lastError;
		globalDb.__dbSynced = true;
	}
	await ensureSuperAdminBootstrap();
}

function toSequelizeWhere(where: any) {
	if (!where || typeof where !== 'object') return undefined;
	const w: any = {};
	for (const [key, val] of Object.entries(where as Record<string, any>)) {
		if (key === 'OR' && Array.isArray(val)) {
			w[Op.or] = val.map(toSequelizeWhere);
			continue;
		}
		if (key === 'AND' && Array.isArray(val)) {
			w[Op.and] = val.map(toSequelizeWhere);
			continue;
		}
		if (key === 'recommended' && val && typeof val === 'object') {
			// handled via include.required later
			const v: any = val;
			w.__hasRecommended = v.isNot === null ? false : true;
			continue;
		}
		if (val && typeof val === 'object') {
			if ('contains' in val) {
				const q = `%${val.contains}%`;
				w[key] = { [Op.like]: q };
			} else if ('not' in val) {
				w[key] = { [Op.not]: (val as any).not };
			} else if ('in' in val) {
				w[key] = { [Op.in]: (val as any).in };
			} else if ('notIn' in val) {
				w[key] = { [Op.notIn]: (val as any).notIn };
			} else if ('gt' in (val as any) || 'gte' in (val as any) || 'lt' in (val as any) || 'lte' in (val as any)) {
				const r: any = {};
				const v: any = val;
				if (v.gt !== undefined) r[Op.gt] = v.gt;
				if (v.gte !== undefined) r[Op.gte] = v.gte;
				if (v.lt !== undefined) r[Op.lt] = v.lt;
				if (v.lte !== undefined) r[Op.lte] = v.lte;
				w[key] = r;
			} else {
				// fallback equality
				w[key] = val as any;
			}
		} else if (val !== undefined) {
			w[key] = val;
		}
	}
	return w;
}

function toSequelizeOrder(orderBy: any): any {
	if (!orderBy) return undefined;
	if (Array.isArray(orderBy)) {
		const parts = orderBy.map((o) => toSequelizeOrder(o)).filter(Boolean) as any[];
		return parts.length ? parts.flat() : undefined;
	}
	if (typeof orderBy !== 'object') return undefined;
	const entries = Object.entries(orderBy as Record<string, any>);
	const order: any[] = [];
	for (const [key, dir] of entries) {
		if (key === 'recommended' && dir && typeof dir === 'object') {
			const inner = Object.entries(dir as Record<string, any>)[0];
			if (inner) order.push([RecommendedMixModel, inner[0], String(inner[1]).toUpperCase()]);
		} else {
			order.push([key, String(dir).toUpperCase()]);
		}
	}
	return order.length ? order : undefined;
}

function buildInclude(includeArg: any, where: any) {
	const inc: any[] = [];
	if (includeArg?.recommended) {
		inc.push({ model: RecommendedMixModel, required: where?.__hasRecommended ? true : false });
	}
	if (includeArg?.mix) {
		inc.push({ model: MixModel });
	}
	return inc.length ? inc : undefined;
}

function sanitizeOptions(opts: any) {
	const o = opts && typeof opts === 'object' ? { ...opts } : {};
	// remove internal flag from where if present
	if (o.where && typeof o.where === 'object' && '__hasRecommended' in o.where) {
		const { __hasRecommended, ...rest } = o.where;
		o.where = rest;
	}
	// only keep known keys
	const out: any = {};
	if (o.where && typeof o.where === 'object') out.where = o.where;
	if (o.include && Array.isArray(o.include)) out.include = o.include;
	if (o.order && Array.isArray(o.order)) out.order = o.order;
	if (Number.isInteger(o.offset)) out.offset = o.offset;
	if (Number.isInteger(o.limit)) out.limit = o.limit;
	if (o.transaction) out.transaction = o.transaction;
	if (o.attributes) out.attributes = o.attributes;
	if (o.group) out.group = o.group;
	if (o.raw !== undefined) out.raw = o.raw;
	return out;
}

async function runQuery(
	model: any,
	rawArgs: any,
	type: 'findMany' | 'findFirst' | 'findUnique' | 'count' | 'create' | 'createMany' | 'update' | 'delete' | 'deleteMany' | 'aggregate',
	tx?: any
) {
	await ensureInit();
	const args = rawArgs ?? {};
	const where = args && typeof args === 'object' ? toSequelizeWhere(args.where) : undefined;
	const include = args && typeof args === 'object' && args.include ? buildInclude(args.include, where) : undefined;
	const order = args && typeof args === 'object' ? toSequelizeOrder(args.orderBy) : undefined;

	const optionsRaw: any = { transaction: tx };
	if (where !== undefined) optionsRaw.where = where;
	if (include !== undefined) optionsRaw.include = include;
	if (order !== undefined) optionsRaw.order = order;
	if (args.skip !== undefined) optionsRaw.offset = args.skip;
	if (args.take !== undefined) optionsRaw.limit = args.take;

	const options = sanitizeOptions(optionsRaw);

	switch (type) {
		case 'findMany': {
			return model.findAll(options);
		}
		case 'count': {
				const countOpts: any = { transaction: tx };
				if (options.where) countOpts.where = options.where;
				return model.count(countOpts);
		}
		case 'findFirst': {
			return model.findOne(options);
		}
		case 'findUnique': {
			if (args?.where?.id !== undefined) return model.findByPk(args.where.id, { include, transaction: tx });
			return model.findOne(options);
		}
		case 'create': return model.create(args.data, { transaction: tx });
		case 'createMany': return model.bulkCreate(args.data, { transaction: tx });
		case 'update': {
			if (!options.where) throw new Error('Unsafe update without where');
			await model.update(args.data, { where: options.where, transaction: tx });
			return model.findOne({ where: options.where, transaction: tx });
		}
		case 'delete': {
			if (!options.where) return null;
			const row = await model.findOne({ where: options.where, transaction: tx });
			if (row) await row.destroy({ transaction: tx });
			return row;
		}
		case 'deleteMany': {
			const destroyOpts: any = { transaction: tx };
			if (options.where) destroyOpts.where = options.where;
			return model.destroy(destroyOpts);
		}
		case 'aggregate': {
			const result: any = {};
			if (args?._avg?.rating) {
				const sq = getSequelize();
				const rows = await model.findAll({
					attributes: [[sq.fn('AVG', sq.col('rating')), 'avgRating'], [sq.fn('COUNT', sq.col('rating')), 'countRating']],
					where: options.where,
					raw: true,
					transaction: tx
				});
				const r: any = rows[0] || { avgRating: null, countRating: 0 };
				result._avg = { rating: r.avgRating != null ? Number(r.avgRating) : null };
				result._count = { rating: Number(r.countRating || 0) };
			}
			return result;
		}
	}
}

function modelProxy(model: any) {
	return {
		findMany: (args?: any) => runQuery(model, args, 'findMany'),
		findFirst: (args?: any) => runQuery(model, args, 'findFirst'),
		findUnique: (args: any) => runQuery(model, args, 'findUnique'),
		count: (args?: any) => runQuery(model, args, 'count'),
		create: (args: any) => runQuery(model, args, 'create'),
		createMany: (args: any) => runQuery(model, args, 'createMany'),
		update: (args: any) => runQuery(model, args, 'update'),
		delete: (args: any) => runQuery(model, args, 'delete'),
		deleteMany: (args: any) => runQuery(model, args, 'deleteMany'),
		upsert: async (args: any) => {
			const where = toSequelizeWhere(args.where);
			const found = await model.findOne({ where });
			if (found) {
				await found.update(args.update || {});
				return found;
			}
			return model.create(args.create);
		},
		aggregate: (args: any) => runQuery(model, args, 'aggregate'),
		groupBy: async (args: any) => {
			// Implemented for: groupBy { by:['artist'], _count:{artist:true}, orderBy:{ artist:'asc' } }
			if (Array.isArray(args?.by) && args.by.length === 1 && args.by[0] === 'artist') {
				await ensureInit();
				const sq = getSequelize();
				const where = toSequelizeWhere(args.where);
				const order = toSequelizeOrder(args.orderBy);
				const rows = await model.findAll(sanitizeOptions({
					attributes: ['artist', [sq.fn('COUNT', sq.col('artist')), 'artist_count']],
					where,
					group: ['artist'],
					order,
					raw: true
				}));
				return rows.map((r: any) => ({ artist: r.artist, _count: { artist: Number(r.artist_count) } }));
			}
			throw new Error('groupBy shape not implemented in shim');
		}
	} as const;
}

function modelTxProxy(model: any, t: any) {
	return {
		findMany: (args?: any) => runQuery(model, args, 'findMany', t),
		findFirst: (args?: any) => runQuery(model, args, 'findFirst', t),
		findUnique: (args: any) => runQuery(model, args, 'findUnique', t),
		count: (args?: any) => runQuery(model, args, 'count', t),
		create: (args: any) => runQuery(model, args, 'create', t),
		createMany: (args: any) => runQuery(model, args, 'createMany', t),
		update: (args: any) => runQuery(model, args, 'update', t),
		delete: (args: any) => runQuery(model, args, 'delete', t),
		deleteMany: (args: any) => runQuery(model, args, 'deleteMany', t),
		upsert: async (args: any) => {
			const where = toSequelizeWhere(args.where);
			const found = await model.findOne({ where, transaction: t });
			if (found) {
				await found.update(args.update || {}, { transaction: t });
				return found;
			}
			return model.create(args.create, { transaction: t });
		},
		aggregate: (args: any) => runQuery(model, args, 'aggregate', t)
	} as const;
}

export const prisma = {
	mix: modelProxy(MixModel),
	track: modelProxy(TrackModel),
	review: modelProxy(ReviewModel),
	user: modelProxy(UserModel),
	libraryEntry: modelProxy(LibraryEntryModel),
	recommendedMix: modelProxy(RecommendedMixModel),
	account: modelProxy(AccountModel),
	session: modelProxy(SessionModel),
	verificationToken: modelProxy(VerificationTokenModel),
	$transaction: async <T>(fn: (tx: any) => Promise<T>) => {
		await ensureInit();
		return getSequelize().transaction(async (t: Transaction) => {
			const txProxy = {
				mix: modelTxProxy(MixModel, t),
				track: modelTxProxy(TrackModel, t),
				review: modelTxProxy(ReviewModel, t),
				user: modelTxProxy(UserModel, t),
				libraryEntry: modelTxProxy(LibraryEntryModel, t),
				recommendedMix: modelTxProxy(RecommendedMixModel, t),
				account: modelTxProxy(AccountModel, t),
				session: modelTxProxy(SessionModel, t),
				verificationToken: modelTxProxy(VerificationTokenModel, t)
			} as const;
			return fn(txProxy);
		});
	}
} as const;

