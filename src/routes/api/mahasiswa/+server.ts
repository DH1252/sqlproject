import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { StatusMahasiswa } from '$lib/types';
import {
	apiList,
	apiOk,
	handleApiError,
	parseOptionalEnum,
	parseOptionalPositiveInt,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateMahasiswaCreate } from '$lib/server/validation';

// GET /api/mahasiswa - List all students with pagination
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const search = url.searchParams.get('search') || '';
		const programStudiId = parseOptionalPositiveInt(url.searchParams.get('programStudiId'), 'programStudiId');
		const status = parseOptionalEnum(url.searchParams.get('status'), 'status', Object.values(StatusMahasiswa));

		const where: any = {};

		if (search) {
			where.OR = [
				{ nim: { contains: search } },
				{ nama: { contains: search } },
				{ email: { contains: search } }
			];
		}

		if (programStudiId) {
			where.programStudiId = programStudiId;
		}

		if (status) {
			where.status = status;
		}

		const [mahasiswa, total] = await Promise.all([
			prisma.mahasiswa.findMany({
				where,
				skip,
				take: limit,
				include: {
					programStudi: {
						select: { id: true, kode: true, nama: true, jenjang: true }
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			prisma.mahasiswa.count({ where })
		]);

		return apiList(mahasiswa, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching mahasiswa:', {}, 'Failed to fetch mahasiswa');
	}
};

// POST /api/mahasiswa - Create new student
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateMahasiswaCreate(await readRequestBody(request));

		const mahasiswa = await prisma.mahasiswa.create({
			data: {
				...data
			},
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(mahasiswa, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating mahasiswa:',
			{ P2002: 'NIM or email already exists' },
			'Failed to create mahasiswa'
		);
	}
};
