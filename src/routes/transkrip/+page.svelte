<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { formatScore } from '$lib/utils/grade-calculator';
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { getEnrollmentStatusChip, getGradeStatusChip } from '$lib/utils/status-chip';
	import { buildTranscriptReport } from '$lib/utils/transcript';
	import type { Mahasiswa, MahasiswaAcademicRecord } from '$lib/types';

	let students = $state<Mahasiswa[]>([]);
	let selectedMahasiswaId = $state<number | ''>('');
	let academicRecord = $state<MahasiswaAcademicRecord | null>(null);
	let loadingStudents = $state(false);
	let loadingRecord = $state(false);
	let error = $state('');

	const transcript = $derived(academicRecord ? buildTranscriptReport(academicRecord.enrollments ?? []) : null);
	const selectedStudentLabel = $derived(
		selectedMahasiswaId === '' ? '' : students.find((student) => student.id === Number(selectedMahasiswaId))?.nama ?? ''
	);

	function formatDecimal(value: number) {
		return value.toFixed(2);
	}

	function syncQuery() {
		if (!browser) {
			return;
		}

		const url = new URL(window.location.href);
		if (selectedMahasiswaId === '') {
			url.searchParams.delete('mahasiswaId');
		} else {
			url.searchParams.set('mahasiswaId', String(selectedMahasiswaId));
		}

		replaceState(url, {});
	}

	function transcriptUrl(id: number) {
		return `/transkrip?mahasiswaId=${id}`;
	}

	async function loadStudents() {
		loadingStudents = true;
		try {
			const response = await mahasiswaService.getAll({ limit: 100 });
			if (response.success) {
				students = response.data;
			} else {
				error = response.error || 'Daftar mahasiswa belum berhasil dimuat.';
			}
		} catch {
			error = 'Koneksi bermasalah saat memuat daftar mahasiswa.';
		} finally {
			loadingStudents = false;
		}
	}

	async function loadAcademicRecord(mahasiswaId: number) {
		loadingRecord = true;
		error = '';

		try {
			const response = await mahasiswaService.getAcademicRecord(mahasiswaId);
			if (response.success) {
				academicRecord = response.data;
				syncQuery();
			} else {
				academicRecord = null;
				error = response.error || 'Transkrip mahasiswa belum berhasil dimuat.';
			}
		} catch {
			academicRecord = null;
			error = 'Koneksi bermasalah saat memuat data transkrip.';
		} finally {
			loadingRecord = false;
		}
	}

	async function initializePage() {
		await loadStudents();

		if (students.length === 0) {
			selectedMahasiswaId = '';
			academicRecord = null;
			return;
		}

		const requestedId = Number(page.url.searchParams.get('mahasiswaId') ?? '');
		const defaultId = students[0]?.id ?? 0;
		const nextId = students.some((student) => student.id === requestedId) ? requestedId : defaultId;

		selectedMahasiswaId = nextId;
		await loadAcademicRecord(nextId);
	}

	async function handleStudentChange() {
		if (selectedMahasiswaId === '') {
			academicRecord = null;
			syncQuery();
			return;
		}

		await loadAcademicRecord(Number(selectedMahasiswaId));
	}

	onMount(() => {
		void initializePage();
	});
</script>

<svelte:head>
	<title>Transkrip - Sistem Akademik</title>
</svelte:head>

