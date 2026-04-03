import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import type { ProgramStudi } from '$lib/types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const [programs, total] = await Promise.all([
		prisma.programStudi.findMany({
			take: limit,
			orderBy: { createdAt: 'desc' }
		}),
		prisma.programStudi.count()
	]);

	const initialPrograms: ProgramStudi[] = programs.map((item) => ({
		id: item.id,
		kode: item.kode,
		nama: item.nama,
		jenjang: item.jenjang,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	}));

	return {
		initialPrograms,
		initialPagination: {
			page: 1,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	};
};
