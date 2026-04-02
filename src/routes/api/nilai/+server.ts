import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { syncMahasiswaIpk } from '$lib/server/gpa';
import { apiList, apiOk, handleApiError, httpError, parseOptionalBoolean, parseOptionalPositiveInt, parsePagination, readRequestBody } from '$lib/server/http';
import { validateNilaiCreate } from '$lib/server/validation';
import { calculateGrade } from '$lib/utils/grade-calculator';

const nilaiEnrollmentInclude = {
	enrollment: {
		include: {
			mahasiswa: { select: { id: true, nim: true, nama: true } },
			mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
		}
	}
} as const;

// GET /api/nilai - List all grades
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const enrollmentId = parseOptionalPositiveInt(url.searchParams.get('enrollmentId'), 'enrollmentId');
		const mahasiswaId = parseOptionalPositiveInt(url.searchParams.get('mahasiswaId'), 'mahasiswaId');
		const semesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');
		const includeSemester = parseOptionalBoolean(url.searchParams.get('includeSemester'), 'includeSemester') ?? true;

		const where: any = {
			...(enrollmentId && { enrollmentId })
		};
		const enrollmentWhere: Record<string, unknown> = {
			...(mahasiswaId && { mahasiswaId }),
			...(semesterId && { semesterId })
		};

		if (Object.keys(enrollmentWhere).length > 0) {
			where.enrollment = { is: enrollmentWhere };
		}

		const [nilai, total] = await Promise.all([
			prisma.nilai.findMany({
				where,
				skip,
				take: limit,
				include: {
					enrollment: {
						include: {
							mahasiswa: { select: { id: true, nim: true, nama: true } },
							mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
							...(includeSemester && {
								semester: { select: { id: true, tahunAjaran: true, semester: true } }
							})
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			prisma.nilai.count({ where })
		]);

		return apiList(nilai, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching nilai:', {}, 'Failed to fetch nilai');
	}
};

// POST /api/nilai - Create or update grade
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateNilaiCreate(await readRequestBody(request));

		const result = await prisma.$transaction(
			async (tx) => {
				const [enrollment, existingNilai] = await Promise.all([
					tx.enrollment.findUnique({
						where: { id: data.enrollmentId },
						select: { status: true, mahasiswaId: true }
					}),
					tx.nilai.findUnique({
						where: { enrollmentId: data.enrollmentId },
						select: { id: true }
					})
				]);

				if (!enrollment) {
					httpError(404, 'Enrollment not found');
				}

				if (enrollment.status === 'DROPPED') {
					httpError(409, 'Cannot grade a dropped enrollment');
				}

				const gradeResult = calculateGrade({
					nilaiTugas: data.nilaiTugas ?? null,
					nilaiUTS: data.nilaiUTS ?? null,
					nilaiUAS: data.nilaiUAS ?? null
				});

				const nilai = await tx.nilai.upsert({
					where: { enrollmentId: data.enrollmentId },
					create: {
						...data,
						nilaiTotal: gradeResult?.nilaiTotal ?? null,
						hurufMutu: gradeResult?.hurufMutu ?? null
					},
					update: {
						nilaiTugas: data.nilaiTugas,
						nilaiUTS: data.nilaiUTS,
						nilaiUAS: data.nilaiUAS,
						nilaiTotal: gradeResult?.nilaiTotal ?? null,
						hurufMutu: gradeResult?.hurufMutu ?? null
					},
					include: nilaiEnrollmentInclude
				});

				await syncMahasiswaIpk(tx, enrollment.mahasiswaId);

				return {
					nilai,
					status: existingNilai ? 200 : 201
				};
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		return apiOk(result.nilai, result.status);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating/updating nilai:',
			{ P2003: 'Nilai references an enrollment that does not exist' },
			'Failed to create/update nilai'
		);
	}
};
