import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiList, apiOk, handleApiError, parseOptionalPositiveInt, parsePagination, readRequestBody } from '$lib/server/http';
import { validateNilaiCreate } from '$lib/server/validation';
import { calculateGrade } from '$lib/utils/grade-calculator';

// GET /api/nilai - List all grades
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const enrollmentId = parseOptionalPositiveInt(url.searchParams.get('enrollmentId'), 'enrollmentId');

		const where: any = {};

		if (enrollmentId) {
			where.enrollmentId = enrollmentId;
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
							semester: { select: { id: true, tahunAjaran: true, semester: true } }
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

		// Calculate grade
		const gradeResult = calculateGrade({
			nilaiTugas: data.nilaiTugas ?? null,
			nilaiUTS: data.nilaiUTS ?? null,
			nilaiUAS: data.nilaiUAS ?? null
		});

		// Upsert nilai
		const nilai = await prisma.nilai.upsert({
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
			include: {
				enrollment: {
					include: {
						mahasiswa: { select: { id: true, nim: true, nama: true } },
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
					}
				}
			}
		});

		return apiOk(nilai, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating/updating nilai:',
			{ P2003: 'Nilai references an enrollment that does not exist' },
			'Failed to create/update nilai'
		);
	}
};
