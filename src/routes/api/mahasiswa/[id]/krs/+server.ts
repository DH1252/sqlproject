import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const mahasiswa = await prisma.mahasiswa.findUnique({
			where: { id },
			select: { id: true }
		});

		if (!mahasiswa) {
			return apiError(404, 'Mahasiswa not found');
		}

		const krs = await prisma.kRS.findMany({
			where: { mahasiswaId: id },
			include: {
				semester: { select: { id: true, tahunAjaran: true, semester: true, isActive: true } },
				details: {
					include: {
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return apiOk(krs);
	} catch (error) {
		return handleApiError(error, 'Error fetching mahasiswa KRS:', {}, 'Failed to fetch mahasiswa KRS');
	}
};
