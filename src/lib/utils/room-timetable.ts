import { Hari } from '$lib/types';
import type { RoomTimetableCell, RoomTimetableRow, RoomTimetableSection } from '$lib/types';

export interface TimetableSlotInput {
	id: number;
	hari: string;
	jamMulai: string;
	jamSelesai: string;
}

export interface TimetableEnrollmentInput {
	jadwalId: number;
	mataKuliah: { kode: string; nama: string };
	dosen: { nama: string };
}

export interface TimetableReservationInput {
	jadwalId: number;
	keterangan?: string | null;
}

const DAY_ORDER: Hari[] = [Hari.SENIN, Hari.SELASA, Hari.RABU, Hari.KAMIS, Hari.JUMAT, Hari.SABTU, Hari.MINGGU];

function timeValue(value: string) {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
}

function makeLabel(jamMulai: string, jamSelesai: string) {
	return `${jamMulai} - ${jamSelesai}`;
}

export function buildRoomTimetable(params: {
	slots: readonly TimetableSlotInput[];
	enrollments: readonly TimetableEnrollmentInput[];
	reservations: readonly TimetableReservationInput[];
}) {
	const slotsById = new Map(params.slots.map((slot) => [slot.id, slot]));
	const sectionMap = new Map<number, Map<string, RoomTimetableSection>>();
	const reservationMap = new Map<number, string | null>();

	for (const enrollment of params.enrollments) {
		const sectionsForSlot = sectionMap.get(enrollment.jadwalId) ?? new Map<string, RoomTimetableSection>();
		const key = [
			enrollment.mataKuliah.kode,
			enrollment.mataKuliah.nama,
			enrollment.dosen.nama
		].join('::');
		const existingSection = sectionsForSlot.get(key) ?? {
			key,
			mataKuliahKode: enrollment.mataKuliah.kode,
			mataKuliahNama: enrollment.mataKuliah.nama,
			dosenNama: enrollment.dosen.nama,
			studentCount: 0
		};

		existingSection.studentCount += 1;
		sectionsForSlot.set(key, existingSection);
		sectionMap.set(enrollment.jadwalId, sectionsForSlot);
	}

	for (const reservation of params.reservations) {
		reservationMap.set(reservation.jadwalId, reservation.keterangan ?? null);
	}

	const days = DAY_ORDER.filter((day) => params.slots.some((slot) => slot.hari === day));
	const uniqueTimes = Array.from(
		new Map(params.slots.map((slot) => [`${slot.jamMulai}-${slot.jamSelesai}`, slot])).values()
	).sort((a, b) => timeValue(a.jamMulai) - timeValue(b.jamMulai));

	const rows: RoomTimetableRow[] = uniqueTimes.map((timeSlot) => {
		const cells: RoomTimetableCell[] = days.map((day) => {
			const slot = params.slots.find(
				(candidate) =>
					candidate.hari === day &&
					candidate.jamMulai === timeSlot.jamMulai &&
					candidate.jamSelesai === timeSlot.jamSelesai
			);

			if (!slot) {
				return {
					hari: day,
					jadwalId: null,
					jamMulai: timeSlot.jamMulai,
					jamSelesai: timeSlot.jamSelesai,
					label: makeLabel(timeSlot.jamMulai, timeSlot.jamSelesai),
					occupancy: 'EMPTY',
					sections: [],
					reservationNote: null
				};
			}

			const sections = Array.from(sectionMap.get(slot.id)?.values() ?? []);
			const reservationNote = reservationMap.get(slot.id) ?? null;

			return {
				hari: day,
				jadwalId: slot.id,
				jamMulai: slot.jamMulai,
				jamSelesai: slot.jamSelesai,
				label: makeLabel(slot.jamMulai, slot.jamSelesai),
				occupancy: sections.length > 0 ? 'SECTION' : reservationNote ? 'RESERVED' : 'EMPTY',
				sections,
				reservationNote
			};
		});

		return {
			jamMulai: timeSlot.jamMulai,
			jamSelesai: timeSlot.jamSelesai,
			label: makeLabel(timeSlot.jamMulai, timeSlot.jamSelesai),
			cells
		};
	});

	const scheduledSections = Array.from(sectionMap.values()).reduce((sum, sections) => sum + sections.size, 0);
	const studentEnrollments = Array.from(sectionMap.values()).reduce(
		(sum, sections) =>
			sum + Array.from(sections.values()).reduce((sectionSum, section) => sectionSum + section.studentCount, 0),
		0
	);
	const reservedSlots = reservationMap.size;
	const occupiedSlots = params.slots.filter((slot) => {
		const hasSection = (sectionMap.get(slot.id)?.size ?? 0) > 0;
		const hasReservation = reservationMap.has(slot.id);
		return hasSection || hasReservation;
	}).length;

	return {
		days,
		rows,
		summary: {
			totalSlots: params.slots.length,
			occupiedSlots,
			availableSlots: Math.max(params.slots.length - occupiedSlots, 0),
			reservedSlots,
			scheduledSections,
			studentEnrollments
		}
	};
}
