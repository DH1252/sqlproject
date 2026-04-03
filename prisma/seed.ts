import {
	Hari,
	JenisSemester,
	StatusEnrollment,
	StatusKRS,
	StatusMahasiswa,
	StatusRuangKelas,
	TipeRuangKelas
} from '@prisma/client';
import prisma from '../src/lib/server/prisma';
import { syncMahasiswaIpk } from '../src/lib/server/gpa';
import { calculateGrade } from '../src/lib/utils/grade-calculator';

function buildGradeData(nilaiTugas: number, nilaiUTS: number, nilaiUAS: number) {
	const grade = calculateGrade({ nilaiTugas, nilaiUTS, nilaiUAS });

	if (!grade) {
		throw new Error('Complete grade components are required to build seed data');
	}

	return {
		nilaiTugas,
		nilaiUTS,
		nilaiUAS,
		nilaiTotal: grade.nilaiTotal,
		hurufMutu: grade.hurufMutu
	};
}

async function main() {
	console.log('Starting seed...');

	await prisma.nilai.deleteMany();
	await prisma.kRSDetail.deleteMany();
	await prisma.kRS.deleteMany();
	await prisma.enrollment.deleteMany();
	await prisma.jadwalRuangan.deleteMany();
	await prisma.jadwal.deleteMany();
	await prisma.mataKuliah.deleteMany();
	await prisma.ruangKelas.deleteMany();
	await prisma.dosen.deleteMany();
	await prisma.mahasiswa.deleteMany();
	await prisma.semester.deleteMany();
	await prisma.programStudi.deleteMany();

	console.log('Cleaned existing data');

	const [teknikInformatika, sistemInformasi, manajemenInformatika] = await Promise.all([
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

	console.log('Created Program Studi:', [teknikInformatika, sistemInformasi, manajemenInformatika].length);

	const [semesterGanjil, semesterGenap] = await Promise.all([
		prisma.semester.create({
			data: { tahunAjaran: '2024/2025', semester: JenisSemester.GANJIL, isActive: false }
		}),
		prisma.semester.create({
			data: { tahunAjaran: '2024/2025', semester: JenisSemester.GENAP, isActive: true }
		})
	]);

	console.log('Created Semester:', 2);

	const [ahmad, budi, citra, eko] = await Promise.all([
		prisma.dosen.create({
			data: {
				nip: 'DSN001',
				nama: 'Dr. Ahmad Wijaya',
				email: 'ahmad.wijaya@univ.ac.id',
				programStudiId: teknikInformatika.id,
				jabatan: 'Lektor Kepala'
			}
		}),
		prisma.dosen.create({
			data: {
				nip: 'DSN002',
				nama: 'Prof. Budi Santoso',
				email: 'budi.santoso@univ.ac.id',
				programStudiId: teknikInformatika.id,
				jabatan: 'Guru Besar'
			}
		}),
		prisma.dosen.create({
			data: {
				nip: 'DSN003',
				nama: 'Dr. Citra Dewi',
				email: 'citra.dewi@univ.ac.id',
				programStudiId: sistemInformasi.id,
				jabatan: 'Lektor'
			}
		}),
		prisma.dosen.create({
			data: {
				nip: 'DSN004',
				nama: 'Drs. Eko Prasetyo',
				email: 'eko.prasetyo@univ.ac.id',
				programStudiId: sistemInformasi.id,
				jabatan: 'Asisten Ahli'
			}
		})
	]);

	console.log('Created Dosen:', 4);

	const [andi, bella, charlie, diana, evan] = await Promise.all([
		prisma.mahasiswa.create({
			data: {
				nim: '2024001',
				nama: 'Andi Pratama',
				email: 'andi.pratama@student.univ.ac.id',
				programStudiId: teknikInformatika.id,
				angkatan: 2024,
				status: StatusMahasiswa.ACTIVE,
				ipk: 0
			}
		}),
		prisma.mahasiswa.create({
			data: {
				nim: '2024002',
				nama: 'Bella Sari',
				email: 'bella.sari@student.univ.ac.id',
				programStudiId: teknikInformatika.id,
				angkatan: 2024,
				status: StatusMahasiswa.ACTIVE,
				ipk: 0
			}
		}),
		prisma.mahasiswa.create({
			data: {
				nim: '2023001',
				nama: 'Charlie Putra',
				email: 'charlie.putra@student.univ.ac.id',
				programStudiId: sistemInformasi.id,
				angkatan: 2023,
				status: StatusMahasiswa.ACTIVE,
				ipk: 0
			}
		}),
		prisma.mahasiswa.create({
			data: {
				nim: '2023002',
				nama: 'Diana Lestari',
				email: 'diana.lestari@student.univ.ac.id',
				programStudiId: sistemInformasi.id,
				angkatan: 2023,
				status: StatusMahasiswa.ACTIVE,
				ipk: 0
			}
		}),
		prisma.mahasiswa.create({
			data: {
				nim: '2022001',
				nama: 'Evan Kurniawan',
				email: 'evan.kurniawan@student.univ.ac.id',
				programStudiId: teknikInformatika.id,
				angkatan: 2022,
				status: StatusMahasiswa.ACTIVE,
				ipk: 0
			}
		})
	]);

	console.log('Created Mahasiswa:', 5);

	const [if101, if102, if201, si101, si201, if301] = await Promise.all([
		prisma.mataKuliah.create({
			data: {
				kode: 'IF101',
				nama: 'Pemrograman Dasar',
				sks: 3,
				semester: 1,
				programStudiId: teknikInformatika.id,
				deskripsi: 'Pengenalan algoritma dan pemrograman'
			}
		}),
		prisma.mataKuliah.create({
			data: {
				kode: 'IF102',
				nama: 'Struktur Data',
				sks: 3,
				semester: 2,
				programStudiId: teknikInformatika.id,
				deskripsi: 'Konsep struktur data dan algoritma'
			}
		}),
		prisma.mataKuliah.create({
			data: {
				kode: 'IF201',
				nama: 'Basis Data',
				sks: 4,
				semester: 3,
				programStudiId: teknikInformatika.id,
				deskripsi: 'Konsep dan implementasi basis data'
			}
		}),
		prisma.mataKuliah.create({
			data: {
				kode: 'SI101',
				nama: 'Pengantar Sistem Informasi',
				sks: 3,
				semester: 1,
				programStudiId: sistemInformasi.id,
				deskripsi: 'Pengenalan sistem informasi'
			}
		}),
		prisma.mataKuliah.create({
			data: {
				kode: 'SI201',
				nama: 'Analisis Sistem',
				sks: 3,
				semester: 3,
				programStudiId: sistemInformasi.id,
				deskripsi: 'Analisis dan perancangan sistem'
			}
		}),
		prisma.mataKuliah.create({
			data: {
				kode: 'IF301',
				nama: 'Pemrograman Web',
				sks: 3,
				semester: 5,
				programStudiId: teknikInformatika.id,
				deskripsi: 'Pengembangan aplikasi web'
			}
		})
	]);

	console.log('Created Mata Kuliah:', 6);

	const [r101, r102, lab01, lab02, aud01] = await Promise.all([
		prisma.ruangKelas.create({
			data: {
				kode: 'R101',
				nama: 'Ruang Kelas 101',
				tipe: TipeRuangKelas.REGULER,
				kapasitas: 40,
				hasProyektor: true,
				hasAC: true,
				gedung: 'Gedung A',
				lantai: 1,
				status: StatusRuangKelas.AVAILABLE
			}
		}),
		prisma.ruangKelas.create({
			data: {
				kode: 'R102',
				nama: 'Ruang Kelas 102',
				tipe: TipeRuangKelas.REGULER,
				kapasitas: 30,
				hasProyektor: true,
				hasAC: true,
				gedung: 'Gedung A',
				lantai: 1,
				status: StatusRuangKelas.AVAILABLE
			}
		}),
		prisma.ruangKelas.create({
			data: {
				kode: 'LAB01',
				nama: 'Laboratorium Komputer 1',
				tipe: TipeRuangKelas.LAB_KOMPUTER,
				kapasitas: 35,
				hasProyektor: true,
				hasAC: true,
				gedung: 'Gedung B',
				lantai: 2,
				status: StatusRuangKelas.AVAILABLE
			}
		}),
		prisma.ruangKelas.create({
			data: {
				kode: 'LAB02',
				nama: 'Laboratorium Bahasa',
				tipe: TipeRuangKelas.LAB_BAHASA,
				kapasitas: 25,
				hasProyektor: true,
				hasAC: true,
				gedung: 'Gedung B',
				lantai: 2,
				status: StatusRuangKelas.AVAILABLE
			}
		}),
		prisma.ruangKelas.create({
			data: {
				kode: 'AUD01',
				nama: 'Auditorium Utama',
				tipe: TipeRuangKelas.AUDITORIUM,
				kapasitas: 200,
				hasProyektor: true,
				hasAC: true,
				gedung: 'Gedung C',
				lantai: 1,
				status: StatusRuangKelas.AVAILABLE
			}
		})
	]);

	console.log('Created Ruang Kelas:', 5);

	const [
		senin0800,
		senin1000,
		senin1300,
		selasa0800,
		selasa1000,
		rabu0800,
		rabu1000,
		kamis0800,
		kamis1000,
		jumat0800
	] = await Promise.all([
		prisma.jadwal.create({ data: { hari: Hari.SENIN, jamMulai: '08:00', jamSelesai: '09:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.SENIN, jamMulai: '10:00', jamSelesai: '11:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.SENIN, jamMulai: '13:00', jamSelesai: '14:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.SELASA, jamMulai: '08:00', jamSelesai: '09:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.SELASA, jamMulai: '10:00', jamSelesai: '11:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.RABU, jamMulai: '08:00', jamSelesai: '09:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.RABU, jamMulai: '10:00', jamSelesai: '11:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.KAMIS, jamMulai: '08:00', jamSelesai: '09:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.KAMIS, jamMulai: '10:00', jamSelesai: '11:40' } }),
		prisma.jadwal.create({ data: { hari: Hari.JUMAT, jamMulai: '08:00', jamSelesai: '09:40' } })
	]);

	console.log('Created Jadwal:', 10);

	const enrollmentSeeds = [
		{
			key: 'andi-if101-completed',
			mahasiswaId: andi.id,
			mataKuliahId: if101.id,
			dosenId: ahmad.id,
			ruangKelasId: r101.id,
			jadwalId: senin0800.id,
			semesterId: semesterGanjil.id,
			status: StatusEnrollment.COMPLETED
		},
		{
			key: 'bella-if101-completed',
			mahasiswaId: bella.id,
			mataKuliahId: if101.id,
			dosenId: ahmad.id,
			ruangKelasId: r101.id,
			jadwalId: senin0800.id,
			semesterId: semesterGanjil.id,
			status: StatusEnrollment.COMPLETED
		},
		{
			key: 'charlie-si101-completed',
			mahasiswaId: charlie.id,
			mataKuliahId: si101.id,
			dosenId: citra.id,
			ruangKelasId: r102.id,
			jadwalId: selasa0800.id,
			semesterId: semesterGanjil.id,
			status: StatusEnrollment.COMPLETED
		},
		{
			key: 'diana-si101-completed',
			mahasiswaId: diana.id,
			mataKuliahId: si101.id,
			dosenId: citra.id,
			ruangKelasId: r102.id,
			jadwalId: selasa0800.id,
			semesterId: semesterGanjil.id,
			status: StatusEnrollment.COMPLETED
		},
		{
			key: 'evan-if201-completed',
			mahasiswaId: evan.id,
			mataKuliahId: if201.id,
			dosenId: budi.id,
			ruangKelasId: lab01.id,
			jadwalId: rabu1000.id,
			semesterId: semesterGanjil.id,
			status: StatusEnrollment.COMPLETED
		},
		{
			key: 'andi-if102-active',
			mahasiswaId: andi.id,
			mataKuliahId: if102.id,
			dosenId: ahmad.id,
			ruangKelasId: r101.id,
			jadwalId: senin1000.id,
			semesterId: semesterGenap.id,
			status: StatusEnrollment.ACTIVE
		},
		{
			key: 'bella-if102-active',
			mahasiswaId: bella.id,
			mataKuliahId: if102.id,
			dosenId: ahmad.id,
			ruangKelasId: r101.id,
			jadwalId: senin1000.id,
			semesterId: semesterGenap.id,
			status: StatusEnrollment.ACTIVE
		},
		{
			key: 'charlie-si201-active',
			mahasiswaId: charlie.id,
			mataKuliahId: si201.id,
			dosenId: eko.id,
			ruangKelasId: r102.id,
			jadwalId: kamis0800.id,
			semesterId: semesterGenap.id,
			status: StatusEnrollment.ACTIVE
		},
		{
			key: 'diana-si201-active',
			mahasiswaId: diana.id,
			mataKuliahId: si201.id,
			dosenId: eko.id,
			ruangKelasId: r102.id,
			jadwalId: kamis0800.id,
			semesterId: semesterGenap.id,
			status: StatusEnrollment.ACTIVE
		},
		{
			key: 'evan-if301-active',
			mahasiswaId: evan.id,
			mataKuliahId: if301.id,
			dosenId: budi.id,
			ruangKelasId: lab01.id,
			jadwalId: selasa1000.id,
			semesterId: semesterGenap.id,
			status: StatusEnrollment.ACTIVE
		}
	] as const;

	const enrollments = await Promise.all(
		enrollmentSeeds.map(({ key: _key, ...data }) => prisma.enrollment.create({ data }))
	);

	const enrollmentByKey = new Map<string, (typeof enrollments)[number]>();
	for (const [index, seed] of enrollmentSeeds.entries()) {
		enrollmentByKey.set(seed.key, enrollments[index]);
	}

	console.log('Created Enrollments:', enrollments.length);

	const nilaiSeeds = [
		{ enrollmentKey: 'andi-if101-completed', ...buildGradeData(82, 78, 85) },
		{ enrollmentKey: 'bella-if101-completed', ...buildGradeData(90, 88, 92) },
		{ enrollmentKey: 'charlie-si101-completed', ...buildGradeData(84, 80, 86) },
		{ enrollmentKey: 'diana-si101-completed', ...buildGradeData(88, 86, 90) },
		{ enrollmentKey: 'evan-if201-completed', ...buildGradeData(76, 74, 80) }
	] as const;

	const nilai = await Promise.all(
		nilaiSeeds.map(({ enrollmentKey, ...grade }) => {
			const enrollment = enrollmentByKey.get(enrollmentKey);

			if (!enrollment) {
				throw new Error(`Missing enrollment for key: ${enrollmentKey}`);
			}

			return prisma.nilai.create({
				data: {
					enrollmentId: enrollment.id,
					...grade
				}
			});
		})
	);

	console.log('Created Nilai:', nilai.length);

	const roomReservations = await Promise.all([
		prisma.jadwalRuangan.create({
			data: {
				ruangKelasId: r101.id,
				jadwalId: kamis1000.id,
				semesterId: semesterGenap.id,
				keterangan: 'Kuliah tamu Teknik Informatika'
			}
		}),
		prisma.jadwalRuangan.create({
			data: {
				ruangKelasId: lab02.id,
				jadwalId: rabu0800.id,
				semesterId: semesterGenap.id,
				keterangan: 'Simulasi laboratorium bahasa'
			}
		}),
		prisma.jadwalRuangan.create({
			data: {
				ruangKelasId: aud01.id,
				jadwalId: jumat0800.id,
				semesterId: semesterGenap.id,
				keterangan: 'Seminar fakultas'
			}
		})
	]);

	console.log('Created Jadwal Ruangan:', roomReservations.length);

	const krsSeeds = [
		{ key: 'andi-krs', mahasiswaId: andi.id, tanggalSubmit: new Date('2025-01-10T08:00:00Z') },
		{ key: 'bella-krs', mahasiswaId: bella.id, tanggalSubmit: new Date('2025-01-10T08:10:00Z') },
		{ key: 'charlie-krs', mahasiswaId: charlie.id, tanggalSubmit: new Date('2025-01-09T08:00:00Z') },
		{ key: 'diana-krs', mahasiswaId: diana.id, tanggalSubmit: new Date('2025-01-09T08:10:00Z') },
		{ key: 'evan-krs', mahasiswaId: evan.id, tanggalSubmit: new Date('2025-01-08T08:00:00Z') }
	] as const;

	const krs = await Promise.all(
		krsSeeds.map(({ key: _key, mahasiswaId, tanggalSubmit }) =>
			prisma.kRS.create({
				data: {
					mahasiswaId,
					semesterId: semesterGenap.id,
					status: StatusKRS.APPROVED,
					tanggalSubmit
				}
			})
		)
	);

	const krsByKey = new Map<string, (typeof krs)[number]>();
	for (const [index, seed] of krsSeeds.entries()) {
		krsByKey.set(seed.key, krs[index]);
	}

	console.log('Created KRS:', krs.length);

	const krsDetailSeeds = [
		{ krsKey: 'andi-krs', mataKuliahId: if102.id },
		{ krsKey: 'bella-krs', mataKuliahId: if102.id },
		{ krsKey: 'charlie-krs', mataKuliahId: si201.id },
		{ krsKey: 'diana-krs', mataKuliahId: si201.id },
		{ krsKey: 'evan-krs', mataKuliahId: if301.id }
	] as const;

	const krsDetails = await Promise.all(
		krsDetailSeeds.map(({ krsKey, mataKuliahId }) => {
			const currentKrs = krsByKey.get(krsKey);

			if (!currentKrs) {
				throw new Error(`Missing KRS for key: ${krsKey}`);
			}

			return prisma.kRSDetail.create({
				data: {
					krsId: currentKrs.id,
					mataKuliahId
				}
			});
		})
	);

	console.log('Created KRS Details:', krsDetails.length);

	await prisma.$transaction(async (tx) => {
		for (const student of [andi, bella, charlie, diana, evan]) {
			await syncMahasiswaIpk(tx, student.id);
		}
	});

	console.log('Synced Mahasiswa IPK');
	console.log('Seed completed successfully!');

	console.log('Seed summary:', {
		programStudi: 3,
		semester: 2,
		dosen: 4,
		mahasiswa: 5,
		mataKuliah: 6,
		ruangKelas: 5,
		jadwal: 10,
		enrollments: enrollments.length,
		nilai: nilai.length,
		jadwalRuangan: roomReservations.length,
		krs: krs.length,
		krsDetails: krsDetails.length
	});

}

main()
	.catch((error) => {
		console.error('Seed error:', error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
