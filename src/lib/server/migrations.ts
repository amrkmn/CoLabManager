import { log } from '$lib/utils/logger';
import loadSchemaContextPkg from '@prisma/internals';
import migratePkg from '@prisma/migrate';

// @ts-ignore
import ensureDatabaseExistsPkg from '@prisma/migrate/dist/utils/ensureDatabaseExists.js';

const { Migrate } = migratePkg;
const { loadSchemaContext } = loadSchemaContextPkg;
const { ensureDatabaseExists } = ensureDatabaseExistsPkg;

export async function runMigrations() {
	const schemaContext = await loadSchemaContext({
		schemaPathFromArg: './prisma/schema.prisma',
		printLoadMessage: false
	});

	const migrate = await Migrate.setup({
		schemaContext,
		migrationsDirPath: './prisma/migrations'
	});

	const logger = log('migrations');
	logger.debug('running migrations...');

	try {
		logger.debug('ensuring database exists...');

		const dbCreated = await ensureDatabaseExists(schemaContext.primaryDatasource);
		if (dbCreated) {
			logger.info('database created');
		}
	} catch (e) {
		logger.error('failed to create database' + e);
		logger.error('try creating the database manually and running the server again');

		migrate.stop();
		process.exit(1);
	}

	let migrationIds: string[];
	try {
		logger.debug('applying migrations...');
		const { appliedMigrationNames } = await migrate.applyMigrations();
		migrationIds = appliedMigrationNames;
	} catch (e) {
		logger.error('failed to apply migrations' + e);

		migrate.stop();
		process.exit(1);
	} finally {
		migrate.stop();
	}

	if (migrationIds?.length === 0) {
		logger.debug('no migrations applied');
		return;
	}

	logger.info(`applied migrations: ${migrationIds.join(', ')}`);
}
