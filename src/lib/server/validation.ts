import {
	Hari,
	JenisSemester,
	StatusEnrollment,
	StatusKRS,
	StatusMahasiswa,
	StatusRuangKelas,
	TipeRuangKelas,
	type DosenFormData,
	type EnrollmentFormData,
	type JadwalFormData,
	type KRSFormData,
	type MahasiswaFormData,
	type MataKuliahFormData,
	type NilaiFormData,
	type ProgramStudiFormData,
	type RuangKelasFormData,
	type SemesterFormData
} from '$lib/types';
import { httpError, requireFields } from '$lib/server/http';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const ACADEMIC_YEAR_REGEX = /^(\d{4})\/(\d{4})$/;
const JENJANG_VALUES = ['S1', 'S2', 'S3'] as const;

function stringField(
	value: unknown,
	name: string,
	options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {}
) {
	if (typeof value !== 'string') {
		httpError(400, `${name} must be a string`);
	}

	const normalized = value.trim();
	const minLength = options.minLength ?? 1;

	if (normalized.length < minLength) {
		httpError(400, `${name} is required`);
	}

	if (options.maxLength && normalized.length > options.maxLength) {
		httpError(400, `${name} must be at most ${options.maxLength} characters`);
	}

	if (options.pattern && !options.pattern.test(normalized)) {
		httpError(400, `${name} is invalid`);
	}

	return normalized;
}

function optionalStringField(
	value: unknown,
	name: string,
	options: { maxLength?: number; allowNull?: boolean } = {}
) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		if (options.allowNull) {
			return null;
		}

		httpError(400, `${name} must be a string`);
	}

	return stringField(value, name, { maxLength: options.maxLength });
}

function integerField(
	value: unknown,
	name: string,
	options: { min?: number; max?: number } = {}
) {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		httpError(400, `${name} must be an integer`);
	}

	if (options.min !== undefined && value < options.min) {
		httpError(400, `${name} must be at least ${options.min}`);
	}

	if (options.max !== undefined && value > options.max) {
		httpError(400, `${name} must be at most ${options.max}`);
	}

	return value;
}

function optionalIntegerField(
	value: unknown,
	name: string,
	options: { min?: number; max?: number } = {}
) {
	if (value === undefined) {
		return undefined;
	}

	return integerField(value, name, options);
}

function numberField(
	value: unknown,
	name: string,
	options: { min?: number; max?: number } = {}
) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		httpError(400, `${name} must be a finite number`);
	}

	if (options.min !== undefined && value < options.min) {
		httpError(400, `${name} must be at least ${options.min}`);
	}

	if (options.max !== undefined && value > options.max) {
		httpError(400, `${name} must be at most ${options.max}`);
	}

	return value;
}

function optionalNumberField(
	value: unknown,
	name: string,
	options: { min?: number; max?: number } = {}
) {
	if (value === undefined) {
		return undefined;
	}

	return numberField(value, name, options);
}

function booleanField(value: unknown, name: string) {
	if (typeof value !== 'boolean') {
		httpError(400, `${name} must be a boolean`);
	}

	return value;
}

function optionalBooleanField(value: unknown, name: string) {
	if (value === undefined) {
		return undefined;
	}

	return booleanField(value, name);
}

function enumField<T extends string>(value: unknown, name: string, allowed: readonly T[]) {
	if (typeof value !== 'string' || !allowed.includes(value as T)) {
		httpError(400, `${name} is invalid`);
	}

	return value as T;
}

function optionalEnumField<T extends string>(value: unknown, name: string, allowed: readonly T[]) {
	if (value === undefined) {
		return undefined;
	}

	return enumField(value, name, allowed);
}

function emailField(value: unknown, name: string) {
	const email = stringField(value, name, { maxLength: 100 });

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		httpError(400, `${name} is invalid`);
	}

	return email.toLowerCase();
}

function optionalEmailField(value: unknown, name: string) {
	if (value === undefined) {
		return undefined;
	}

	return emailField(value, name);
}

function timeField(value: unknown, name: string) {
	const time = stringField(value, name, { maxLength: 5, pattern: TIME_REGEX });
	return time;
}

function optionalTimeField(value: unknown, name: string) {
	if (value === undefined) {
		return undefined;
	}

	return timeField(value, name);
}

