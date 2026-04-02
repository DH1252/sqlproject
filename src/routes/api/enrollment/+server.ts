import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { StatusEnrollment } from '$lib/types';
import {
	apiError,
	apiList,
	apiOk,
	handleApiError,
	parseOptionalEnum,
	parseOptionalPositiveInt,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateEnrollmentCreate } from '$lib/server/validation';

// GET /api/enrollment - List all enrollments
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const mahasiswaId = parseOptionalPositiveInt(url.searchParams.get('mahasiswaId'), 'mahasiswaId');
		const mataKuliahId = parseOptionalPositiveInt(url.searchParams.get('mataKuliahId'), 'mataKuliahId');
		const dosenId = parseOptionalPositiveInt(url.searchParams.get('dosenId'), 'dosenId');
		const semesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');
		const status = parseOptionalEnum(url.searchParams.get('status'), 'status', Object.values(StatusEnrollment));

		const where: any = {};

		if (mahasiswaId) {
			where.mahasiswaId = mahasiswaId;
		}

		if (mataKuliahId) {
			where.mataKuliahId = mataKuliahId;
		}

		if (dosenId) {
			where.dosenId = dosenId;
		}

		if (semesterId) {
			where.semesterId = semesterId;
		}

		if (status) {
			where.status = status;
		}

		const [enrollments, total] = await Promise.all([
			prisma.enrollment.findMany({
				where,
				skip,
				take: limit,
				include: {
					mahasiswa: { select: { id: true, nim: true, nama: true } },
					mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
					dosen: { select: { id: true, nip: true, nama: true } },
					ruangKelas: { select: { id: true, kode: true, nama: true } },
					jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
					semester: { select: { id: true, tahunAjaran: true, semester: true } },
					nilai: true
				},
				orderBy: { createdAt: 'desc' }
			}),
			prisma.enrollment.count({ where })
		]);

		return apiList(enrollments, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching enrollments:', {}, 'Failed to fetch enrollments');
	}
};

// POST /api/enrollment - Create new enrollment
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateEnrollmentCreate(await readRequestBody(request));

		// Check for schedule conflict for the student
		const existingEnrollment = await prisma.enrollment.findFirst({
			where: {
				mahasiswaId: data.mahasiswaId,
				jadwalId: data.jadwalId,
				semesterId: data.semesterId,
				status: { not: 'DROPPED' }
			}
		});

		if (existingEnrollment) {
			return apiError(400, 'Schedule conflict: Student already has a class at this time');
		}

		// Check for room conflict
		const roomConflict = await prisma.enrollment.findFirst({
			where: {
				ruangKelasId: data.ruangKelasId,
				jadwalId: data.jadwalId,
				semesterId: data.semesterId,
				status: { not: 'DROPPED' }
			}
		});

		if (roomConflict) {
			return apiError(400, 'Room conflict: Room is already booked at this time');
		}

		const enrollment = await prisma.enrollment.create({
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

		return apiOk(enrollment, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating enrollment:',
			{
				P2002: 'Student is already enrolled in this course for this semester',
				P2003: 'Enrollment references a related record that does not exist'
			},
			'Failed to create enrollment'
		);
	}
};
