import { Client } from 'minio';

const config = {
	minio: {
		endpoint: Bun.env.MINIO_ENDPOINT,
		port: Number(Bun.env.MINIO_PORT) || undefined,
		useSSL: Bun.env.MINIO_USE_SSL === 'true',
		accessKeyId: Bun.env.MINIO_ACCESS_KEY_ID,
		secretAccessKey: Bun.env.MINIO_SECRET_ACCESS_KEY,
		host: Bun.env.MINIO_HOST
	}
};
const BUCKET_NAME = process.env.MINIO_BUCKET || 'pta';

export const MinioClient = new Client({
	endPoint: config.minio.endpoint, // Replace with your MinIO server address
	port: config.minio.port, // Replace with your MinIO server port
	useSSL: config.minio.useSSL, // Set to true if using SSL
	accessKey: config.minio.accessKeyId, // Replace with your MinIO access key
	secretKey: config.minio.secretAccessKey // Replace with your MinIO secret key
});

async function ensureBucketExists() {
	const exists = await MinioClient.bucketExists(BUCKET_NAME);
	if (!exists) {
		await MinioClient.makeBucket(BUCKET_NAME, 'us-east-1');
	}
}

export async function uploadToMinIO(
	fileName: string,
	buffer: Buffer,
	contentType = 'application/octet-stream'
) {
	await ensureBucketExists();
	await MinioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
		'Content-Type': contentType
	});

	return getPublicURL(fileName);
}

export const getPublicURL = (objectName: string) => {
	const url = `${config.minio.host}/${BUCKET_NAME}/${objectName}`;
	return url;
};