function scoreField(value: unknown, name: string) {
	if (value === null || value === undefined) {
		return null;
	}

	return numberField(value, name, { min: 0, max: 100 });
}

function optionalScoreField(value: unknown, name: string) {
	if (value === undefined) {
		return undefined;
	}

	return scoreField(value, name);
}

function academicYearField(value: unknown) {
	const tahunAjaran = stringField(value, 'tahunAjaran', { maxLength: 20, pattern: ACADEMIC_YEAR_REGEX });
	const match = tahunAjaran.match(ACADEMIC_YEAR_REGEX);

	if (!match) {
		httpError(400, 'tahunAjaran is invalid');
	}

	const firstYear = Number(match[1]);
	const secondYear = Number(match[2]);

	if (secondYear !== firstYear + 1) {
		httpError(400, 'tahunAjaran must span consecutive years');
	}

	return tahunAjaran;
}

function optionalAcademicYearField(value: unknown) {
	if (value === undefined) {
		return undefined;
	}

	return academicYearField(value);
}

function optionalDateField(value: unknown, name: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	if (typeof value !== 'string') {
		httpError(400, `${name} must be an ISO date string or null`);
	}

	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		httpError(400, `${name} must be a valid date`);
	}

	return parsed;
}

function validateScheduleRange(jamMulai: string, jamSelesai: string) {
	if (jamMulai >= jamSelesai) {
		httpError(400, 'jamSelesai must be later than jamMulai');
	}
}

export function validateProgramStudiCreate(input: Record<string, unknown>): ProgramStudiFormData {
	return {
		kode: stringField(input.kode, 'kode', { maxLength: 20 }),
		nama: stringField(input.nama, 'nama', { maxLength: 100 }),
		jenjang: enumField(input.jenjang, 'jenjang', JENJANG_VALUES)
	};
}

export function validateProgramStudiUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.kode !== undefined && { kode: stringField(input.kode, 'kode', { maxLength: 20 }) }),
		...(input.nama !== undefined && { nama: stringField(input.nama, 'nama', { maxLength: 100 }) }),
		...(input.jenjang !== undefined && {
			jenjang: enumField(input.jenjang, 'jenjang', JENJANG_VALUES)
		})
	});
}

export function validateMahasiswaCreate(input: Record<string, unknown>): MahasiswaFormData {
	return {
		nim: stringField(input.nim, 'nim', { maxLength: 20 }),
		nama: stringField(input.nama, 'nama', { maxLength: 100 }),
		email: emailField(input.email, 'email'),
		programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 }),
		angkatan: integerField(input.angkatan, 'angkatan', { min: 1900, max: 2100 }),
		status: optionalEnumField(input.status, 'status', Object.values(StatusMahasiswa)) ?? StatusMahasiswa.ACTIVE
	};
}

export function validateMahasiswaUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.nim !== undefined && { nim: stringField(input.nim, 'nim', { maxLength: 20 }) }),
		...(input.nama !== undefined && { nama: stringField(input.nama, 'nama', { maxLength: 100 }) }),
		...(input.email !== undefined && { email: emailField(input.email, 'email') }),
		...(input.programStudiId !== undefined && {
			programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 })
		}),
		...(input.angkatan !== undefined && {
			angkatan: integerField(input.angkatan, 'angkatan', { min: 1900, max: 2100 })
		}),
		...(input.status !== undefined && {
			status: enumField(input.status, 'status', Object.values(StatusMahasiswa))
		}),
		...(input.ipk !== undefined && { ipk: numberField(input.ipk, 'ipk', { min: 0, max: 4 }) })
	});
}

export function validateDosenCreate(input: Record<string, unknown>): DosenFormData {
	return {
		nip: stringField(input.nip, 'nip', { maxLength: 20 }),
		nama: stringField(input.nama, 'nama', { maxLength: 100 }),
		email: emailField(input.email, 'email'),
		programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 }),
		jabatan: stringField(input.jabatan, 'jabatan', { maxLength: 50 })
	};
}

export function validateDosenUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.nip !== undefined && { nip: stringField(input.nip, 'nip', { maxLength: 20 }) }),
		...(input.nama !== undefined && { nama: stringField(input.nama, 'nama', { maxLength: 100 }) }),
		...(input.email !== undefined && { email: emailField(input.email, 'email') }),
		...(input.programStudiId !== undefined && {
			programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 })
		}),
		...(input.jabatan !== undefined && {
			jabatan: stringField(input.jabatan, 'jabatan', { maxLength: 50 })
		})
	});
}

