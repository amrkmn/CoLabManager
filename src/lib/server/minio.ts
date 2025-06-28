import { env } from '$env/dynamic/private';
import {
	S3Client,
	PutObjectCommand,
	HeadBucketCommand,
	CreateBucketCommand,
	GetObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import path from 'path';

const config = {
	s3: {
		endpoint: env.S3_ENDPOINT ?? '',
		port: Number(env.S3_PORT || '443'),
		useSSL: env.S3_USE_SSL === 'true',
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		host: env.S3_HOST,
		region: env.S3_REGION || 'us-east-1',
		pathStyle: env.S3_FORCE_PATH_STYLE === 'true'
	}
};

const BUCKET_NAME = env.S3_BUCKET || 'pta';

// Create S3 client with proper endpoint configuration
export const s3Client = new S3Client({
	endpoint: config.s3.useSSL
		? `https://${config.s3.endpoint}${config.s3.port !== 443 ? ':' + config.s3.port : ''}`
		: `http://${config.s3.endpoint}${config.s3.port !== 80 ? ':' + config.s3.port : ''}`,
	region: config.s3.region,
	credentials: {
		accessKeyId: config.s3.accessKeyId!,
		secretAccessKey: config.s3.secretAccessKey!
	},
	forcePathStyle: config.s3.pathStyle
});

async function ensureBucketExists(bucket: string) {
	try {
		await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
	} catch (error: any) {
		if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
			try {
				const createBucketParams: any = { Bucket: bucket };

				// Only add LocationConstraint if region is not us-east-1 (default)
				if (config.s3.region && config.s3.region !== 'us-east-1') {
					createBucketParams.CreateBucketConfiguration = {
						LocationConstraint: config.s3.region
					};
				}

				await s3Client.send(new CreateBucketCommand(createBucketParams));
			} catch (createError) {
				console.error('Failed to create bucket:', createError);
				throw createError;
			}
		} else {
			console.error('Error checking bucket existence:', error);
			throw error;
		}
	}
}

export async function uploadToS3(
	fileName: string,
	buffer: Buffer,
	contentType = 'application/octet-stream'
) {
	await ensureBucketExists(BUCKET_NAME);

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileName,
		Body: buffer,
		ContentType: contentType,
		ContentLength: buffer.length
	});

	await s3Client.send(command);
	return fileName;
}

export async function getObjectFromS3(fileName: string): Promise<Buffer> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileName
	});

	const response = await s3Client.send(command);

	if (!response.Body) {
		throw new Error('No body in S3 response');
	}

	// Convert the ReadableStream to Buffer
	const chunks: Uint8Array[] = [];
	const reader = (response.Body as any).getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}

	return Buffer.concat(chunks);
}

export async function deleteFromS3(fileName: string): Promise<void> {
	// Remove the bucket prefix if it exists in the fileName
	if (fileName.startsWith(`/${BUCKET_NAME}/`)) {
		fileName = fileName.substring(BUCKET_NAME.length + 2);
	}
	if (fileName.startsWith('/')) {
		fileName = fileName.substring(1);
	}

	const command = new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileName
	});

	await s3Client.send(command);
}

export const getPublicURL = (objectName: string) => {
	if (objectName.startsWith(`/${BUCKET_NAME}/`)) {
		objectName = objectName.substring(BUCKET_NAME.length + 2);
	}
	if (objectName.startsWith('/')) {
		objectName = objectName.substring(1);
	}
	const url = config.s3.pathStyle
		? `${config.s3.host}/${BUCKET_NAME}/${objectName}`
		: `${config.s3.host.replace('://', `://${BUCKET_NAME}.`)}/${objectName}`;
	return url;
};
