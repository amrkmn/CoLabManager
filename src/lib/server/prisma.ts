import PrismaClient from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient.PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient.PrismaClient();

if (Bun.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
