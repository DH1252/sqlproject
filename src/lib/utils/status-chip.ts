import { StatusEnrollment, StatusKRS, StatusMahasiswa, StatusRuangKelas } from '$lib/types';

export function getMahasiswaStatusChip(status: string | null | undefined) {
	if (status === StatusMahasiswa.ACTIVE) return 'status-chip tone-emerald';
	if (status === StatusMahasiswa.GRADUATED) return 'status-chip tone-sky';
	if (status === StatusMahasiswa.INACTIVE) return 'status-chip tone-gold';
	return 'status-chip tone-neutral';
}

export function getEnrollmentStatusChip(status: string | null | undefined) {
	if (status === StatusEnrollment.COMPLETED) return 'status-chip tone-emerald';
	if (status === StatusEnrollment.ACTIVE) return 'status-chip tone-sky';
	if (status === StatusEnrollment.DROPPED) return 'status-chip tone-rose';
	return 'status-chip tone-neutral';
}

export function getKrsStatusChip(status: string | null | undefined) {
	if (status === StatusKRS.APPROVED) return 'status-chip tone-emerald';
	if (status === StatusKRS.SUBMITTED) return 'status-chip tone-sky';
	if (status === StatusKRS.DRAFT) return 'status-chip tone-gold';
	if (status === StatusKRS.REJECTED) return 'status-chip tone-rose';
	return 'status-chip tone-neutral';
}

export function getRuangStatusChip(status: string | null | undefined) {
	if (status === StatusRuangKelas.AVAILABLE) return 'status-chip tone-emerald';
	if (status === StatusRuangKelas.MAINTENANCE) return 'status-chip tone-gold';
	if (status === StatusRuangKelas.UNAVAILABLE) return 'status-chip tone-rose';
	return 'status-chip tone-neutral';
}

export function getGradeStatusChip(hurufMutu: string | null | undefined) {
	if (!hurufMutu) return 'status-chip tone-neutral';
	if (['A', 'B+', 'B'].includes(hurufMutu)) return 'status-chip tone-emerald';
	if (['C+', 'C', 'D'].includes(hurufMutu)) return 'status-chip tone-gold';
	return 'status-chip tone-rose';
}
