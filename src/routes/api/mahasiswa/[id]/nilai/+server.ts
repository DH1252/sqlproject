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

		const nilai = await prisma.nilai.findMany({
			where: {
				enrollment: {
					is: { mahasiswaId: id }
				}
			},
			include: {
				enrollment: {
					include: {
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
						dosen: { select: { id: true, nip: true, nama: true } },
						semester: { select: { id: true, tahunAjaran: true, semester: true } }
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return apiOk(nilai);
	} catch (error) {
		return handleApiError(error, 'Error fetching mahasiswa nilai:', {}, 'Failed to fetch mahasiswa nilai');
	}
};