<div class="space-y-6">
	<section class="space-y-2">
		<p class="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Nilai & IPK</p>
		<h1 class="text-3xl font-display font-semibold text-balance">Transkrip Akademik</h1>
		<p class="max-w-3xl text-muted text-pretty">
			Tinjau riwayat mata kuliah, IPS per semester, dan IPK kumulatif mahasiswa dari satu halaman kerja.
		</p>
	</section>

	<section class="card-elevated p-6 space-y-4">
		<div class="sr-only" aria-live="polite" aria-atomic="true">
			{#if loadingStudents}
				Memuat daftar mahasiswa.
			{:else if loadingRecord && selectedStudentLabel}
				Memuat transkrip untuk {selectedStudentLabel}.
			{:else if error}
				{error}
			{:else if academicRecord}
				Menampilkan transkrip untuk {academicRecord.nama}.
			{/if}
		</div>

		<div class="flex flex-col gap-4 lg:flex-row lg:items-end">
			<label class="form-control w-full lg:max-w-xl">
				<span class="label-text font-medium">Pilih mahasiswa</span>
				<select
					class="select select-bordered w-full"
					bind:value={selectedMahasiswaId}
					onchange={handleStudentChange}
					disabled={loadingStudents || students.length === 0}
				>
					<option value="">Pilih mahasiswa</option>
					{#each students as student}
						<option value={student.id}>{student.nim} - {student.nama}</option>
					{/each}
				</select>
			</label>
			<div class="flex gap-2">
				<button class="btn btn-ghost" onclick={initializePage} disabled={loadingStudents || loadingRecord}>
					{#if loadingStudents || loadingRecord}
						<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					{/if}
					Muat ulang
				</button>
				{#if academicRecord}
					<a class="btn btn-primary" href={transcriptUrl(academicRecord.id)}>Tautan Halaman</a>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="alert alert-error" role="alert">
				<span>{error}</span>
			</div>
		{/if}
	</section>

	{#if loadingRecord}
		<div class="card-elevated flex justify-center p-12" role="status">
			<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
			<span class="sr-only">Memuat...</span>
		</div>
	{:else if academicRecord && transcript}
		<section class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
			<div class="card-elevated p-6 space-y-4">
				<div>
					<p class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Profil mahasiswa</p>
					<h2 class="mt-2 text-2xl font-display font-semibold">{academicRecord.nim} - {academicRecord.nama}</h2>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-muted">Program studi</p>
						<p class="mt-1 font-medium">{academicRecord.programStudi?.nama || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-muted">Angkatan</p>
						<p class="mt-1 font-medium">{academicRecord.angkatan}</p>
					</div>
					<div>
						<p class="text-sm text-muted">Email</p>
						<p class="mt-1 font-medium break-all">{academicRecord.email}</p>
					</div>
					<div>
						<p class="text-sm text-muted">Status</p>
					<span class={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getEnrollmentStatusChip(academicRecord.status)}`}>
							{formatAcademicLabel(academicRecord.status)}
						</span>
					</div>
				</div>
			</div>

			<div class="card-elevated p-6 space-y-4">
				<div>
					<p class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Ringkasan akademik</p>
					<h2 class="mt-2 text-2xl font-display font-semibold">IPK {formatDecimal(academicRecord.ipkCalculation?.ipk ?? transcript.summary.ipk)}</h2>
				</div>
				<div class="grid grid-cols-2 gap-x-6 gap-y-1 divide-y divide-base-300/50 text-sm">
					<div class="py-3">
						<p class="text-muted">SKS diambil</p>
						<p class="mt-1 text-xl font-semibold">{transcript.summary.totalSksDiambil}</p>
					</div>
					<div class="py-3">
						<p class="text-muted">SKS lulus</p>
						<p class="mt-1 text-xl font-semibold">{transcript.summary.totalSksLulus}</p>
					</div>
					<div class="py-3">
						<p class="text-muted">MK final</p>
						<p class="mt-1 text-xl font-semibold">{academicRecord.ipkCalculation?.totalCourses ?? transcript.summary.gradedCourses}</p>
					</div>
					<div class="py-3">
						<p class="text-muted">Semester tercatat</p>
						<p class="mt-1 text-xl font-semibold">{transcript.summary.totalSemesters}</p>
					</div>
				</div>
			</div>
		</section>

		<section class="card-elevated p-6 space-y-4">
			<div>
				<h2 class="text-xl font-display font-semibold">Rekap Semester</h2>
				<p class="text-sm text-muted">IPS dihitung dari mata kuliah berstatus selesai dengan huruf mutu final.</p>
			</div>
			<div class="space-y-3 xl:hidden">
				{#if transcript.semesters.length === 0}
					<div class="rounded-lg border border-base-300/70 bg-base-200 px-4 py-5 text-sm text-muted">
						Belum ada semester dengan nilai final.
					</div>
				{:else}
					{#each transcript.semesters as semester}
						<div class="rounded-lg border border-base-300/70 bg-base-100 p-4 space-y-3">
							<div>
								<p class="text-xs font-medium uppercase tracking-[0.16em] text-subtle">{semester.tahunAjaran}</p>
								<h3 class="text-lg font-display font-semibold">{formatAcademicLabel(semester.semester)}</h3>
							</div>
							<dl class="grid grid-cols-2 gap-3 text-sm">
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">IPS</dt><dd class="mt-1 font-medium">{formatDecimal(semester.ips)}</dd></div>
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">SKS diambil</dt><dd class="mt-1 font-medium">{semester.totalSksDiambil}</dd></div>
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">SKS lulus</dt><dd class="mt-1 font-medium">{semester.totalSksLulus}</dd></div>
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">MK final</dt><dd class="mt-1 font-medium">{semester.gradedCourses}</dd></div>
							</dl>
						</div>
					{/each}
				{/if}
			</div>
		<div class="hidden overflow-x-auto xl:block">
			<table class="table-refined w-full min-w-[38rem]" aria-label="Rekap semester">
				<thead>
					<tr>
					<th scope="col">Tahun Ajaran</th>
					<th scope="col">Semester</th>
					<th scope="col" class="text-right">IPS</th>
						<th scope="col" class="text-right">SKS Diambil</th>
						<th scope="col" class="text-right">SKS Lulus</th>
						<th scope="col" class="text-right">MK Final</th>
					</tr>
					</thead>
					<tbody>
						{#if transcript.semesters.length === 0}
							<tr>
								<td colspan="6" class="py-10 text-center text-muted">Belum ada semester dengan nilai final.</td>
							</tr>
						{:else}
							{#each transcript.semesters as semester}
								<tr>
									<td>{semester.tahunAjaran}</td>
									<td>{formatAcademicLabel(semester.semester)}</td>
									<td class="text-right font-medium">{formatDecimal(semester.ips)}</td>
									<td class="text-right">{semester.totalSksDiambil}</td>
									<td class="text-right">{semester.totalSksLulus}</td>
									<td class="text-right">{semester.gradedCourses}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</section>

		<section class="card-elevated p-6 space-y-4">
			<div>
				<h2 class="text-xl font-display font-semibold">Riwayat Mata Kuliah</h2>
				<p class="text-sm text-muted">Seluruh enrollment mahasiswa, termasuk mata kuliah yang belum final atau tidak dihitung ke IPK.</p>
			</div>
			<div class="space-y-3 xl:hidden">
				{#if transcript.courses.length === 0}
					<div class="rounded-lg border border-base-300/70 bg-base-200/40 px-4 py-5 text-sm text-muted">
						Belum ada data mata kuliah untuk mahasiswa ini.
					</div>
				{:else}
					{#each transcript.courses as course}
						<div class="rounded-lg border border-base-300/70 bg-base-100 p-4 space-y-3">
							<div>
								<p class="text-xs font-medium uppercase tracking-[0.16em] text-subtle">{course.tahunAjaran} - {formatAcademicLabel(course.semester)}</p>
								<h3 class="text-base font-semibold">{course.kode} - {course.nama}</h3>
								<p class="text-sm text-muted">{course.dosen}</p>
							</div>
							<dl class="grid grid-cols-2 gap-3 text-sm">
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">SKS</dt><dd class="mt-1 font-medium">{course.sks}</dd></div>
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">Total</dt><dd class="mt-1 font-medium">{formatScore(course.nilaiTotal)}</dd></div>
							<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">Huruf</dt><dd class="mt-1"><span class={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getGradeStatusChip(course.hurufMutu)}`}>{course.hurufMutu ?? '-'}</span></dd></div>
								<div><dt class="text-xs uppercase tracking-[0.14em] text-subtle">Bobot</dt><dd class="mt-1 font-medium">{course.gradePoint === null ? '-' : formatDecimal(course.gradePoint)}</dd></div>
							</dl>
							<div class="flex flex-wrap items-center gap-2">
							<span class={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getEnrollmentStatusChip(course.status)}`}>{formatAcademicLabel(course.status)}</span>
								{#if !course.countsTowardsGpa}
									<span class="text-xs text-muted">Belum terhitung ke IPK</span>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		<div class="hidden overflow-x-auto xl:block">
			<table class="table-refined w-full min-w-[56rem]" aria-label="Riwayat mata kuliah">
				<thead>
					<tr>
					<th scope="col">Tahun Ajaran</th>
					<th scope="col">Semester</th>
					<th scope="col">Kode</th>
					<th scope="col">Mata Kuliah</th>
						<th scope="col">Dosen</th>
						<th scope="col" class="text-right">SKS</th>
						<th scope="col" class="text-right">Total</th>
						<th scope="col">Huruf</th>
						<th scope="col" class="text-right">Bobot</th>
						<th scope="col">Status</th>
					</tr>
					</thead>
					<tbody>
						{#if transcript.courses.length === 0}
							<tr>
								<td colspan="10" class="py-10 text-center text-muted">Belum ada data mata kuliah untuk mahasiswa ini.</td>
							</tr>
						{:else}
							{#each transcript.courses as course}
								<tr>
									<td>{course.tahunAjaran}</td>
									<td>{formatAcademicLabel(course.semester)}</td>
									<td>{course.kode}</td>
									<td>
										<div>
											<p class="font-medium">{course.nama}</p>
											{#if !course.countsTowardsGpa}
												<p class="text-xs text-muted">Belum terhitung ke IPK</p>
											{/if}
										</div>
									</td>
									<td>{course.dosen}</td>
									<td class="text-right">{course.sks}</td>
									<td class="text-right">{formatScore(course.nilaiTotal)}</td>
									<td>
									<span class={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getGradeStatusChip(course.hurufMutu)}`}>
											{course.hurufMutu ?? '-'}
										</span>
									</td>
									<td class="text-right">{course.gradePoint === null ? '-' : formatDecimal(course.gradePoint)}</td>
									<td>
									<span class={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getEnrollmentStatusChip(course.status)}`}>
											{formatAcademicLabel(course.status)}
										</span>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</section>
	{:else}
		<div class="card-elevated p-10 text-center text-muted">
			{#if students.length === 0}
				Belum ada mahasiswa yang dapat ditampilkan pada modul transkrip.
			{:else}
				Pilih mahasiswa untuk menampilkan transkrip akademik.
			{/if}
		</div>
	{/if}
</div>
