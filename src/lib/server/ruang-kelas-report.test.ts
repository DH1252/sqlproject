import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeRoomAvailability, summarizeRoomUtilization } from './ruang-kelas-report';

test('summarizeRoomAvailability reports availability conflicts consistently', () => {
	assert.deepEqual(
		summarizeRoomAvailability({
			status: 'AVAILABLE',
			hasReservedSlot: false,
			hasEnrollmentConflict: false
		}),
		{ available: true, conflicts: [] }
	);

	assert.deepEqual(
		summarizeRoomAvailability({
			status: 'MAINTENANCE',
			hasReservedSlot: true,
			hasEnrollmentConflict: true
		}),
		{
			available: false,
			conflicts: [
				'Room status is MAINTENANCE',
				'Room is reserved in jadwal ruangan for this semester and slot',
				'Room is already assigned to an active enrollment for this semester and slot'
			]
		}
	);
});

test('summarizeRoomUtilization tracks slot usage, sections, and enrollments', () => {
	const report = summarizeRoomUtilization({
		rooms: [
			{
				id: 1,
				kode: 'R101',
				nama: 'Ruang 101',
				tipe: 'REGULER',
				kapasitas: 30,
				status: 'AVAILABLE',
				gedung: 'A',
				lantai: 1
			},
			{
				id: 2,
				kode: 'LAB1',
				nama: 'Lab Komputer 1',
				tipe: 'LAB_KOMPUTER',
				kapasitas: 24,
				status: 'AVAILABLE',
				gedung: 'B',
				lantai: 2
			}
		],
		totalSlots: 5,
		enrollments: [
			{ ruangKelasId: 1, jadwalId: 1, mataKuliahId: 10, dosenId: 3, semesterId: 7 },
			{ ruangKelasId: 1, jadwalId: 1, mataKuliahId: 10, dosenId: 3, semesterId: 7 },
			{ ruangKelasId: 1, jadwalId: 2, mataKuliahId: 11, dosenId: 4, semesterId: 7 },
			{ ruangKelasId: 2, jadwalId: 3, mataKuliahId: 12, dosenId: 5, semesterId: 7 }
		],
		reservations: [{ ruangKelasId: 2, jadwalId: 4 }]
	});

	assert.deepEqual(report.summary, {
		totalRooms: 2,
		activeRooms: 2,
		averageUtilizationRate: 40,
		totalUsedSlots: 4,
		totalSlots: 10,
		totalStudentEnrollments: 4,
		totalScheduledSections: 3
	});

	assert.deepEqual(report.rooms[0], {
		id: 1,
		kode: 'R101',
		nama: 'Ruang 101',
		tipe: 'REGULER',
		kapasitas: 30,
		status: 'AVAILABLE',
		gedung: 'A',
		lantai: 1,
		totalSlots: 5,
		usedSlots: 2,
		availableSlots: 3,
		utilizationRate: 40,
		reservedSlots: 0,
		scheduledSections: 2,
		studentEnrollments: 3
	});

	assert.deepEqual(report.rooms[1], {
		id: 2,
		kode: 'LAB1',
		nama: 'Lab Komputer 1',
		tipe: 'LAB_KOMPUTER',
		kapasitas: 24,
		status: 'AVAILABLE',
		gedung: 'B',
		lantai: 2,
		totalSlots: 5,
		usedSlots: 2,
		availableSlots: 3,
		utilizationRate: 40,
		reservedSlots: 1,
		scheduledSections: 1,
		studentEnrollments: 1
	});
});
