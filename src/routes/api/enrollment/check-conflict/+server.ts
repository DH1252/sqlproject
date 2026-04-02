import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiOk, handleApiError, parseIdParam, parseOptionalPositiveInt } from '$lib/server/http';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const mahasiswaId = parseIdParam(url.searchParams.get('mahasiswaId') ?? undefined, 'mahasiswaId');
		const jadwalId = parseIdParam(url.searchParams.get('jadwalId') ?? undefined, 'jadwalId');
		const semesterId = parseIdParam(url.searchParams.get('semesterId') ?? undefined, 'semesterId');
		const excludeId = parseOptionalPositiveInt(url.searchParams.get('excludeId'), 'excludeId');

		const jadwal = await prisma.jadwal.findUnique({
			where: { id: jadwalId },
			select: { hari: true, jamMulai: true, jamSelesai: true }
		});

		if (!jadwal) {
			return apiOk({ hasConflict: false, conflicts: [] });
		}

		const conflicts = await prisma.enrollment.findMany({
			where: {
				mahasiswaId,
				semesterId,
				status: { not: 'DROPPED' },
				...(excludeId && { id: { not: excludeId } }),
				jadwal: {
					is: {
						hari: jadwal.hari,
						jamMulai: { lt: jadwal.jamSelesai },
						jamSelesai: { gt: jadwal.jamMulai }
					}
				}
			},
			include: {
				mataKuliah: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } }
			}
		});

		return apiOk({
			hasConflict: conflicts.length > 0,
			conflicts
		});
	} catch (error) {
		return handleApiError(error, 'Error checking enrollment conflict:', {}, 'Failed to check enrollment conflict');
	}
};
