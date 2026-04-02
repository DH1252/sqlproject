import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiList, apiOk, handleApiError, parseOptionalPositiveInt, parsePagination, readRequestBody } from '$lib/server/http';
import { validateDosenCreate } from '$lib/server/validation';

// GET /api/dosen - List all lecturers
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const search = url.searchParams.get('search') || '';
		const programStudiId = parseOptionalPositiveInt(url.searchParams.get('programStudiId'), 'programStudiId');

		const where: any = {};

		if (search) {
			where.OR = [
				{ nip: { contains: search } },
				{ nama: { contains: search } },
				{ email: { contains: search } }
			];
		}

		if (programStudiId) {
			where.programStudiId = programStudiId;
		}

		const [dosen, total] = await Promise.all([
			prisma.dosen.findMany({
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
			prisma.dosen.count({ where })
		]);

		return apiList(dosen, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching dosen:', {}, 'Failed to fetch dosen');
	}
};

// POST /api/dosen - Create new lecturer
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateDosenCreate(await readRequestBody(request));

		const dosen = await prisma.dosen.create({
			data,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(dosen, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating dosen:',
			{ P2002: 'NIP or email already exists' },
			'Failed to create dosen'
		);
	}
};
