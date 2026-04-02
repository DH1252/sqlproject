import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiHttpError, parsePagination } from './http';
import {
	validateNilaiCreate,
	validateProgramStudiCreate,
	validateSemesterCreate
} from './validation';

test('parsePagination rejects invalid limits', () => {
	assert.throws(() => parsePagination(new URL('https://example.com/api?page=1&limit=0')), ApiHttpError);
});

test('validateProgramStudiCreate trims and validates input', () => {
	const payload = validateProgramStudiCreate({
		kode: ' IF-01 ',
		nama: ' Informatika ',
		jenjang: 'S1'
	});

	assert.deepEqual(payload, {
		kode: 'IF-01',
		nama: 'Informatika',
		jenjang: 'S1'
	});
});

test('validateSemesterCreate enforces consecutive academic years', () => {
	assert.throws(
		() =>
			validateSemesterCreate({
				tahunAjaran: '2024/2026',
				semester: 'GANJIL',
				isActive: false
			}),
		/consecutive years/
	);
});

test('validateNilaiCreate keeps incomplete grades nullable', () => {
	const payload = validateNilaiCreate({
		enrollmentId: 12,
		nilaiTugas: null,
		nilaiUTS: 85,
		nilaiUAS: null
	});

	assert.deepEqual(payload, {
		enrollmentId: 12,
		nilaiTugas: null,
		nilaiUTS: 85,
		nilaiUAS: null
	});
});
