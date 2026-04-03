import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { summarizeRoomUtilization } from '$lib/server/ruang-kelas-report';
import { findActiveSemester, semesterSelect } from '$lib/server/semester';
import { apiError, apiOk, handleApiError, parseOptionalPositiveInt } from '$lib/server/http';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const requestedSemesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');

		const semester = requestedSemesterId
			? await prisma.semester.findUnique({
					where: { id: requestedSemesterId },
					select: semesterSelect
				})
			: await findActiveSemester(prisma);

		if (requestedSemesterId && !semester) {
			return apiError(404, 'Semester not found');
		}

		const semesterId = semester?.id;

		const [rooms, totalSlots, reservations, enrollments] = await Promise.all([
			prisma.ruangKelas.findMany({
				orderBy: { kode: 'asc' }
			}),
			prisma.jadwal.count(),
			prisma.jadwalRuangan.findMany({
				where: {
					...(semesterId && { semesterId })
				},
				select: { ruangKelasId: true, jadwalId: true }
			}),
			prisma.enrollment.findMany({
				where: {
					status: { not: 'DROPPED' },
					...(semesterId && { semesterId })
				},
				select: {
					ruangKelasId: true,
					jadwalId: true,
					mataKuliahId: true,
					dosenId: true,
					semesterId: true
				}
			})
		]);

		const report = summarizeRoomUtilization({
			rooms,
			totalSlots,
			reservations,
			enrollments
		});

		return apiOk({
			semester: semester
				? {
					id: semester.id,
					tahunAjaran: semester.tahunAjaran,
					semester: semester.semester
				}
				: null,
			summary: report.summary,
			rooms: report.rooms
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching ruang kelas utilization:', {}, 'Failed to fetch ruang kelas utilization');
	}
};
