import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeMahasiswaIpk } from './gpa';

test('summarizeMahasiswaIpk only counts completed enrollments with final grades', () => {
	const summary = summarizeMahasiswaIpk([
		{
			status: 'COMPLETED',
			nilai: { hurufMutu: 'A' },
			mataKuliah: { sks: 3 }
		},
		{
			status: 'COMPLETED',
			nilai: { hurufMutu: 'B' },
			mataKuliah: { sks: 2 }
		},
		{
			status: 'ACTIVE',
			nilai: { hurufMutu: 'A' },
			mataKuliah: { sks: 4 }
		},
		{
			status: 'COMPLETED',
			nilai: null,
			mataKuliah: { sks: 2 }
		}
	]);

	assert.deepEqual(summary, {
		ipk: 3.6,
		totalSks: 5,
		totalCourses: 2
	});
});

test('summarizeMahasiswaIpk returns zeros when no completed grade is eligible', () => {
	const summary = summarizeMahasiswaIpk([
		{
			status: 'ACTIVE',
			nilai: { hurufMutu: 'A' },
			mataKuliah: { sks: 3 }
		},
		{
			status: 'COMPLETED',
			nilai: { hurufMutu: null },
			mataKuliah: { sks: 2 }
		}
	]);

	assert.deepEqual(summary, {
		ipk: 0,
		totalSks: 0,
		totalCourses: 0
	});
});