export function validateMataKuliahCreate(input: Record<string, unknown>): MataKuliahFormData {
	return {
		kode: stringField(input.kode, 'kode', { maxLength: 20 }),
		nama: stringField(input.nama, 'nama', { maxLength: 100 }),
		sks: integerField(input.sks, 'sks', { min: 1, max: 24 }),
		semester: integerField(input.semester, 'semester', { min: 1, max: 14 }),
		programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 }),
		deskripsi: optionalStringField(input.deskripsi, 'deskripsi', { maxLength: 5000 }) ?? undefined
	};
}

export function validateMataKuliahUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.kode !== undefined && { kode: stringField(input.kode, 'kode', { maxLength: 20 }) }),
		...(input.nama !== undefined && { nama: stringField(input.nama, 'nama', { maxLength: 100 }) }),
		...(input.sks !== undefined && { sks: integerField(input.sks, 'sks', { min: 1, max: 24 }) }),
		...(input.semester !== undefined && {
			semester: integerField(input.semester, 'semester', { min: 1, max: 14 })
		}),
		...(input.programStudiId !== undefined && {
			programStudiId: integerField(input.programStudiId, 'programStudiId', { min: 1 })
		}),
		...(input.deskripsi !== undefined && {
			deskripsi: optionalStringField(input.deskripsi, 'deskripsi', { maxLength: 5000, allowNull: true })
		})
	});
}

export function validateRuangKelasCreate(input: Record<string, unknown>): RuangKelasFormData {
	return {
		kode: stringField(input.kode, 'kode', { maxLength: 20 }),
		nama: stringField(input.nama, 'nama', { maxLength: 100 }),
		tipe: enumField(input.tipe, 'tipe', Object.values(TipeRuangKelas)),
		kapasitas: integerField(input.kapasitas, 'kapasitas', { min: 1, max: 1000 }),
		hasProyektor: optionalBooleanField(input.hasProyektor, 'hasProyektor') ?? false,
		hasAC: optionalBooleanField(input.hasAC, 'hasAC') ?? false,
		gedung: stringField(input.gedung, 'gedung', { maxLength: 50 }),
		lantai: integerField(input.lantai, 'lantai', { min: 1, max: 200 }),
		status: optionalEnumField(input.status, 'status', Object.values(StatusRuangKelas)) ?? StatusRuangKelas.AVAILABLE
	};
}

export function validateRuangKelasUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.kode !== undefined && { kode: stringField(input.kode, 'kode', { maxLength: 20 }) }),
		...(input.nama !== undefined && { nama: stringField(input.nama, 'nama', { maxLength: 100 }) }),
		...(input.tipe !== undefined && {
			tipe: enumField(input.tipe, 'tipe', Object.values(TipeRuangKelas))
		}),
		...(input.kapasitas !== undefined && {
			kapasitas: integerField(input.kapasitas, 'kapasitas', { min: 1, max: 1000 })
		}),
		...(input.hasProyektor !== undefined && {
			hasProyektor: booleanField(input.hasProyektor, 'hasProyektor')
		}),
		...(input.hasAC !== undefined && { hasAC: booleanField(input.hasAC, 'hasAC') }),
		...(input.gedung !== undefined && { gedung: stringField(input.gedung, 'gedung', { maxLength: 50 }) }),
		...(input.lantai !== undefined && { lantai: integerField(input.lantai, 'lantai', { min: 1, max: 200 }) }),
		...(input.status !== undefined && {
			status: enumField(input.status, 'status', Object.values(StatusRuangKelas))
		})
	});
}

export function validateSemesterCreate(input: Record<string, unknown>): SemesterFormData {
	return {
		tahunAjaran: academicYearField(input.tahunAjaran),
		semester: enumField(input.semester, 'semester', Object.values(JenisSemester)),
		isActive: optionalBooleanField(input.isActive, 'isActive') ?? false
	};
}

export function validateSemesterUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.tahunAjaran !== undefined && { tahunAjaran: optionalAcademicYearField(input.tahunAjaran) }),
		...(input.semester !== undefined && {
			semester: enumField(input.semester, 'semester', Object.values(JenisSemester))
		}),
		...(input.isActive !== undefined && { isActive: booleanField(input.isActive, 'isActive') })
	});
}

