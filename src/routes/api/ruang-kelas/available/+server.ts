import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { summarizeRoomAvailability } from '$lib/server/ruang-kelas-report';
import {
	apiError,
	apiOk,
	handleApiError,
	parseIdParam,
	parseOptionalEnum,
	parseOptionalPositiveInt
} from '$lib/server/http';
import { TipeRuangKelas } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const jadwalId = parseIdParam(url.searchParams.get('jadwalId') ?? undefined, 'jadwalId');
		const semesterId = parseIdParam(url.searchParams.get('semesterId') ?? undefined, 'semesterId');
		const excludeEnrollmentId = parseOptionalPositiveInt(
			url.searchParams.get('excludeEnrollmentId'),
			'excludeEnrollmentId'
		);
		const kapasitasMin = parseOptionalPositiveInt(url.searchParams.get('kapasitasMin'), 'kapasitasMin');
		const tipe = parseOptionalEnum(
			url.searchParams.get('tipe'),
			'tipe',
			Object.values(TipeRuangKelas)
		);

		const [jadwal, ruangKelas, jadwalRuangan, enrollments] = await Promise.all([
			prisma.jadwal.findUnique({
				where: { id: jadwalId },
				select: { id: true, hari: true, jamMulai: true, jamSelesai: true }
			}),
			prisma.ruangKelas.findMany({
				where: {
					...(kapasitasMin && { kapasitas: { gte: kapasitasMin } }),
					...(tipe && { tipe })
				},
				orderBy: [{ status: 'asc' }, { kode: 'asc' }]
			}),
			prisma.jadwalRuangan.findMany({
				where: { jadwalId, semesterId },
				select: { ruangKelasId: true }
			}),
			prisma.enrollment.findMany({
				where: {
					jadwalId,
					semesterId,
					status: { not: 'DROPPED' },
					...(excludeEnrollmentId && { id: { not: excludeEnrollmentId } })
				},
				select: {
					ruangKelasId: true,
					mataKuliahId: true,
					dosenId: true,
					jadwalId: true
				}
			})
		]);

		if (!jadwal) {
			return apiError(404, 'Jadwal not found');
		}

		const reservedRoomIds = new Set(jadwalRuangan.map((item) => item.ruangKelasId));
		const enrollmentCounts = new Map<number, number>();
		const sectionCounts = new Map<number, Set<string>>();

		for (const enrollment of enrollments) {
			enrollmentCounts.set(
				enrollment.ruangKelasId,
				(enrollmentCounts.get(enrollment.ruangKelasId) ?? 0) + 1
			);

			const roomSections = sectionCounts.get(enrollment.ruangKelasId) ?? new Set<string>();
			roomSections.add([enrollment.mataKuliahId, enrollment.dosenId, enrollment.jadwalId].join(':'));
			sectionCounts.set(enrollment.ruangKelasId, roomSections);
		}

		const rooms = ruangKelas
			.map((room) => {
				const availability = summarizeRoomAvailability({
					status: room.status,
					hasReservedSlot: reservedRoomIds.has(room.id),
					hasEnrollmentConflict: enrollmentCounts.has(room.id)
				});

				return {
					...room,
					available: availability.available,
					conflicts: availability.conflicts,
					scheduledSections: sectionCounts.get(room.id)?.size ?? 0,
					studentEnrollments: enrollmentCounts.get(room.id) ?? 0
				};
			})
			.sort(
				(a, b) =>
					Number(b.available) - Number(a.available) ||
					a.kode.localeCompare(b.kode)
			);

		return apiOk({
			jadwalId,
			semesterId,
			summary: {
				totalCount: rooms.length,
				availableCount: rooms.filter((room) => room.available).length,
				unavailableCount: rooms.filter((room) => !room.available).length
			},
			rooms
		});
	} catch (error) {
		return handleApiError(error, 'Error checking ruang kelas availability list:', {}, 'Failed to check ruang kelas availability');
	}
};
