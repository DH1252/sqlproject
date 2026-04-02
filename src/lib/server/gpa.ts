import type { Prisma } from '@prisma/client';
import { calculateGPA } from '$lib/utils/grade-calculator';

export interface GpaEnrollmentRecord {
	status: string;
	nilai: { hurufMutu: string | null } | null;
	mataKuliah: { sks: number };
}

function hasCompletedGrade(
	enrollment: GpaEnrollmentRecord
): enrollment is GpaEnrollmentRecord & { nilai: { hurufMutu: string } } {
	return (
		enrollment.status === 'COMPLETED' &&
		typeof enrollment.nilai?.hurufMutu === 'string' &&
		enrollment.nilai.hurufMutu.length > 0
	);
}

export function summarizeMahasiswaIpk(enrollments: readonly GpaEnrollmentRecord[]) {
	const grades = enrollments.filter(hasCompletedGrade).map(({ nilai, mataKuliah }) => ({
		hurufMutu: nilai.hurufMutu,
		sks: mataKuliah.sks
	}));

	return {
		ipk: calculateGPA(grades),
		totalSks: grades.reduce((sum, grade) => sum + grade.sks, 0),
		totalCourses: grades.length
	};
}

const gpaSyncSelect = {
	status: true,
	nilai: { select: { hurufMutu: true } },
	mataKuliah: { select: { sks: true } }
} satisfies Prisma.EnrollmentSelect;

export async function syncMahasiswaIpk(tx: Prisma.TransactionClient, mahasiswaId: number) {
	const enrollments = await tx.enrollment.findMany({
		where: { mahasiswaId },
		select: gpaSyncSelect
	});

	const { ipk } = summarizeMahasiswaIpk(enrollments);

	await tx.mahasiswa.update({
		where: { id: mahasiswaId },
		data: { ipk }
	});

	return ipk;
}
