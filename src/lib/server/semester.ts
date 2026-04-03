import type { Prisma, PrismaClient } from '@prisma/client';

export const semesterSelect = {
	id: true,
	tahunAjaran: true,
	semester: true,
	isActive: true,
	createdAt: true,
	updatedAt: true
} as const;

type SemesterClient = Pick<PrismaClient, 'semester'> | Pick<Prisma.TransactionClient, 'semester'>;

export async function findActiveSemester(client: SemesterClient) {
	return client.semester.findFirst({
		where: { isActive: true },
		select: semesterSelect,
		orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
	});
}
