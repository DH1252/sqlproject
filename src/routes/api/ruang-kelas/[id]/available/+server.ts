import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);
		const jadwalId = parseIdParam(url.searchParams.get('jadwalId') ?? undefined, 'jadwalId');
		const semesterId = parseIdParam(url.searchParams.get('semesterId') ?? undefined, 'semesterId');

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

		const conflicts: string[] = [];

		if (ruangKelas.status !== 'AVAILABLE') {
			conflicts.push(`Room status is ${ruangKelas.status}`);
		}
		if (jadwalRuanganConflict) {
			conflicts.push('Room is reserved in jadwal ruangan for this semester and slot');
		}
		if (enrollmentConflict) {
			conflicts.push('Room is already assigned to an active enrollment for this semester and slot');
		}

		return apiOk({
			available: conflicts.length === 0,
			...(conflicts.length > 0 && { conflicts })
		});
	} catch (error) {
		return handleApiError(error, 'Error checking ruang kelas availability:', {}, 'Failed to check ruang kelas availability');
	}
};
