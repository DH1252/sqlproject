import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { summarizeMahasiswaIpk } from '$lib/server/gpa';
import { validateMahasiswaUpdate } from '$lib/server/validation';

// GET /api/mahasiswa/[id] - Get student by ID with IPK
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);
		const include = url.searchParams.get('include');
		const includeEnrollments = include === 'enrollments' || include === 'nilai';
		const includeNilai = include === 'nilai';

		const mahasiswa = await prisma.mahasiswa.findUnique({
			where: { id },
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				},
				...(includeEnrollments && {
					enrollments: {
						include: {
							mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
							dosen: { select: { id: true, nip: true, nama: true } },
							semester: { select: { id: true, tahunAjaran: true, semester: true } },
							...(includeNilai && { nilai: true })
						}
					}
				})
			}
		});

		if (!mahasiswa) {
			return apiError(404, 'Mahasiswa not found');
		}

		let ipkData = null;
		if (includeNilai) {
			const ipkEnrollments = await prisma.enrollment.findMany({
				where: { mahasiswaId: id },
				select: {
					status: true,
					nilai: { select: { hurufMutu: true } },
					mataKuliah: { select: { sks: true } }
				}
			});

			ipkData = summarizeMahasiswaIpk(ipkEnrollments);
		}

		return apiOk({
			...mahasiswa,
			...(ipkData && { ipk: ipkData.ipk }),
			...(ipkData && { ipkCalculation: ipkData })
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching mahasiswa:', {}, 'Failed to fetch mahasiswa');
	}
};

// PUT /api/mahasiswa/[id] - Update student
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateMahasiswaUpdate(await readRequestBody(request));

		const mahasiswa = await prisma.mahasiswa.update({
			where: { id },
			data,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(mahasiswa);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating mahasiswa:',
			{
				P2002: 'NIM or email already exists',
				P2025: 'Mahasiswa not found'
			},
			'Failed to update mahasiswa'
		);
	}
};

// DELETE /api/mahasiswa/[id] - Delete student
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.mahasiswa.delete({
			where: { id }
		});

		return apiMessage('Mahasiswa deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting mahasiswa:',
			{
				P2025: 'Mahasiswa not found',
				P2003: 'Cannot delete mahasiswa with related records'
			},
			'Failed to delete mahasiswa'
		);
	}
};
