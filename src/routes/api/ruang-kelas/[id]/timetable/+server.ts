import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { findActiveSemester, semesterSelect } from '$lib/server/semester';
import { apiError, apiOk, handleApiError, parseIdParam, parseOptionalPositiveInt } from '$lib/server/http';
import { buildRoomTimetable } from '$lib/utils/room-timetable';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);
		const requestedSemesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');

		const [room, semester] = await Promise.all([
			prisma.ruangKelas.findUnique({
				where: { id },
				select: {
					id: true,
					kode: true,
					nama: true,
					gedung: true,
					lantai: true,
					kapasitas: true,
					tipe: true
				}
			}),
			requestedSemesterId
				? prisma.semester.findUnique({
						where: { id: requestedSemesterId },
						select: semesterSelect
					})
				: findActiveSemester(prisma)
		]);

		if (!room) {
			return apiError(404, 'Ruang kelas not found');
		}

		if (requestedSemesterId && !semester) {
			return apiError(404, 'Semester not found');
		}

		if (!requestedSemesterId && !semester) {
			return apiError(404, 'No active semester found');
		}

		const semesterId = semester?.id;

		const [slots, enrollments, reservations] = await Promise.all([
			prisma.jadwal.findMany({
				orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }],
				select: { id: true, hari: true, jamMulai: true, jamSelesai: true }
			}),
			prisma.enrollment.findMany({
				where: {
					ruangKelasId: id,
					semesterId,
					status: { not: 'DROPPED' }
				},
				include: {
					mataKuliah: { select: { kode: true, nama: true } },
					dosen: { select: { nama: true } }
				}
			}),
			prisma.jadwalRuangan.findMany({
				where: {
					ruangKelasId: id,
					semesterId
				},
				select: { jadwalId: true, keterangan: true }
			})
		]);

		const report = buildRoomTimetable({
			slots,
			enrollments: enrollments.map((enrollment) => ({
				jadwalId: enrollment.jadwalId,
				mataKuliah: enrollment.mataKuliah,
				dosen: enrollment.dosen
			})),
			reservations
		});

		return apiOk({
			room,
			semester: semester
				? {
					id: semester.id,
					tahunAjaran: semester.tahunAjaran,
					semester: semester.semester
				}
				: null,
			days: report.days,
			summary: report.summary,
			rows: report.rows
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching ruang kelas timetable:', {}, 'Failed to fetch ruang kelas timetable');
	}
};
