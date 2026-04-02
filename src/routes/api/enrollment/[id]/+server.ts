import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateEnrollmentUpdate } from '$lib/server/validation';

// GET /api/enrollment/[id] - Get enrollment by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const enrollment = await prisma.enrollment.findUnique({
			where: { id },
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				dosen: { select: { id: true, nip: true, nama: true } },
				ruangKelas: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } },
				nilai: true
			}
		});

		if (!enrollment) {
			return apiError(404, 'Enrollment not found');
		}

		return apiOk(enrollment);
	} catch (error) {
		return handleApiError(error, 'Error fetching enrollment:', {}, 'Failed to fetch enrollment');
	}
};

// PUT /api/enrollment/[id] - Update enrollment
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateEnrollmentUpdate(await readRequestBody(request));

		// If changing schedule or room, check for conflicts
		if (data.jadwalId || data.ruangKelasId) {
			const currentEnrollment = await prisma.enrollment.findUnique({
				where: { id }
			});

			if (!currentEnrollment) {
				return apiError(404, 'Enrollment not found');
			}

			const newJadwalId = data.jadwalId ?? currentEnrollment.jadwalId;
			const newRuangKelasId = data.ruangKelasId ?? currentEnrollment.ruangKelasId;

			const studentConflict = await prisma.enrollment.findFirst({
				where: {
					mahasiswaId: currentEnrollment.mahasiswaId,
					jadwalId: newJadwalId,
					semesterId: currentEnrollment.semesterId,
					status: { not: 'DROPPED' },
					id: { not: id }
				}
			});

			if (studentConflict) {
				return apiError(400, 'Schedule conflict: Student already has a class at this time');
			}

			// Check for room conflict
			const roomConflict = await prisma.enrollment.findFirst({
				where: {
					ruangKelasId: newRuangKelasId,
					jadwalId: newJadwalId,
					semesterId: currentEnrollment.semesterId,
					status: { not: 'DROPPED' },
					id: { not: id }
				}
			});

			if (roomConflict) {
				return apiError(400, 'Room conflict: Room is already booked at this time');
			}
		}

		const enrollment = await prisma.enrollment.update({
			where: { id },
			data,
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				dosen: { select: { id: true, nip: true, nama: true } },
				ruangKelas: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } }
			}
		});

		return apiOk(enrollment);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating enrollment:',
			{
				P2025: 'Enrollment not found',
				P2003: 'Enrollment references a related record that does not exist'
			},
			'Failed to update enrollment'
		);
	}
};

// DELETE /api/enrollment/[id] - Delete enrollment
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.enrollment.delete({
			where: { id }
		});

		return apiMessage('Enrollment deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting enrollment:',
			{ P2025: 'Enrollment not found' },
			'Failed to delete enrollment'
		);
	}
};
