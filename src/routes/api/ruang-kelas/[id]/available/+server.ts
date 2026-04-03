import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { summarizeRoomAvailability } from '$lib/server/ruang-kelas-report';
import { apiError, apiOk, handleApiError, parseIdParam, parseOptionalPositiveInt } from '$lib/server/http';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);
		const jadwalId = parseIdParam(url.searchParams.get('jadwalId') ?? undefined, 'jadwalId');
		const semesterId = parseIdParam(url.searchParams.get('semesterId') ?? undefined, 'semesterId');
		const excludeEnrollmentId = parseOptionalPositiveInt(
			url.searchParams.get('excludeEnrollmentId'),
			'excludeEnrollmentId'
		);

		const [ruangKelas, jadwal, jadwalRuanganConflict, enrollmentConflict] = await Promise.all([
			prisma.ruangKelas.findUnique({
				where: { id },
				select: { id: true, status: true }
			}),
			prisma.jadwal.findUnique({
				where: { id: jadwalId },
				select: { id: true }
			}),
			prisma.jadwalRuangan.findUnique({
				where: {
					ruangKelasId_jadwalId_semesterId: {
						ruangKelasId: id,
						jadwalId,
						semesterId
					}
				}
			}),
			prisma.enrollment.findFirst({
				where: {
					ruangKelasId: id,
					jadwalId,
					semesterId,
					...(excludeEnrollmentId && { id: { not: excludeEnrollmentId } }),
					status: { not: 'DROPPED' }
				},
				select: { id: true }
			})
		]);

		if (!ruangKelas) {
			return apiError(404, 'Ruang kelas not found');
		}

		if (!jadwal) {
			return apiError(404, 'Jadwal not found');
		}

		const availability = summarizeRoomAvailability({
			status: ruangKelas.status,
			hasReservedSlot: Boolean(jadwalRuanganConflict),
			hasEnrollmentConflict: Boolean(enrollmentConflict)
		});

		return apiOk({
			available: availability.available,
			...(availability.conflicts.length > 0 && { conflicts: availability.conflicts })
		});
	} catch (error) {
		return handleApiError(error, 'Error checking ruang kelas availability:', {}, 'Failed to check ruang kelas availability');
	}
};
