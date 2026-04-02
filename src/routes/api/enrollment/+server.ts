import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { validateEnrollmentConflicts } from '$lib/server/enrollment';
import { syncMahasiswaIpk } from '$lib/server/gpa';
import { StatusEnrollment } from '$lib/types';
import {
	apiList,
	apiOk,
	handleApiError,
	httpError,
	parseOptionalBoolean,
	parseOptionalEnum,
	parseOptionalPositiveInt,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateEnrollmentCreate } from '$lib/server/validation';

const enrollmentInclude = {
	mahasiswa: { select: { id: true, nim: true, nama: true } },
	mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
	dosen: { select: { id: true, nip: true, nama: true } },
	ruangKelas: { select: { id: true, kode: true, nama: true } },
	jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } }
} as const;

// GET /api/enrollment - List all enrollments
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const mahasiswaId = parseOptionalPositiveInt(url.searchParams.get('mahasiswaId'), 'mahasiswaId');
		const mataKuliahId = parseOptionalPositiveInt(url.searchParams.get('mataKuliahId'), 'mataKuliahId');
		const dosenId = parseOptionalPositiveInt(url.searchParams.get('dosenId'), 'dosenId');
		const semesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');
		const status = parseOptionalEnum(url.searchParams.get('status'), 'status', Object.values(StatusEnrollment));
		const includeSemester = parseOptionalBoolean(url.searchParams.get('includeSemester'), 'includeSemester') ?? true;
		const includeNilai = parseOptionalBoolean(url.searchParams.get('includeNilai'), 'includeNilai') ?? true;

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
					...enrollmentInclude,
					...(includeSemester && {
						semester: { select: { id: true, tahunAjaran: true, semester: true } }
					}),
					...(includeNilai && { nilai: true })
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

		const enrollment = await prisma.$transaction(
			async (tx) => {
				const existingEnrollment = await tx.enrollment.findUnique({
					where: {
						mahasiswaId_mataKuliahId_semesterId: {
							mahasiswaId: data.mahasiswaId,
							mataKuliahId: data.mataKuliahId,
							semesterId: data.semesterId
						}
					},
					select: { id: true, status: true }
				});

				if (existingEnrollment && existingEnrollment.status !== 'DROPPED') {
					httpError(409, 'Student is already enrolled in this course for this semester');
				}

				await validateEnrollmentConflicts(tx, data, {
					excludeEnrollmentId: existingEnrollment?.status === 'DROPPED' ? existingEnrollment.id : undefined
				});

				if (existingEnrollment?.status === 'DROPPED') {
					const enrollment = await tx.enrollment.update({
						where: { id: existingEnrollment.id },
						data,
						include: {
							...enrollmentInclude,
							semester: { select: { id: true, tahunAjaran: true, semester: true } }
						}
					});

					await syncMahasiswaIpk(tx, data.mahasiswaId);

					return enrollment;
				}

				const enrollment = await tx.enrollment.create({
					data,
					include: {
						...enrollmentInclude,
						semester: { select: { id: true, tahunAjaran: true, semester: true } }
					}
				});

				await syncMahasiswaIpk(tx, data.mahasiswaId);

				return enrollment;
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

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
