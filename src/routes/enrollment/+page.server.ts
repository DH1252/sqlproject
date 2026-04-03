import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import type { Enrollment } from '$lib/types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const [enrollments, total] = await Promise.all([
		prisma.enrollment.findMany({
			take: limit,
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
				dosen: { select: { id: true, nip: true, nama: true } },
				ruangKelas: { select: { id: true, kode: true, nama: true } },
				jadwal: { select: { id: true, hari: true, jamMulai: true, jamSelesai: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } },
				nilai: true
			},
			orderBy: { createdAt: 'desc' }
		}),
		prisma.enrollment.count()
	]);

	const initialEnrollments = enrollments.map((item) => ({
		id: item.id,
		mahasiswaId: item.mahasiswaId,
		mahasiswa: item.mahasiswa
			? {
				id: item.mahasiswa.id,
				nim: item.mahasiswa.nim,
				nama: item.mahasiswa.nama,
				email: '',
				programStudiId: 0,
				angkatan: 0,
				status: 'ACTIVE' as any,
				ipk: 0,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		mataKuliahId: item.mataKuliahId,
		mataKuliah: item.mataKuliah
			? {
				id: item.mataKuliah.id,
				kode: item.mataKuliah.kode,
				nama: item.mataKuliah.nama,
				sks: item.mataKuliah.sks,
				semester: 1,
				programStudiId: 0,
				deskripsi: null,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		dosenId: item.dosenId,
		dosen: item.dosen
			? {
				id: item.dosen.id,
				nip: item.dosen.nip,
				nama: item.dosen.nama,
				email: '',
				programStudiId: 0,
				jabatan: '',
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		ruangKelasId: item.ruangKelasId,
		ruangKelas: item.ruangKelas
			? {
				id: item.ruangKelas.id,
				kode: item.ruangKelas.kode,
				nama: item.ruangKelas.nama,
				tipe: 'REGULER' as any,
				kapasitas: 0,
				hasProyektor: false,
				hasAC: false,
				gedung: '',
				lantai: 0,
				status: 'AVAILABLE' as any,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		jadwalId: item.jadwalId,
		jadwal: item.jadwal
			? {
				id: item.jadwal.id,
				hari: item.jadwal.hari as any,
				jamMulai: item.jadwal.jamMulai,
				jamSelesai: item.jadwal.jamSelesai,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		semesterId: item.semesterId,
		semester: item.semester
			? {
				id: item.semester.id,
				tahunAjaran: item.semester.tahunAjaran,
				semester: item.semester.semester as any,
				isActive: false,
				createdAt: '',
				updatedAt: ''
			}
			: undefined,
		status: item.status as Enrollment['status'],
		nilai: item.nilai
			? {
				id: item.nilai.id,
				enrollmentId: item.nilai.enrollmentId,
				nilaiTugas: item.nilai.nilaiTugas,
				nilaiUTS: item.nilai.nilaiUTS,
				nilaiUAS: item.nilai.nilaiUAS,
				nilaiTotal: item.nilai.nilaiTotal,
				hurufMutu: item.nilai.hurufMutu,
				createdAt: item.nilai.createdAt.toISOString(),
				updatedAt: item.nilai.updatedAt.toISOString()
			}
			: undefined,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	})) as Enrollment[];

	return {
		initialEnrollments,
		initialPagination: {
			page: 1,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	};
};
