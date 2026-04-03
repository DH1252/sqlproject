import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import type { Semester } from '$lib/types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const [semesters, total] = await Promise.all([
		prisma.semester.findMany({
			take: limit,
			orderBy: { createdAt: 'desc' }
		}),
		prisma.semester.count()
	]);

	const initialSemesters: Semester[] = semesters.map((item) => ({
		id: item.id,
		tahunAjaran: item.tahunAjaran,
		semester: item.semester as Semester['semester'],
		isActive: item.isActive,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	}));

	return {
		initialSemesters,
		initialPagination: {
			page: 1,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	};
};