export function validateJadwalCreate(input: Record<string, unknown>): JadwalFormData {
	const jadwal = {
		hari: enumField(input.hari, 'hari', Object.values(Hari)),
		jamMulai: timeField(input.jamMulai, 'jamMulai'),
		jamSelesai: timeField(input.jamSelesai, 'jamSelesai')
	};

	validateScheduleRange(jadwal.jamMulai, jadwal.jamSelesai);

	return jadwal;
}

export function validateJadwalUpdate(input: Record<string, unknown>) {
	const data = requireFields({
		...(input.hari !== undefined && { hari: enumField(input.hari, 'hari', Object.values(Hari)) }),
		...(input.jamMulai !== undefined && { jamMulai: optionalTimeField(input.jamMulai, 'jamMulai') }),
		...(input.jamSelesai !== undefined && { jamSelesai: optionalTimeField(input.jamSelesai, 'jamSelesai') })
	});

	if (typeof data.jamMulai === 'string' && typeof data.jamSelesai === 'string') {
		validateScheduleRange(data.jamMulai, data.jamSelesai);
	}

	return data;
}

export function validateEnrollmentCreate(input: Record<string, unknown>): EnrollmentFormData {
	return {
		mahasiswaId: integerField(input.mahasiswaId, 'mahasiswaId', { min: 1 }),
		mataKuliahId: integerField(input.mataKuliahId, 'mataKuliahId', { min: 1 }),
		dosenId: integerField(input.dosenId, 'dosenId', { min: 1 }),
		ruangKelasId: integerField(input.ruangKelasId, 'ruangKelasId', { min: 1 }),
		jadwalId: integerField(input.jadwalId, 'jadwalId', { min: 1 }),
		semesterId: integerField(input.semesterId, 'semesterId', { min: 1 }),
		status: optionalEnumField(input.status, 'status', Object.values(StatusEnrollment)) ?? StatusEnrollment.ACTIVE
	};
}

export function validateEnrollmentUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.dosenId !== undefined && { dosenId: integerField(input.dosenId, 'dosenId', { min: 1 }) }),
		...(input.ruangKelasId !== undefined && {
			ruangKelasId: integerField(input.ruangKelasId, 'ruangKelasId', { min: 1 })
		}),
		...(input.jadwalId !== undefined && { jadwalId: integerField(input.jadwalId, 'jadwalId', { min: 1 }) }),
		...(input.status !== undefined && {
			status: enumField(input.status, 'status', Object.values(StatusEnrollment))
		})
	});
}

export function validateNilaiCreate(input: Record<string, unknown>): NilaiFormData {
	return {
		enrollmentId: integerField(input.enrollmentId, 'enrollmentId', { min: 1 }),
		nilaiTugas: scoreField(input.nilaiTugas, 'nilaiTugas'),
		nilaiUTS: scoreField(input.nilaiUTS, 'nilaiUTS'),
		nilaiUAS: scoreField(input.nilaiUAS, 'nilaiUAS')
	};
}

export function validateNilaiUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.nilaiTugas !== undefined && { nilaiTugas: optionalScoreField(input.nilaiTugas, 'nilaiTugas') }),
		...(input.nilaiUTS !== undefined && { nilaiUTS: optionalScoreField(input.nilaiUTS, 'nilaiUTS') }),
		...(input.nilaiUAS !== undefined && { nilaiUAS: optionalScoreField(input.nilaiUAS, 'nilaiUAS') })
	});
}

export function validateKRSCreate(input: Record<string, unknown>): Pick<KRSFormData, 'mahasiswaId' | 'semesterId'> {
	return {
		mahasiswaId: integerField(input.mahasiswaId, 'mahasiswaId', { min: 1 }),
		semesterId: integerField(input.semesterId, 'semesterId', { min: 1 })
	};
}

export function validateKRSUpdate(input: Record<string, unknown>) {
	return requireFields({
		...(input.status !== undefined && {
			status: enumField(input.status, 'status', Object.values(StatusKRS))
		}),
		...(input.tanggalSubmit !== undefined && {
			tanggalSubmit: optionalDateField(input.tanggalSubmit, 'tanggalSubmit')
		})
	});
}

export function validateKrsCourseMutation(input: Record<string, unknown>) {
	return {
		mataKuliahId: integerField(input.mataKuliahId, 'mataKuliahId', { min: 1 })
	};
}
