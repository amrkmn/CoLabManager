import { log } from '$lib/utils/logger';
import { exec } from 'child_process';

export async function runMigrations() {
	try {
		await new Promise((resolve, reject) => {
			const proc = exec('yarn prisma migrate deploy');

			proc.stdout?.on('data', (data) => {
				process.stdout.write(data);
			});
			proc.stderr?.on('data', (data) => {
				process.stderr.write(data);
			});

			proc.on('close', (code) => {
				if (code !== 0) reject(new Error(`Migration process exited with code ${code}`));
				else resolve(null);
			});
		});
	} catch (error) {
		log('db').error('Error running migrations: ' + error);
		process.exit(1);
	}
}
