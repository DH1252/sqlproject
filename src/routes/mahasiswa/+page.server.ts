import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import type { Mahasiswa, ProgramStudi } from '$lib/types';

export const load: PageServerLoad = async () => {
	const limit = 10;

	const [mahasiswa, total, programs] = await Promise.all([
		prisma.mahasiswa.findMany({
			take: limit,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			},
			orderBy: { createdAt: 'desc' }
		}),
		prisma.mahasiswa.count(),
		prisma.programStudi.findMany({
			orderBy: [{ jenjang: 'asc' }, { nama: 'asc' }],
			select: { id: true, kode: true, nama: true, jenjang: true }
		})
	]);

	const initialMahasiswa: Mahasiswa[] = mahasiswa.map((item) => ({
		id: item.id,
		nim: item.nim,
		nama: item.nama,
		email: item.email,
		programStudiId: item.programStudiId,
		programStudi: item.programStudi
			? {
				id: item.programStudi.id,
				kode: item.programStudi.kode,
				nama: item.programStudi.nama,
				jenjang: item.programStudi.jenjang,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		angkatan: item.angkatan,
		status: item.status as Mahasiswa['status'],
		ipk: item.ipk,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	}));

	const initialPrograms: ProgramStudi[] = programs.map((item) => ({
		id: item.id,
		kode: item.kode,
		nama: item.nama,
		jenjang: item.jenjang,
		createdAt: '',
		updatedAt: ''
	}));

	return {
		initialMahasiswa,
		initialPrograms,
		initialPagination: {
			page: 1,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	};
};
