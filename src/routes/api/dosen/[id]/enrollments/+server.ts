import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const dosen = await prisma.dosen.findUnique({
			where: { id },
			select: { id: true }
		});

		if (!dosen) {
			return apiError(404, 'Dosen not found');
		}

		const enrollments = await prisma.enrollment.findMany({
			where: { dosenId: id },
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				ruangKelas: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } },
				nilai: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return apiOk(enrollments);
	} catch (error) {
		return handleApiError(error, 'Error fetching dosen enrollments:', {}, 'Failed to fetch dosen enrollments');
	}
};
