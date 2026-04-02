import { StatusRuangKelas, type Prisma, type StatusEnrollment } from '@prisma/client';
import { httpError } from '$lib/server/http';

export interface EnrollmentCandidate {
	mahasiswaId: number;
	mataKuliahId: number;
	dosenId: number;
	ruangKelasId: number;
	jadwalId: number;
	semesterId: number;
	status: StatusEnrollment;
}

interface ValidationOptions {
	excludeEnrollmentId?: number;
}

function shouldCheckConflicts(status: StatusEnrollment) {
	return status !== 'DROPPED';
}

export async function validateEnrollmentConflicts(
	tx: Prisma.TransactionClient,
	candidate: EnrollmentCandidate,
	options: ValidationOptions = {}
) {
	if (!shouldCheckConflicts(candidate.status)) {
		return;
	}

	const [jadwal, ruangKelas] = await Promise.all([
		tx.jadwal.findUnique({
			where: { id: candidate.jadwalId },
			select: { hari: true, jamMulai: true, jamSelesai: true }
		}),
		tx.ruangKelas.findUnique({
			where: { id: candidate.ruangKelasId },
			select: { kapasitas: true, status: true }
		})
	]);

	if (!jadwal) {
		httpError(404, 'Jadwal not found');
	}

	if (!ruangKelas) {
		httpError(404, 'Ruang kelas not found');
	}

	if (ruangKelas.status !== StatusRuangKelas.AVAILABLE) {
		httpError(409, 'Selected room is not available');
	}

	const excludeIdFilter = options.excludeEnrollmentId
		? { id: { not: options.excludeEnrollmentId } }
		: {};
	const overlappingScheduleFilter = {
		jadwal: {
			is: {
				hari: jadwal.hari,
				jamMulai: { lt: jadwal.jamSelesai },
				jamSelesai: { gt: jadwal.jamMulai }
			}
		}
	} as const;

	const studentConflict = await tx.enrollment.findFirst({
		where: {
			mahasiswaId: candidate.mahasiswaId,
			semesterId: candidate.semesterId,
			status: { not: 'DROPPED' },
			...excludeIdFilter,
			...overlappingScheduleFilter
		},
		select: { id: true }
	});

	if (studentConflict) {
		httpError(409, 'Schedule conflict: Student already has a class at this time');
	}

	const roomConflict = await tx.enrollment.findFirst({
		where: {
			ruangKelasId: candidate.ruangKelasId,
			semesterId: candidate.semesterId,
			status: { not: 'DROPPED' },
			...excludeIdFilter,
			...overlappingScheduleFilter,
			NOT: {
				mataKuliahId: candidate.mataKuliahId,
				dosenId: candidate.dosenId,
				jadwalId: candidate.jadwalId
			}
		},
		select: { id: true }
	});

	if (roomConflict) {
		httpError(409, 'Room conflict: Room is already booked at this time');
	}

	const sectionEnrollmentCount = await tx.enrollment.count({
		where: {
			mataKuliahId: candidate.mataKuliahId,
			dosenId: candidate.dosenId,
			ruangKelasId: candidate.ruangKelasId,
			jadwalId: candidate.jadwalId,
			semesterId: candidate.semesterId,
			status: { not: 'DROPPED' },
			...excludeIdFilter
		}
	});

	if (sectionEnrollmentCount >= ruangKelas.kapasitas) {
		httpError(409, 'Room capacity has been reached for this class section');
	}
}
