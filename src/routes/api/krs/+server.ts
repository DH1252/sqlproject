import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { StatusKRS } from '$lib/types';
import {
	apiList,
	apiOk,
	handleApiError,
	parseOptionalEnum,
	parseOptionalPositiveInt,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateKRSCreate } from '$lib/server/validation';

// GET /api/krs - List all KRS
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const mahasiswaId = parseOptionalPositiveInt(url.searchParams.get('mahasiswaId'), 'mahasiswaId');
		const semesterId = parseOptionalPositiveInt(url.searchParams.get('semesterId'), 'semesterId');
		const status = parseOptionalEnum(url.searchParams.get('status'), 'status', Object.values(StatusKRS));

		const where: any = {};

		if (mahasiswaId) {
			where.mahasiswaId = mahasiswaId;
		}

		if (semesterId) {
			where.semesterId = semesterId;
		}

		if (status) {
			where.status = status;
		}

		const [krs, total] = await Promise.all([
			prisma.kRS.findMany({
				where,
				skip,
				take: limit,
				include: {
					mahasiswa: {
						select: { id: true, nim: true, nama: true },
						include: { programStudi: { select: { id: true, kode: true, nama: true } } }
					},
					semester: { select: { id: true, tahunAjaran: true, semester: true } },
					details: {
						include: {
							mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			prisma.kRS.count({ where })
		]);

		// Calculate total SKS for each KRS
		const krsWithTotalSks = krs.map((k: any) => ({
			...k,
			totalSks: k.details.reduce((sum: number, d: any) => sum + d.mataKuliah.sks, 0)
		}));

		return apiList(krsWithTotalSks, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching KRS:', {}, 'Failed to fetch KRS');
	}
};

// POST /api/krs - Create new KRS
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateKRSCreate(await readRequestBody(request));

		const krs = await prisma.kRS.create({
			data: {
				...data,
				status: 'DRAFT'
			},
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } }
			}
		});

		return apiOk(krs, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating KRS:',
			{
				P2002: 'KRS already exists for this student and semester',
				P2003: 'KRS references a mahasiswa or semester that does not exist'
			},
			'Failed to create KRS'
		);
	}
};
