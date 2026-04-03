import assert from 'node:assert/strict';
import test from 'node:test';
import { Hari } from '$lib/types';
import { buildRoomTimetable } from './room-timetable';

test('buildRoomTimetable groups enrollments and reservations into weekly cells', () => {
	const timetable = buildRoomTimetable({
		slots: [
			{ id: 1, hari: Hari.SENIN, jamMulai: '08:00', jamSelesai: '10:00' },
			{ id: 2, hari: Hari.SELASA, jamMulai: '08:00', jamSelesai: '10:00' },
			{ id: 3, hari: Hari.SENIN, jamMulai: '10:00', jamSelesai: '12:00' }
		],
		enrollments: [
			{ jadwalId: 1, mataKuliah: { kode: 'IF101', nama: 'Algoritma' }, dosen: { nama: 'Dr. A' } },
			{ jadwalId: 1, mataKuliah: { kode: 'IF101', nama: 'Algoritma' }, dosen: { nama: 'Dr. A' } }
		],
		reservations: [{ jadwalId: 2, keterangan: 'Dipakai seminar' }]
	});

	assert.deepEqual(timetable.summary, {
		totalSlots: 3,
		occupiedSlots: 2,
		availableSlots: 1,
		reservedSlots: 1,
		scheduledSections: 1,
		studentEnrollments: 2
	});

	assert.deepEqual(timetable.days, [Hari.SENIN, Hari.SELASA]);
	assert.equal(timetable.rows.length, 2);
	assert.equal(timetable.rows[0].cells[0].occupancy, 'SECTION');
	assert.equal(timetable.rows[0].cells[0].sections[0].studentCount, 2);
	assert.equal(timetable.rows[0].cells[1].occupancy, 'RESERVED');
	assert.equal(timetable.rows[0].cells[1].reservationNote, 'Dipakai seminar');
	assert.equal(timetable.rows[1].cells[0].occupancy, 'EMPTY');
});
