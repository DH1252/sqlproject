<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { ruangKelasService } from '$lib/api/services/ruangKelas';
	import { semesterService } from '$lib/api/services/semester';
	import type { Hari, RuangKelas, RuangKelasTimetableResponse, Semester } from '$lib/types';

	const dayLabels: Record<Hari, string> = {
		SENIN: 'Senin',
		SELASA: 'Selasa',
		RABU: 'Rabu',
		KAMIS: 'Kamis',
		JUMAT: 'Jumat',
		SABTU: 'Sabtu',
		MINGGU: 'Minggu'
	};

	let rooms = $state<RuangKelas[]>([]);
	let semesters = $state<Semester[]>([]);
	let selectedRoomId = $state<number | ''>('');
	let selectedSemesterId = $state<number | ''>('');
	let timetable = $state<RuangKelasTimetableResponse | null>(null);
	let loadingOptions = $state(false);
	let loadingTimetable = $state(false);
	let error = $state('');
	const selectedRoomLabel = $derived(
		selectedRoomId === '' ? '' : rooms.find((room) => room.id === Number(selectedRoomId))?.nama ?? ''
	);
	const selectedSemesterLabel = $derived(
		selectedSemesterId === ''
			? ''
			: semesters.find((semester) => semester.id === Number(selectedSemesterId))
				? `${semesters.find((semester) => semester.id === Number(selectedSemesterId))?.tahunAjaran} ${semesters.find((semester) => semester.id === Number(selectedSemesterId))?.semester}`
				: ''
	);

	type MobileAgendaEntry = {
		label: string;
		cell: RuangKelasTimetableResponse['rows'][number]['cells'][number];
	};

	function formatHari(hari: Hari) {
		return dayLabels[hari] ?? hari;
	}

	function syncQuery() {
		if (!browser) {
			return;
		}

		const url = new URL(window.location.href);
		if (selectedRoomId === '') {
			url.searchParams.delete('ruangKelasId');
		} else {
			url.searchParams.set('ruangKelasId', String(selectedRoomId));
		}

		if (selectedSemesterId === '') {
			url.searchParams.delete('semesterId');
		} else {
			url.searchParams.set('semesterId', String(selectedSemesterId));
		}

		replaceState(url, {});
	}

	async function loadOptions() {
		loadingOptions = true;
		error = '';

		try {
			const [roomResponse, semesterResponse, activeSemesterResponse] = await Promise.all([
				ruangKelasService.getAll({ limit: 100 }),
				semesterService.getAll({ limit: 100 }),
				semesterService.getActive()
			]);

			if (!roomResponse.success) {
				error = roomResponse.error || 'Daftar ruang kelas belum berhasil dimuat.';
				return;
			}

			if (!semesterResponse.success) {
				error = semesterResponse.error || 'Daftar semester belum berhasil dimuat.';
				return;
			}

			rooms = roomResponse.data;
			semesters = semesterResponse.data;

			const requestedRoomId = Number(page.url.searchParams.get('ruangKelasId') ?? '');
			const requestedSemesterId = Number(page.url.searchParams.get('semesterId') ?? '');
			const fallbackRoomId = rooms[0]?.id ?? 0;
			const activeSemesterId = activeSemesterResponse.success ? activeSemesterResponse.data.id : 0;
			const fallbackSemesterId = activeSemesterId || semesters[0]?.id || 0;

			selectedRoomId = rooms.some((room) => room.id === requestedRoomId) ? requestedRoomId : fallbackRoomId;
			selectedSemesterId = semesters.some((semester) => semester.id === requestedSemesterId)
				? requestedSemesterId
				: fallbackSemesterId;
		} catch {
			error = 'Koneksi bermasalah saat memuat daftar ruang dan semester.';
		} finally {
			loadingOptions = false;
		}
	}

	async function loadTimetable() {
		if (selectedRoomId === '' || selectedSemesterId === '') {
			timetable = null;
			return;
		}

		loadingTimetable = true;
		error = '';

		try {
			const response = await ruangKelasService.getTimetable(Number(selectedRoomId), Number(selectedSemesterId));
			if (response.success) {
				timetable = response.data;
				syncQuery();
			} else {
				timetable = null;
				error = response.error || 'Timetable ruang belum berhasil dimuat.';
			}
		} catch {
			timetable = null;
			error = 'Koneksi bermasalah saat memuat timetable ruang.';
		} finally {
			loadingTimetable = false;
		}
	}

	async function initializePage() {
		await loadOptions();

		if (selectedRoomId !== '' && selectedSemesterId !== '') {
			await loadTimetable();
		}
	}

	async function handleSelectionChange() {
		await loadTimetable();
	}

	function occupancyTone(kind: string) {
		if (kind === 'SECTION') return 'occupancy-card occupancy-section';
		if (kind === 'RESERVED') return 'occupancy-card occupancy-reserved';
		return 'occupancy-card occupancy-empty';
	}

	const mobileAgenda = $derived(
		timetable
			? (() => {
					const currentTimetable = timetable;

					return currentTimetable.days.map((day: Hari, index: number) => {
						const entries = currentTimetable.rows
							.map((row: RuangKelasTimetableResponse['rows'][number]) => {
								const cell = row.cells[index];
								return cell ? { label: row.label, cell } : null;
							})
							.filter((entry): entry is MobileAgendaEntry => Boolean(entry))
							.filter((entry: MobileAgendaEntry) => entry.cell.occupancy !== 'EMPTY');

						return {
							day,
							entries,
							emptySlots: currentTimetable.rows.length - entries.length
						};
					});
				})()
			: []
	);

	onMount(() => {
		void initializePage();
	});
