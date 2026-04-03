import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	const [totalMahasiswa, totalDosen, totalMataKuliah, totalRuangKelas, activeSemester, recentEnrollments] = await Promise.all([
		prisma.mahasiswa.count(),
		prisma.dosen.count(),
		prisma.mataKuliah.count(),
		prisma.ruangKelas.count(),
		prisma.semester.findFirst({
			where: { isActive: true },
			select: {
				id: true,
				tahunAjaran: true,
				semester: true,
				isActive: true
			}
		}),
		prisma.enrollment.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				status: true,
				mahasiswa: {
					select: {
						id: true,
						nama: true
					}
				},
				mataKuliah: {
					select: {
						id: true,
						nama: true
					}
				}
			}
		})
	]);

	return {
		title: 'Dashboard Akademik',
		stats: {
			totalMahasiswa,
			totalDosen,
			totalMataKuliah,
			totalRuangKelas
		},
		activeSemester,
		recentEnrollments
	};
};
