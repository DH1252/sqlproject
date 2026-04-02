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

		const enrollments = await prisma.enrollment.findMany({
			where: { mahasiswaId: id },
			include: {
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				dosen: { select: { id: true, nip: true, nama: true } },
				ruangKelas: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } },
				nilai: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return apiOk(enrollments);
	} catch (error) {
		return handleApiError(error, 'Error fetching mahasiswa enrollments:', {}, 'Failed to fetch mahasiswa enrollments');
	}
};
