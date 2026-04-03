const LABEL_MAP: Record<string, string> = {
	ACTIVE: 'Aktif',
	INACTIVE: 'Tidak aktif',
	GRADUATED: 'Lulus',
	AVAILABLE: 'Tersedia',
	MAINTENANCE: 'Dalam perbaikan',
	UNAVAILABLE: 'Tidak tersedia',
	GANJIL: 'Ganjil',
	GENAP: 'Genap',
	DRAFT: 'Draf',
	SUBMITTED: 'Diajukan',
	APPROVED: 'Disetujui',
	REJECTED: 'Ditolak',
	COMPLETED: 'Selesai',
	DROPPED: 'Dibatalkan',
	REGULER: 'Reguler',
	LAB_KOMPUTER: 'Lab komputer',
	LAB_BAHASA: 'Lab bahasa',
	AUDITORIUM: 'Auditorium',
	SENIN: 'Senin',
	SELASA: 'Selasa',
	RABU: 'Rabu',
	KAMIS: 'Kamis',
	JUMAT: 'Jumat',
	SABTU: 'Sabtu',
	MINGGU: 'Minggu',
	EMPTY: 'Kosong',
	SECTION: 'Terjadwal',
	RESERVED: 'Direservasi'
};

function titleCaseLabel(value: string) {
	return value
		.toLowerCase()
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export function formatAcademicLabel(value: unknown): string {
	if (value === null || value === undefined) {
		return '—';
	}

	if (typeof value === 'boolean') {
		return value ? 'Aktif' : 'Tidak aktif';
	}

	const normalized = String(value).trim();

	if (!normalized) {
		return '—';
	}

	return LABEL_MAP[normalized] ?? titleCaseLabel(normalized);
}
