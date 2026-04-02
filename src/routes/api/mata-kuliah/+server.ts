import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiList, apiOk, handleApiError, parseOptionalPositiveInt, parsePagination, readRequestBody } from '$lib/server/http';
import { validateMataKuliahCreate } from '$lib/server/validation';

// GET /api/mata-kuliah - List all courses
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const search = url.searchParams.get('search') || '';
		const programStudiId = parseOptionalPositiveInt(url.searchParams.get('programStudiId'), 'programStudiId');
		const semester = parseOptionalPositiveInt(url.searchParams.get('semester'), 'semester');

		const where: any = {};

		if (search) {
			where.OR = [
				{ kode: { contains: search } },
				{ nama: { contains: search } }
			];
		}

		if (programStudiId) {
			where.programStudiId = programStudiId;
		}

		if (semester) {
			where.semester = semester;
		}

		const [mataKuliah, total] = await Promise.all([
			prisma.mataKuliah.findMany({
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
			prisma.mataKuliah.count({ where })
		]);

		return apiList(mataKuliah, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching mata kuliah:', {}, 'Failed to fetch mata kuliah');
	}
};

// POST /api/mata-kuliah - Create new course
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateMataKuliahCreate(await readRequestBody(request));

		const mataKuliah = await prisma.mataKuliah.create({
			data,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(mataKuliah, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating mata kuliah:',
			{ P2002: 'Kode mata kuliah already exists' },
			'Failed to create mata kuliah'
		);
	}
};
