import assert from 'node:assert/strict';
import test from 'node:test';
import { JenisSemester, StatusEnrollment, type Enrollment } from '$lib/types';
import { buildTranscriptReport } from './transcript';

test('buildTranscriptReport summarizes GPA, semester IPS, and passed credits', () => {
	const enrollments: Enrollment[] = [
		{
			id: 1,
			mahasiswaId: 1,
			mataKuliahId: 1,
			dosenId: 1,
			ruangKelasId: 1,
			jadwalId: 1,
			semesterId: 10,
			status: StatusEnrollment.COMPLETED,
			createdAt: '',
			updatedAt: '',
			mataKuliah: { id: 1, kode: 'IF101', nama: 'Algoritma', sks: 3, semester: 1, programStudiId: 1, createdAt: '', updatedAt: '' },
			dosen: { id: 1, nip: 'D1', nama: 'Dr. A', email: 'a@example.com', programStudiId: 1, jabatan: 'Lektor', createdAt: '', updatedAt: '' },
			semester: { id: 10, tahunAjaran: '2024/2025', semester: JenisSemester.GANJIL, isActive: false, createdAt: '', updatedAt: '' },
			nilai: { id: 1, enrollmentId: 1, nilaiTotal: 88, hurufMutu: 'A', createdAt: '', updatedAt: '' }
		},
		{
			id: 2,
			mahasiswaId: 1,
			mataKuliahId: 2,
			dosenId: 2,
			ruangKelasId: 1,
			jadwalId: 2,
			semesterId: 10,
			status: StatusEnrollment.COMPLETED,
			createdAt: '',
			updatedAt: '',
			mataKuliah: { id: 2, kode: 'IF102', nama: 'Basis Data', sks: 2, semester: 1, programStudiId: 1, createdAt: '', updatedAt: '' },
			dosen: { id: 2, nip: 'D2', nama: 'Dr. B', email: 'b@example.com', programStudiId: 1, jabatan: 'Lektor', createdAt: '', updatedAt: '' },
			semester: { id: 10, tahunAjaran: '2024/2025', semester: JenisSemester.GANJIL, isActive: false, createdAt: '', updatedAt: '' },
			nilai: { id: 2, enrollmentId: 2, nilaiTotal: 77, hurufMutu: 'B', createdAt: '', updatedAt: '' }
		},
		{
			id: 3,
			mahasiswaId: 1,
			mataKuliahId: 3,
			dosenId: 3,
			ruangKelasId: 1,
			jadwalId: 3,
			semesterId: 11,
			status: StatusEnrollment.COMPLETED,
			createdAt: '',
			updatedAt: '',
			mataKuliah: { id: 3, kode: 'IF201', nama: 'Struktur Data', sks: 3, semester: 2, programStudiId: 1, createdAt: '', updatedAt: '' },
			dosen: { id: 3, nip: 'D3', nama: 'Dr. C', email: 'c@example.com', programStudiId: 1, jabatan: 'Lektor', createdAt: '', updatedAt: '' },
			semester: { id: 11, tahunAjaran: '2024/2025', semester: JenisSemester.GENAP, isActive: false, createdAt: '', updatedAt: '' },
			nilai: { id: 3, enrollmentId: 3, nilaiTotal: 45, hurufMutu: 'E', createdAt: '', updatedAt: '' }
		},
		{
			id: 4,
			mahasiswaId: 1,
			mataKuliahId: 4,
			dosenId: 4,
			ruangKelasId: 1,
			jadwalId: 4,
			semesterId: 11,
			status: StatusEnrollment.ACTIVE,
			createdAt: '',
			updatedAt: '',
			mataKuliah: { id: 4, kode: 'IF202', nama: 'Jaringan', sks: 2, semester: 2, programStudiId: 1, createdAt: '', updatedAt: '' },
			dosen: { id: 4, nip: 'D4', nama: 'Dr. D', email: 'd@example.com', programStudiId: 1, jabatan: 'Lektor', createdAt: '', updatedAt: '' },
			semester: { id: 11, tahunAjaran: '2024/2025', semester: JenisSemester.GENAP, isActive: false, createdAt: '', updatedAt: '' },
			nilai: { id: 4, enrollmentId: 4, nilaiTotal: 90, hurufMutu: 'A', createdAt: '', updatedAt: '' }
		}
	];

	const report = buildTranscriptReport(enrollments);

	assert.deepEqual(report.summary, {
		ipk: 2.25,
		totalSksDiambil: 10,
		totalSksLulus: 5,
		gradedCourses: 3,
		totalSemesters: 2
	});

	assert.deepEqual(report.semesters, [
		{
			semesterId: 10,
			tahunAjaran: '2024/2025',
			semester: JenisSemester.GANJIL,
			ips: 3.6,
			totalSksDiambil: 5,
			totalSksLulus: 5,
			gradedCourses: 2
		},
		{
			semesterId: 11,
			tahunAjaran: '2024/2025',
			semester: JenisSemester.GENAP,
			ips: 0,
			totalSksDiambil: 5,
			totalSksLulus: 0,
			gradedCourses: 1
		}
	]);

	assert.equal(report.courses[3].countsTowardsGpa, false);
	assert.equal(report.courses[2].countsAsPassed, false);
});
