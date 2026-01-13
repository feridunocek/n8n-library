import 'dotenv/config'; // Ensure env is loaded
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Fallback to a dummy URL for build time if env is missing.
// This prevents build errors during static generation.
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/n8n_hub";

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
} as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
