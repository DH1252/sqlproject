export interface RoomAvailabilitySnapshot {
	status: string;
	hasReservedSlot: boolean;
	hasEnrollmentConflict: boolean;
}

export interface RoomUtilizationBase {
	id: number;
	kode: string;
	nama: string;
	tipe: string;
	kapasitas: number;
	status: string;
	gedung: string;
	lantai: number;
}

export interface RoomUtilizationEnrollmentRecord {
	ruangKelasId: number;
	jadwalId: number;
	mataKuliahId: number;
	dosenId: number;
	semesterId?: number;
}

export interface RoomUtilizationReservationRecord {
	ruangKelasId: number;
	jadwalId: number;
}

export interface RoomUtilizationItem extends RoomUtilizationBase {
	totalSlots: number;
	usedSlots: number;
	availableSlots: number;
	utilizationRate: number;
	reservedSlots: number;
	scheduledSections: number;
	studentEnrollments: number;
}

export interface RoomUtilizationSummary {
	totalRooms: number;
	activeRooms: number;
	averageUtilizationRate: number;
	totalUsedSlots: number;
	totalSlots: number;
	totalStudentEnrollments: number;
	totalScheduledSections: number;
}

function roundToTwoDecimals(value: number) {
	return Math.round(value * 100) / 100;
}

export function summarizeRoomAvailability(snapshot: RoomAvailabilitySnapshot) {
	const conflicts: string[] = [];

	if (snapshot.status !== 'AVAILABLE') {
		conflicts.push(`Room status is ${snapshot.status}`);
	}

	if (snapshot.hasReservedSlot) {
		conflicts.push('Room is reserved in jadwal ruangan for this semester and slot');
	}

	if (snapshot.hasEnrollmentConflict) {
		conflicts.push('Room is already assigned to an active enrollment for this semester and slot');
	}

	return {
		available: conflicts.length === 0,
		conflicts
	};
}

export function summarizeRoomUtilization(params: {
	rooms: readonly RoomUtilizationBase[];
	totalSlots: number;
	enrollments: readonly RoomUtilizationEnrollmentRecord[];
	reservations: readonly RoomUtilizationReservationRecord[];
}) {
	const roomMetrics = new Map<
		number,
		{
			reservedSlotIds: Set<number>;
			usedSlotIds: Set<number>;
			sectionKeys: Set<string>;
			studentEnrollments: number;
		}
	>();

	for (const room of params.rooms) {
		roomMetrics.set(room.id, {
			reservedSlotIds: new Set<number>(),
			usedSlotIds: new Set<number>(),
			sectionKeys: new Set<string>(),
			studentEnrollments: 0
		});
	}

	for (const reservation of params.reservations) {
		const metrics = roomMetrics.get(reservation.ruangKelasId);

		if (!metrics) {
			continue;
		}

		metrics.reservedSlotIds.add(reservation.jadwalId);
		metrics.usedSlotIds.add(reservation.jadwalId);
	}

	for (const enrollment of params.enrollments) {
		const metrics = roomMetrics.get(enrollment.ruangKelasId);

		if (!metrics) {
			continue;
		}

		metrics.usedSlotIds.add(enrollment.jadwalId);
		metrics.studentEnrollments += 1;
		metrics.sectionKeys.add(
			[
				enrollment.semesterId ?? 'current',
				enrollment.mataKuliahId,
				enrollment.dosenId,
				enrollment.jadwalId
			].join(':')
		);
	}

	const rooms = params.rooms
		.map<RoomUtilizationItem>((room) => {
			const metrics = roomMetrics.get(room.id);
			const usedSlots = metrics?.usedSlotIds.size ?? 0;
			const reservedSlots = metrics?.reservedSlotIds.size ?? 0;
			const scheduledSections = metrics?.sectionKeys.size ?? 0;
			const studentEnrollments = metrics?.studentEnrollments ?? 0;
			const totalSlots = params.totalSlots;
			const availableSlots = Math.max(totalSlots - usedSlots, 0);
			const utilizationRate = totalSlots > 0 ? roundToTwoDecimals((usedSlots / totalSlots) * 100) : 0;

			return {
				...room,
				totalSlots,
				usedSlots,
				availableSlots,
				utilizationRate,
				reservedSlots,
				scheduledSections,
				studentEnrollments
			};
		})
		.sort(
			(a, b) =>
				b.utilizationRate - a.utilizationRate ||
				b.scheduledSections - a.scheduledSections ||
				a.nama.localeCompare(b.nama)
		);

	const summary: RoomUtilizationSummary = {
		totalRooms: rooms.length,
		activeRooms: rooms.filter((room) => room.usedSlots > 0).length,
		averageUtilizationRate:
			rooms.length > 0
				? roundToTwoDecimals(
						rooms.reduce((sum, room) => sum + room.utilizationRate, 0) / rooms.length
					)
				: 0,
		totalUsedSlots: rooms.reduce((sum, room) => sum + room.usedSlots, 0),
		totalSlots: rooms.length * params.totalSlots,
		totalStudentEnrollments: rooms.reduce((sum, room) => sum + room.studentEnrollments, 0),
		totalScheduledSections: rooms.reduce((sum, room) => sum + room.scheduledSections, 0)
	};

	return {
		summary,
		rooms
	};
}
