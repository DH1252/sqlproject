import type { Enrollment, TranscriptCourseRow, TranscriptReport, TranscriptSemesterSummary } from '$lib/types';
import { JenisSemester, StatusEnrollment } from '$lib/types';
import { calculateGPA, getGradePoint, isLetterGrade } from './grade-calculator';

interface TranscriptRowSeed {
	id: number;
	tahunAjaran: string;
	semester: JenisSemester;
	kode: string;
	nama: string;
	dosen: string;
	sks: number;
	status: StatusEnrollment;
	nilaiTotal: number | null;
	hurufMutu: string | null;
	gradePoint: number | null;
	countsTowardsGpa: boolean;
	countsAsPassed: boolean;
	semesterId: number | null;
}

function semesterOrder(semester: JenisSemester) {
	return semester === JenisSemester.GANJIL ? 0 : 1;
}

function startYear(tahunAjaran: string) {
	const match = tahunAjaran.match(/^(\d{4})/);
	return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareSemester(a: { tahunAjaran: string; semester: JenisSemester }, b: { tahunAjaran: string; semester: JenisSemester }) {
	return startYear(a.tahunAjaran) - startYear(b.tahunAjaran) || semesterOrder(a.semester) - semesterOrder(b.semester);
}

function buildCourseRows(enrollments: readonly Enrollment[]): TranscriptRowSeed[] {
	return enrollments
		.filter((enrollment) => Boolean(enrollment.mataKuliah && enrollment.semester))
		.map((enrollment) => {
			const hurufMutu = enrollment.nilai?.hurufMutu ?? null;
			const gradePoint = hurufMutu && isLetterGrade(hurufMutu) ? getGradePoint(hurufMutu) : null;
			const countsTowardsGpa = enrollment.status === StatusEnrollment.COMPLETED && gradePoint !== null;

			return {
				id: enrollment.id,
				semesterId: enrollment.semester?.id ?? null,
				tahunAjaran: enrollment.semester?.tahunAjaran ?? '-',
				semester: enrollment.semester?.semester ?? JenisSemester.GANJIL,
				kode: enrollment.mataKuliah?.kode ?? '-',
				nama: enrollment.mataKuliah?.nama ?? '-',
				dosen: enrollment.dosen?.nama ?? '-',
				sks: enrollment.mataKuliah?.sks ?? 0,
				status: enrollment.status,
				nilaiTotal: enrollment.nilai?.nilaiTotal ?? null,
				hurufMutu,
				gradePoint,
				countsTowardsGpa,
				countsAsPassed: countsTowardsGpa && hurufMutu !== 'E'
			};
		})
		.sort(compareSemester);
}

export function buildTranscriptReport(enrollments: readonly Enrollment[]): TranscriptReport {
	const courseSeeds = buildCourseRows(enrollments);
	const semesterMap = new Map<string, TranscriptSemesterSummary>();

	for (const course of courseSeeds) {
		const key = `${course.semesterId ?? `${course.tahunAjaran}-${course.semester}`}`;
		const current = semesterMap.get(key) ?? {
			semesterId: course.semesterId,
			tahunAjaran: course.tahunAjaran,
			semester: course.semester,
			ips: 0,
			totalSksDiambil: 0,
			totalSksLulus: 0,
			gradedCourses: 0
		};

		current.totalSksDiambil += course.sks;

		if (course.countsTowardsGpa) {
			current.gradedCourses += 1;
		}

		if (course.countsAsPassed) {
			current.totalSksLulus += course.sks;
		}

		semesterMap.set(key, current);
	}

	const semesters = Array.from(semesterMap.values())
		.map((semesterSummary) => {
			const semesterCourses = courseSeeds.filter(
				(course) =>
					course.tahunAjaran === semesterSummary.tahunAjaran &&
					course.semester === semesterSummary.semester &&
					course.countsTowardsGpa
			);

			return {
				...semesterSummary,
				ips: calculateGPA(
					semesterCourses.map((course) => ({ hurufMutu: course.hurufMutu as string, sks: course.sks }))
				)
			};
		})
		.sort(compareSemester);

	const courses: TranscriptCourseRow[] = courseSeeds.map((course) => ({
		id: course.id,
		tahunAjaran: course.tahunAjaran,
		semester: course.semester,
		kode: course.kode,
		nama: course.nama,
		dosen: course.dosen,
		sks: course.sks,
		status: course.status,
		nilaiTotal: course.nilaiTotal,
		hurufMutu: course.hurufMutu,
		gradePoint: course.gradePoint,
		countsTowardsGpa: course.countsTowardsGpa,
		countsAsPassed: course.countsAsPassed
	}));

	const countedCourses = courses.filter((course) => course.countsTowardsGpa);

	return {
		summary: {
			ipk: calculateGPA(
				countedCourses.map((course) => ({ hurufMutu: course.hurufMutu as string, sks: course.sks }))
			),
			totalSksDiambil: courses.reduce((sum, course) => sum + course.sks, 0),
			totalSksLulus: courses.reduce((sum, course) => sum + (course.countsAsPassed ? course.sks : 0), 0),
			gradedCourses: countedCourses.length,
			totalSemesters: semesters.length
		},
		semesters,
		courses
	};
}
