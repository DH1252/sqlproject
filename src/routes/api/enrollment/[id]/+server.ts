import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { validateEnrollmentConflicts } from '$lib/server/enrollment';
import { apiError, apiMessage, apiOk, handleApiError, httpError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateEnrollmentUpdate } from '$lib/server/validation';

const enrollmentInclude = {
	mahasiswa: { select: { id: true, nim: true, nama: true } },
	mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
	dosen: { select: { id: true, nip: true, nama: true } },
	ruangKelas: { select: { id: true, kode: true, nama: true } },
	jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
	semester: { select: { id: true, tahunAjaran: true, semester: true } },
	nilai: true
} as const;

// GET /api/enrollment/[id] - Get enrollment by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const enrollment = await prisma.enrollment.findUnique({
			where: { id },
			include: enrollmentInclude
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

		const enrollment = await prisma.$transaction(
			async (tx) => {
				const currentEnrollment = await tx.enrollment.findUnique({
					where: { id },
					select: {
						id: true,
						mahasiswaId: true,
						mataKuliahId: true,
						dosenId: true,
						ruangKelasId: true,
						jadwalId: true,
						semesterId: true,
						status: true
					}
				});

				if (!currentEnrollment) {
					httpError(404, 'Enrollment not found');
				}

				const candidate = {
					mahasiswaId: currentEnrollment.mahasiswaId,
					mataKuliahId: currentEnrollment.mataKuliahId,
					dosenId: data.dosenId ?? currentEnrollment.dosenId,
					ruangKelasId: data.ruangKelasId ?? currentEnrollment.ruangKelasId,
					jadwalId: data.jadwalId ?? currentEnrollment.jadwalId,
					semesterId: currentEnrollment.semesterId,
					status: data.status ?? currentEnrollment.status
				};

				await validateEnrollmentConflicts(tx, candidate, { excludeEnrollmentId: id });

				return tx.enrollment.update({
					where: { id },
					data,
					include: enrollmentInclude
				});
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

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
