import { Client } from 'minio';

const config = {
	s3: {
		endpoint: Bun.env.S3_ENDPOINT,
		port: Number(Bun.env.S3_PORT || '443'),
		useSSL: Bun.env.S3_USE_SSL === 'true',
		accessKeyId: Bun.env.S3_ACCESS_KEY_ID,
		secretAccessKey: Bun.env.S3_SECRET_ACCESS_KEY,
		host: Bun.env.S3_HOST
	}
};
const BUCKET_NAME = process.env.S3_BUCKET || 'pta';

export const MinioClient = new Client({
	endPoint: config.s3.endpoint, // Replace with your MinIO server address
	port: config.s3.port, // Replace with your MinIO server port
	useSSL: config.s3.useSSL, // Set to true if using SSL
	accessKey: config.s3.accessKeyId, // Replace with your MinIO access key
	secretKey: config.s3.secretAccessKey // Replace with your MinIO secret key
});

async function ensureBucketExists(bucket: string) {
	const exists = await MinioClient.bucketExists(bucket);
	if (!exists) {
		await MinioClient.makeBucket(bucket, 'us-east-1');
	}
}

export async function uploadToS3(
	fileName: string,
	buffer: Buffer,
	contentType = 'application/octet-stream'
) {
	await ensureBucketExists(BUCKET_NAME);
	await MinioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
		'Content-Type': contentType
	});

	return `/${BUCKET_NAME}/${fileName}`;
}

export const getPublicURL = (objectName: string) => {
	const url = `${config.s3.host}/${BUCKET_NAME}/${objectName}`;
	return url;
};
