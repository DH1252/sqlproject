import { PrismaClient, TipeRuangKelas, JenisSemester, Hari, StatusMahasiswa, StatusEnrollment, StatusKRS, StatusRuangKelas } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Starting seed...');

	// Clean existing data
	await prisma.nilai.deleteMany();
	await prisma.kRSDetail.deleteMany();
	await prisma.kRS.deleteMany();
	await prisma.enrollment.deleteMany();
	await prisma.jadwalRuangan.deleteMany();
	await prisma.jadwal.deleteMany();
	await prisma.nilai.deleteMany();
	await prisma.mataKuliah.deleteMany();
	await prisma.ruangKelas.deleteMany();
	await prisma.dosen.deleteMany();
	await prisma.mahasiswa.deleteMany();
	await prisma.semester.deleteMany();
	await prisma.programStudi.deleteMany();

	console.log('Cleaned existing data');

	// 1. Create Program Studi
	const programStudi = await Promise.all([
		prisma.programStudi.create({
			data: { kode: 'TI', nama: 'Teknik Informatika', jenjang: 'S1' }
		}),
		prisma.programStudi.create({
			data: { kode: 'SI', nama: 'Sistem Informasi', jenjang: 'S1' }
		}),
		prisma.programStudi.create({
			data: { kode: 'MI', nama: 'Manajemen Informatika', jenjang: 'D3' }
		})
	]);

	console.log('Created Program Studi:', programStudi.length);

	// 2. Create Semester
	const semester = await Promise.all([
		prisma.semester.create({
			data: { tahunAjaran: '2024/2025', semester: JenisSemester.GANJIL, isActive: true }
		}),
		prisma.semester.create({
			data: { tahunAjaran: '2024/2025', semester: JenisSemester.GENAP, isActive: false }
		})
	]);

	console.log('Created Semester:', semester.length);

	// 3. Create Dosen
	const dosen = await Promise.all([
		prisma.dosen.create({
			data: { nip: 'DSN001', nama: 'Dr. Ahmad Wijaya', email: 'ahmad.wijaya@univ.ac.id', programStudiId: programStudi[0].id, jabatan: 'Lektor Kepala' }
		}),
		prisma.dosen.create({
			data: { nip: 'DSN002', nama: 'Prof. Budi Santoso', email: 'budi.santoso@univ.ac.id', programStudiId: programStudi[0].id, jabatan: 'Guru Besar' }
		}),
		prisma.dosen.create({
			data: { nip: 'DSN003', nama: 'Dr. Citra Dewi', email: 'citra.dewi@univ.ac.id', programStudiId: programStudi[1].id, jabatan: 'Lektor' }
		}),
		prisma.dosen.create({
			data: { nip: 'DSN004', nama: 'Drs. Eko Prasetyo', email: 'eko.prasetyo@univ.ac.id', programStudiId: programStudi[1].id, jabatan: 'Asisten Ahli' }
		})
	]);

	console.log('Created Dosen:', dosen.length);

	// 4. Create Mahasiswa
	const mahasiswa = await Promise.all([
		prisma.mahasiswa.create({
			data: { nim: '2024001', nama: 'Andi Pratama', email: 'andi.pratama@student.univ.ac.id', programStudiId: programStudi[0].id, angkatan: 2024, status: StatusMahasiswa.ACTIVE, ipk: 0.0 }
		}),
		prisma.mahasiswa.create({
			data: { nim: '2024002', nama: 'Bella Sari', email: 'bella.sari@student.univ.ac.id', programStudiId: programStudi[0].id, angkatan: 2024, status: StatusMahasiswa.ACTIVE, ipk: 0.0 }
		}),
		prisma.mahasiswa.create({
			data: { nim: '2023001', nama: 'Charlie Putra', email: 'charlie.putra@student.univ.ac.id', programStudiId: programStudi[1].id, angkatan: 2023, status: StatusMahasiswa.ACTIVE, ipk: 3.5 }
		}),
		prisma.mahasiswa.create({
			data: { nim: '2023002', nama: 'Diana Lestari', email: 'diana.lestari@student.univ.ac.id', programStudiId: programStudi[1].id, angkatan: 2023, status: StatusMahasiswa.ACTIVE, ipk: 3.75 }
		}),
		prisma.mahasiswa.create({
			data: { nim: '2022001', nama: 'Evan Kurniawan', email: 'evan.kurniawan@student.univ.ac.id', programStudiId: programStudi[0].id, angkatan: 2022, status: StatusMahasiswa.ACTIVE, ipk: 3.25 }
		})
	]);

	console.log('Created Mahasiswa:', mahasiswa.length);

	// 5. Create Mata Kuliah
	const mataKuliah = await Promise.all([
		prisma.mataKuliah.create({
			data: { kode: 'IF101', nama: 'Pemrograman Dasar', sks: 3, semester: 1, programStudiId: programStudi[0].id, deskripsi: 'Pengenalan algoritma dan pemrograman' }
		}),
		prisma.mataKuliah.create({
			data: { kode: 'IF102', nama: 'Struktur Data', sks: 3, semester: 2, programStudiId: programStudi[0].id, deskripsi: 'Konsep struktur data dan algoritma' }
		}),
		prisma.mataKuliah.create({
			data: { kode: 'IF201', nama: 'Basis Data', sks: 4, semester: 3, programStudiId: programStudi[0].id, deskripsi: 'Konsep dan implementasi basis data' }
		}),
		prisma.mataKuliah.create({
			data: { kode: 'SI101', nama: 'Pengantar Sistem Informasi', sks: 3, semester: 1, programStudiId: programStudi[1].id, deskripsi: 'Pengenalan sistem informasi' }
		}),
		prisma.mataKuliah.create({
			data: { kode: 'SI201', nama: 'Analisis Sistem', sks: 3, semester: 3, programStudiId: programStudi[1].id, deskripsi: 'Analisis dan perancangan sistem' }
		}),
		prisma.mataKuliah.create({
			data: { kode: 'IF301', nama: 'Pemrograman Web', sks: 3, semester: 5, programStudiId: programStudi[0].id, deskripsi: 'Pengembangan aplikasi web' }
		})
	]);

	console.log('Created Mata Kuliah:', mataKuliah.length);

	// 6. Create Ruang Kelas
	const ruangKelas = await Promise.all([
		prisma.ruangKelas.create({
			data: { kode: 'R101', nama: 'Ruang Kelas 101', tipe: TipeRuangKelas.REGULER, kapasitas: 40, hasProyektor: true, hasAC: true, gedung: 'Gedung A', lantai: 1, status: StatusRuangKelas.AVAILABLE }
		}),
		prisma.ruangKelas.create({
			data: { kode: 'R102', nama: 'Ruang Kelas 102', tipe: TipeRuangKelas.REGULER, kapasitas: 30, hasProyektor: true, hasAC: true, gedung: 'Gedung A', lantai: 1, status: StatusRuangKelas.AVAILABLE }
		}),
		prisma.ruangKelas.create({
			data: { kode: 'LAB01', nama: 'Laboratorium Komputer 1', tipe: TipeRuangKelas.LAB_KOMPUTER, kapasitas: 35, hasProyektor: true, hasAC: true, gedung: 'Gedung B', lantai: 2, status: StatusRuangKelas.AVAILABLE }
		}),
		prisma.ruangKelas.create({
			data: { kode: 'LAB02', nama: 'Laboratorium Bahasa', tipe: TipeRuangKelas.LAB_BAHASA, kapasitas: 25, hasProyektor: true, hasAC: true, gedung: 'Gedung B', lantai: 2, status: StatusRuangKelas.AVAILABLE }
		}),
		prisma.ruangKelas.create({
			data: { kode: 'AUD01', nama: 'Auditorium Utama', tipe: TipeRuangKelas.AUDITORIUM, kapasitas: 200, hasProyektor: true, hasAC: true, gedung: 'Gedung C', lantai: 1, status: StatusRuangKelas.AVAILABLE }
		})
	]);

	console.log('Created Ruang Kelas:', ruangKelas.length);

	// 7. Create Jadwal
	const jadwal = await Promise.all([
		prisma.jadwal.create({
			data: { hari: Hari.SENIN, jamMulai: '08:00', jamSelesai: '09:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.SENIN, jamMulai: '10:00', jamSelesai: '11:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.SENIN, jamMulai: '13:00', jamSelesai: '14:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.SELASA, jamMulai: '08:00', jamSelesai: '09:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.SELASA, jamMulai: '10:00', jamSelesai: '11:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.RABU, jamMulai: '08:00', jamSelesai: '09:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.RABU, jamMulai: '10:00', jamSelesai: '11:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.KAMIS, jamMulai: '08:00', jamSelesai: '09:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.KAMIS, jamMulai: '10:00', jamSelesai: '11:40' }
		}),
		prisma.jadwal.create({
			data: { hari: Hari.JUMAT, jamMulai: '08:00', jamSelesai: '09:40' }
		})
	]);

	console.log('Created Jadwal:', jadwal.length);

	// 8. Create Enrollments
	const enrollments = await Promise.all([
		// Andi Pratama - Pemrograman Dasar
		prisma.enrollment.create({
			data: {
				mahasiswaId: mahasiswa[0].id,
				mataKuliahId: mataKuliah[0].id,
				dosenId: dosen[0].id,
				ruangKelasId: ruangKelas[0].id,
				jadwalId: jadwal[0].id,
				semesterId: semester[0].id,
				status: StatusEnrollment.ACTIVE
			}
		}),
		// Bella Sari - Pemrograman Dasar
		prisma.enrollment.create({
			data: {
				mahasiswaId: mahasiswa[1].id,
				mataKuliahId: mataKuliah[0].id,
				dosenId: dosen[0].id,
				ruangKelasId: ruangKelas[0].id,
				jadwalId: jadwal[0].id,
				semesterId: semester[0].id,
				status: StatusEnrollment.ACTIVE
			}
		}),
		// Charlie Putra - Basis Data
		prisma.enrollment.create({
			data: {
				mahasiswaId: mahasiswa[2].id,
				mataKuliahId: mataKuliah[2].id,
				dosenId: dosen[1].id,
				ruangKelasId: ruangKelas[2].id,
				jadwalId: jadwal[1].id,
				semesterId: semester[0].id,
				status: StatusEnrollment.ACTIVE
			}
		}),
		// Diana Lestari - Basis Data
		prisma.enrollment.create({
			data: {
				mahasiswaId: mahasiswa[3].id,
				mataKuliahId: mataKuliah[2].id,
				dosenId: dosen[1].id,
				ruangKelasId: ruangKelas[2].id,
				jadwalId: jadwal[1].id,
				semesterId: semester[0].id,
				status: StatusEnrollment.ACTIVE
			}
		}),
		// Evan Kurniawan - Pemrograman Web
		prisma.enrollment.create({
			data: {
				mahasiswaId: mahasiswa[4].id,
				mataKuliahId: mataKuliah[5].id,
				dosenId: dosen[0].id,
				ruangKelasId: ruangKelas[2].id,
				jadwalId: jadwal[3].id,
				semesterId: semester[0].id,
				status: StatusEnrollment.ACTIVE
			}
		})
	]);

	console.log('Created Enrollments:', enrollments.length);

	// 9. Create Nilai for some enrollments
	const nilai = await Promise.all([
		prisma.nilai.create({
			data: {
				enrollmentId: enrollments[2].id, // Charlie - Basis Data
				nilaiTugas: 85,
				nilaiUTS: 80,
				nilaiUAS: 88,
				nilaiTotal: 84.9,
				hurufMutu: 'A'
			}
		}),
		prisma.nilai.create({
			data: {
				enrollmentId: enrollments[3].id, // Diana - Basis Data
				nilaiTugas: 90,
				nilaiUTS: 85,
				nilaiUAS: 92,
				nilaiTotal: 89.3,
				hurufMutu: 'A'
			}
		})
	]);

	console.log('Created Nilai:', nilai.length);

	// 10. Create KRS
	const krs = await Promise.all([
		prisma.kRS.create({
			data: {
				mahasiswaId: mahasiswa[0].id,
				semesterId: semester[0].id,
				status: StatusKRS.APPROVED,
				tanggalSubmit: new Date('2024-08-15')
			}
		}),
		prisma.kRS.create({
			data: {
				mahasiswaId: mahasiswa[1].id,
				semesterId: semester[0].id,
				status: StatusKRS.APPROVED,
				tanggalSubmit: new Date('2024-08-15')
			}
		}),
		prisma.kRS.create({
			data: {
				mahasiswaId: mahasiswa[2].id,
				semesterId: semester[0].id,
				status: StatusKRS.APPROVED,
				tanggalSubmit: new Date('2024-08-14')
			}
		})
	]);

	console.log('Created KRS:', krs.length);

	// 11. Create KRS Details
	const krsDetails = await Promise.all([
		prisma.kRSDetail.create({
			data: { krsId: krs[0].id, mataKuliahId: mataKuliah[0].id }
		}),
		prisma.kRSDetail.create({
			data: { krsId: krs[0].id, mataKuliahId: mataKuliah[1].id }
		}),
		prisma.kRSDetail.create({
			data: { krsId: krs[1].id, mataKuliahId: mataKuliah[0].id }
		}),
		prisma.kRSDetail.create({
			data: { krsId: krs[2].id, mataKuliahId: mataKuliah[2].id }
		})
	]);

	console.log('Created KRS Details:', krsDetails.length);

	console.log('Seed completed successfully!');
}

main()
	.catch((e) => {
		console.error('Seed error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