</script>

<svelte:head>
	<title>Timetable Ruang - Sistem Akademik</title>
</svelte:head>

<div class="space-y-6">
	<section class="space-y-2">
		<p class="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Ruang & Jadwal</p>
		<h1 class="text-3xl font-display font-semibold text-balance">Timetable Ruang Kelas</h1>
		<p class="max-w-3xl text-muted text-pretty">
			Lihat okupansi mingguan ruang kelas berdasarkan semester, lengkap dengan section kuliah dan reservasi ruang.
		</p>
	</section>

	<section class="card-elevated p-6 space-y-4">
		<div class="sr-only" aria-live="polite" aria-atomic="true">
			{#if loadingOptions}
				Memuat daftar ruang kelas dan semester.
			{:else if loadingTimetable && selectedRoomLabel && selectedSemesterLabel}
				Memuat timetable untuk {selectedRoomLabel} pada semester {selectedSemesterLabel}.
			{:else if error}
				{error}
			{:else if timetable}
				Menampilkan timetable untuk {timetable.room.nama} pada semester {timetable.semester?.tahunAjaran} {timetable.semester?.semester}.
			{/if}
		</div>

		<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
			<label class="form-control">
				<span class="label-text font-medium">Ruang kelas</span>
				<select class="select select-bordered w-full" bind:value={selectedRoomId} onchange={handleSelectionChange} disabled={loadingOptions || rooms.length === 0}>
					<option value="">Pilih ruang kelas</option>
					{#each rooms as room}
						<option value={room.id}>{room.kode} - {room.nama}</option>
					{/each}
				</select>
			</label>

			<label class="form-control">
				<span class="label-text font-medium">Semester</span>
				<select class="select select-bordered w-full" bind:value={selectedSemesterId} onchange={handleSelectionChange} disabled={loadingOptions || semesters.length === 0}>
					<option value="">Pilih semester</option>
					{#each semesters as semester}
						<option value={semester.id}>{semester.tahunAjaran} {semester.semester}</option>
					{/each}
				</select>
			</label>

			<div class="flex items-end gap-2">
				<button class="btn btn-ghost" onclick={initializePage} disabled={loadingOptions || loadingTimetable}>
					{#if loadingOptions || loadingTimetable}
						<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					{/if}
					Muat ulang
				</button>
			</div>
		</div>

		<div class="flex flex-wrap gap-2 text-xs text-muted">
			<span class="status-chip tone-emerald inline-flex items-center gap-2 px-3 py-1">
				<span class="occupancy-dot"></span> Section kuliah
			</span>
			<span class="status-chip tone-gold inline-flex items-center gap-2 px-3 py-1">
				<span class="occupancy-dot"></span> Reservasi ruang
			</span>
			<span class="status-chip tone-slate inline-flex items-center gap-2 px-3 py-1">
				<span class="occupancy-dot"></span> Slot kosong
			</span>
		</div>

		{#if error}
			<div class="alert alert-error" role="alert">
				<span>{error}</span>
			</div>
		{/if}
	</section>

	{#if loadingTimetable}
		<div class="card-elevated flex justify-center p-12" role="status">
			<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
			<span class="sr-only">Memuat...</span>
		</div>
	{:else if timetable}
		<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<div class="card-elevated p-5">
				<p class="text-sm text-muted">Ruang</p>
				<p class="mt-2 text-xl font-semibold">{timetable.room.kode} - {timetable.room.nama}</p>
				<p class="mt-1 text-xs text-muted">{timetable.room.gedung}, lantai {timetable.room.lantai} • kapasitas {timetable.room.kapasitas}</p>
			</div>
			<div class="card-elevated p-5">
				<p class="text-sm text-muted">Semester</p>
				<p class="mt-2 text-xl font-semibold">{timetable.semester?.tahunAjaran} {timetable.semester?.semester}</p>
				<p class="mt-1 text-xs text-muted">{timetable.summary.occupiedSlots}/{timetable.summary.totalSlots} slot terpakai</p>
			</div>
			<div class="card-elevated p-5">
				<p class="text-sm text-muted">Section terjadwal</p>
				<p class="mt-2 text-xl font-semibold">{timetable.summary.scheduledSections}</p>
				<p class="mt-1 text-xs text-muted">{timetable.summary.studentEnrollments} enrollment mahasiswa</p>
			</div>
			<div class="card-elevated p-5">
				<p class="text-sm text-muted">Reservasi & slot kosong</p>
				<p class="mt-2 text-xl font-semibold">{timetable.summary.reservedSlots} reservasi</p>
				<p class="mt-1 text-xs text-muted">{timetable.summary.availableSlots} slot masih kosong</p>
			</div>
		</section>

		<section class="space-y-4 xl:hidden">
			{#each mobileAgenda as agenda}
				<div class="card-elevated p-4 space-y-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h2 class="text-lg font-display font-semibold">{formatHari(agenda.day)}</h2>
							<p class="text-sm text-muted">
								{agenda.entries.length > 0
									? `${agenda.entries.length} slot terisi atau direservasi`
									: 'Belum ada aktivitas ruang'}
							</p>
						</div>
						<span class="status-chip tone-slate">{agenda.emptySlots} slot kosong</span>
					</div>

					{#if agenda.entries.length === 0}
						<div class="rounded-lg border border-base-300/70 bg-base-200 px-4 py-5 text-sm text-muted">
							Tidak ada section kuliah atau reservasi ruang pada hari ini.
						</div>
					{:else}
						<div class="space-y-3">
							{#each agenda.entries as entry}
								<div class={`rounded-lg border p-4 text-sm ${occupancyTone(entry.cell.occupancy)}`}>
									<p class="text-xs font-medium uppercase tracking-[0.16em] text-current-subtle">{entry.label}</p>
									<div class="mt-2 space-y-2">
										{#if entry.cell.occupancy === 'SECTION'}
											{#each entry.cell.sections as section}
												<div class="space-y-1">
													<p class="font-semibold">{section.mataKuliahKode} - {section.mataKuliahNama}</p>
												<p class="text-xs text-current-muted">{section.dosenNama}</p>
												<p class="text-xs text-current-muted">{section.studentCount} mahasiswa</p>
												</div>
											{/each}
										{:else}
											<p class="font-semibold">Reservasi ruang</p>
											<p class="text-xs text-current-muted">{entry.cell.reservationNote || 'Dipakai untuk kegiatan non-kuliah.'}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</section>

		<section class="card-elevated hidden overflow-hidden xl:block">
			<div class="overflow-x-auto">
			<table class="table-refined w-full min-w-[44rem]" aria-label="Jadwal penggunaan ruang">
				<thead>
					<tr>
					<th scope="col" class="w-32">Waktu</th>
						{#each timetable.days as day}
							<th scope="col">{formatHari(day)}</th>
						{/each}
					</tr>
					</thead>
					<tbody>
						{#if timetable.rows.length === 0}
							<tr>
								<td colspan={timetable.days.length + 1} class="py-12 text-center text-muted">Belum ada slot jadwal untuk divisualkan.</td>
							</tr>
						{:else}
							{#each timetable.rows as row}
								<tr>
									<td class="align-top">
										<div class="font-medium">{row.label}</div>
									</td>
									{#each row.cells as cell}
										<td class="align-top">
											<div class={`min-h-28 rounded-lg border p-3 text-sm ${occupancyTone(cell.occupancy)}`}>
												{#if cell.occupancy === 'SECTION'}
													<div class="space-y-2">
														{#each cell.sections as section}
															<div class="space-y-1">
																<p class="font-semibold">{section.mataKuliahKode} - {section.mataKuliahNama}</p>
												<p class="text-xs text-current-muted">{section.dosenNama}</p>
												<p class="text-xs text-current-muted">{section.studentCount} mahasiswa</p>
															</div>
														{/each}
													</div>
												{:else if cell.occupancy === 'RESERVED'}
													<div class="space-y-1">
														<p class="font-semibold">Reservasi ruang</p>
											<p class="text-xs text-current-muted">{cell.reservationNote || 'Dipakai untuk kegiatan non-kuliah.'}</p>
													</div>
												{:else}
											<div class="flex h-full items-center justify-center text-xs text-current-subtle">
												Slot kosong
											</div>
												{/if}
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</section>
	{:else}
		<div class="card-elevated p-10 text-center text-muted">
			Pilih ruang kelas dan semester untuk menampilkan timetable mingguan.
		</div>
	{/if}
</div>
