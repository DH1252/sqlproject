<script lang="ts">
	import { onMount } from 'svelte';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { dosenService } from '$lib/api/services/dosen';
	import { mataKuliahService } from '$lib/api/services/mataKuliah';
	import { ruangKelasService } from '$lib/api/services/ruangKelas';
	import { semesterService } from '$lib/api/services/semester';
	import { enrollmentService } from '$lib/api/services/enrollment';
	import type { Enrollment, Semester } from '$lib/types';

	let stats = $state({
		totalMahasiswa: 0,
		totalDosen: 0,
		totalMataKuliah: 0,
		totalRuangKelas: 0
	});
	let activeSemester = $state<Semester | null>(null);
	let recentEnrollments = $state<Enrollment[]>([]);
	let loading = $state(true);

	const focusLinks = [
		{
			href: '/enrollment',
			title: 'Verifikasi enrollment',
			description: 'Tinjau kelas yang baru dipilih mahasiswa sebelum kapasitas penuh.'
		},
		{
			href: '/jadwal',
			title: 'Periksa jadwal kuliah',
			description: 'Pastikan ruang, dosen, dan jam kuliah tetap sinkron untuk semester berjalan.'
		},
		{
			href: '/mahasiswa',
			title: 'Kelola data mahasiswa',
			description: 'Perbarui status mahasiswa aktif, cuti, atau lulus dari satu halaman kerja.'
		},
		{
			href: '/nilai',
			title: 'Lanjutkan input nilai',
			description: 'Masuk ke modul penilaian untuk meninjau hasil belajar terbaru.'
		}
	];

	const metrics = $derived([
		{ label: 'Mahasiswa', value: stats.totalMahasiswa },
		{ label: 'Dosen', value: stats.totalDosen },
		{ label: 'Mata kuliah', value: stats.totalMataKuliah },
		{ label: 'Ruang kelas', value: stats.totalRuangKelas }
	]);

	let semesterLabel = $derived(
		activeSemester ? `${activeSemester.tahunAjaran} - ${activeSemester.semester}` : 'Belum ada semester aktif'
	);

	onMount(async () => {
		const [mRes, dRes, mkRes, rkRes, sRes, eRes] = await Promise.allSettled([
				mahasiswaService.getAll({ limit: 1 }),
				dosenService.getAll({ limit: 1 }),
				mataKuliahService.getAll({ limit: 1 }),
				ruangKelasService.getAll({ limit: 1 }),
				semesterService.getActive(),
				enrollmentService.getAll({ limit: 5 })
			]);

		if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.pagination) {
			stats.totalMahasiswa = mRes.value.pagination.total;
		}

		if (dRes.status === 'fulfilled' && dRes.value.success && dRes.value.pagination) {
			stats.totalDosen = dRes.value.pagination.total;
		}

		if (mkRes.status === 'fulfilled' && mkRes.value.success && mkRes.value.pagination) {
			stats.totalMataKuliah = mkRes.value.pagination.total;
		}

		if (rkRes.status === 'fulfilled' && rkRes.value.success && rkRes.value.pagination) {
			stats.totalRuangKelas = rkRes.value.pagination.total;
		}

		if (sRes.status === 'fulfilled' && sRes.value.success) {
			activeSemester = sRes.value.data;
		}

		if (eRes.status === 'fulfilled' && eRes.value.success) {
			recentEnrollments = eRes.value.data;
		}

		loading = false;
	});
</script>

<svelte:head>
	<title>Dashboard - Sistem Akademik</title>
</svelte:head>

<div class="space-y-8">
	<section class="space-y-2">
		<p class="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Ringkasan Operasional</p>
		<h1 class="text-3xl font-display font-semibold text-balance">Dashboard Akademik</h1>
		<p class="max-w-3xl text-muted text-pretty">
			Pantau semester aktif, kapasitas data inti, dan aktivitas akademik terbaru tanpa berpindah halaman.
		</p>
	</section>

	<section class="card-elevated p-6 lg:p-8">
		<div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)] lg:items-start">
			<div class="space-y-4">
				<p class="text-sm font-medium uppercase tracking-[0.14em] text-subtle">Semester aktif</p>
				<div class="space-y-2">
					<h2 class="text-2xl font-display font-semibold text-balance">{semesterLabel}</h2>
					{#if activeSemester}
						<p class="text-muted text-pretty">
							Gunakan semester ini sebagai acuan untuk enrollment, jadwal kuliah, dan pengolahan nilai.
						</p>
					{:else}
						<p class="text-muted text-pretty">
							Tetapkan satu semester aktif agar proses KRS, enrollment, dan penilaian berjalan pada periode yang benar.
						</p>
					{/if}
				</div>
				<div class="pt-2">
					<a href="/semester" class="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-base-content">
						Kelola semester
						<span aria-hidden="true">-></span>
					</a>
				</div>
			</div>

			<dl class="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-base-300/60 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
				{#each metrics as metric}
					<div class="space-y-1 min-w-0">
						<dt class="text-sm text-muted">{metric.label}</dt>
						<dd class="font-display text-3xl leading-none tracking-tight">
							{loading ? '—' : metric.value}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
		<div class="card-elevated p-6">
			<h2 class="font-display text-lg font-semibold mb-5">Enrollment Terbaru</h2>
			{#if loading}
				<div class="flex justify-center py-8">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-base-300 border-t-current text-base-content/70"></div>
				</div>
			{:else if recentEnrollments.length === 0}
				<p class="text-muted text-center py-8">Belum ada enrollment terbaru.</p>
			{:else}
				<div class="space-y-3">
					{#each recentEnrollments as enrollment}
						<div class="flex items-center justify-between p-4 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
							<div class="min-w-0">
								<p class="font-medium truncate">{enrollment.mahasiswa?.nama}</p>
								<p class="text-sm text-muted truncate">{enrollment.mataKuliah?.nama}</p>
							</div>
							<span class="status-chip tone-slate px-2 py-1 rounded-md flex-shrink-0 ml-4">{enrollment.status}</span>
						</div>
					{/each}
				</div>
			{/if}
			<div class="mt-5 pt-4 border-t border-base-300/50">
				<a href="/enrollment" class="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-base-content">
					Lihat semua enrollment
					<span aria-hidden="true">-></span>
				</a>
			</div>
		</div>

		<div class="card-elevated p-6">
			<div class="space-y-2">
				<h2 class="font-display text-lg font-semibold">Fokus Hari Ini</h2>
				<p class="text-sm text-muted text-pretty">
					Empat pintu kerja utama untuk menjaga operasi akademik tetap rapi dan tepat waktu.
				</p>
			</div>
			<div class="mt-5 space-y-2">
				{#each focusLinks as link}
					<a href={link.href} class="block rounded-lg border border-base-300/60 px-4 py-4 transition-colors hover:bg-base-200/60">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 space-y-1">
								<p class="font-medium text-base-content">{link.title}</p>
								<p class="text-sm text-muted text-pretty">{link.description}</p>
							</div>
							<span class="pt-0.5 text-subtle" aria-hidden="true">-></span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>
