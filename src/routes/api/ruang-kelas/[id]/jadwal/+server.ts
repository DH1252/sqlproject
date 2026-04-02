import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const ruangKelas = await prisma.ruangKelas.findUnique({
			where: { id },
			select: { id: true }
		});

		if (!ruangKelas) {
			return apiError(404, 'Ruang kelas not found');
		}

		const jadwalRuangan = await prisma.jadwalRuangan.findMany({
			where: { ruangKelasId: id },
			include: {
				jadwal: true,
				semester: { select: { id: true, tahunAjaran: true, semester: true } }
			},
			orderBy: [{ semesterId: 'desc' }, { jadwalId: 'asc' }]
		});

		return apiOk(jadwalRuangan);
	} catch (error) {
		return handleApiError(error, 'Error fetching ruang kelas jadwal:', {}, 'Failed to fetch ruang kelas jadwal');
	}
};
