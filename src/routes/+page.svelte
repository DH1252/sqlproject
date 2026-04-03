<script lang="ts">
	import { formatAcademicLabel } from '$lib/utils/format-label';
	import { getEnrollmentStatusChip } from '$lib/utils/status-chip';

	let { data }: { data: import('./$types').PageData } = $props();

	const operationalActions = [
		{
			href: '/jadwal',
			title: 'Sinkronkan jadwal kuliah',
			description: 'Pastikan ruang, dosen, dan jam kuliah tetap selaras pada semester berjalan.'
		},
		{
			href: '/mahasiswa',
			title: 'Perbarui status mahasiswa',
			description: 'Rapikan data aktif, cuti, dan lulus sebelum perubahan semester makin padat.'
		},
		{
			href: '/nilai',
			title: 'Pantau input nilai',
			description: 'Tinjau kelas yang sudah siap diproses agar penilaian tidak tertunda.'
		}
	];

	const setupActions = [
		{
			href: '/program-studi',
			title: 'Periksa master data inti',
			description: 'Pastikan program studi, dosen, mahasiswa, dan mata kuliah siap dipakai.'
		},
		{
			href: '/jadwal',
			title: 'Siapkan jadwal kuliah',
			description: 'Lengkapi jadwal setelah semester aktif ditetapkan agar alur akademik tetap konsisten.'
		},
		{
			href: '/mahasiswa',
			title: 'Rapikan data mahasiswa',
			description: 'Perbarui status mahasiswa sebelum proses KRS dan enrollment dimulai.'
		}
	];

	const metrics = $derived([
		{ label: 'Mahasiswa', value: data.stats.totalMahasiswa },
		{ label: 'Dosen', value: data.stats.totalDosen },
		{ label: 'Mata kuliah', value: data.stats.totalMataKuliah },
		{ label: 'Ruang kelas', value: data.stats.totalRuangKelas }
	]);

	let semesterLabel = $derived(
		data.activeSemester
			? `${data.activeSemester.tahunAjaran} - ${formatAcademicLabel(data.activeSemester.semester)}`
			: 'Belum ada semester aktif'
	);

	const primaryAction = $derived(
		data.activeSemester
			? {
				eyebrow: 'Prioritas utama',
				title: `Verifikasi enrollment untuk ${semesterLabel}`,
				description:
					'Pastikan mahasiswa masuk ke kelas yang tepat sebelum kapasitas penuh dan keputusan jadwal mengunci proses semester berjalan.',
				href: '/enrollment',
				label: 'Buka verifikasi enrollment'
			}
			: {
				eyebrow: 'Langkah penyiapan',
				title: 'Tetapkan semester aktif sebelum modul lain dipakai',
				description:
					'Semester aktif menjadi acuan untuk KRS, jadwal kuliah, enrollment, dan penilaian. Selesaikan langkah ini lebih dahulu agar seluruh proses berikutnya tetap konsisten.',
				href: '/semester',
				label: 'Tetapkan semester aktif'
			}
	);

	const secondaryActions = $derived(data.activeSemester ? operationalActions : setupActions);

	const recentEmptyAction = $derived(
		data.activeSemester
			? { href: '/enrollment', label: 'Masuk ke modul enrollment' }
			: { href: '/semester', label: 'Kelola semester aktif' }
	);
</script>

<svelte:head>
	<title>Dashboard - Sistem Akademik</title>
</svelte:head>

<div class="space-y-10">
	<section class="space-y-6">
		<div class="max-w-3xl space-y-2">
			<h1 class="text-3xl font-display font-semibold text-balance lg:text-4xl">Dashboard Akademik</h1>
			<p class="text-muted text-pretty lg:text-lg">
				Mulai dari prioritas semester berjalan, lalu lanjutkan ke modul yang paling membutuhkan perhatian.
			</p>
		</div>

		<ul class="flex flex-wrap gap-2 text-sm">
			{#each metrics as metric}
				<li class="inline-flex items-center gap-2 rounded-full border border-base-300/70 bg-base-100 px-3 py-1.5">
					<span class="font-semibold text-base-content">{metric.value}</span>
					<span class="text-muted">{metric.label}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card-elevated p-6 lg:p-8">
		<div class="dashboard-hero-grid">
			<article class="space-y-6">
				<div class="space-y-2">
					<p class="text-sm font-medium text-muted">Semester aktif</p>
					<h2 class="text-2xl font-display font-semibold text-balance lg:text-3xl">{semesterLabel}</h2>
					<p class="max-w-2xl text-muted text-pretty">
						{primaryAction.description}
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-3">
					<a href={primaryAction.href} class="btn btn-primary px-5">
						{primaryAction.label}
					</a>
					<a href="/semester" class="touch-target inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-base-content">
						Kelola semester
						<span aria-hidden="true">-></span>
					</a>
				</div>
			</article>

			<aside class="space-y-4">
				<h3 class="text-lg font-display font-semibold text-balance">Tindak lanjut</h3>

				<div class="space-y-3">
					{#each secondaryActions as action, index}
						<a href={action.href} class="dashboard-priority-link">
							<span class="text-xs font-medium text-subtle">0{index + 1}</span>
							<div class="min-w-0 space-y-1">
								<p class="font-medium text-base-content text-pretty">{action.title}</p>
								<p class="text-sm text-muted text-pretty">{action.description}</p>
							</div>
							<span class="pt-0.5 text-subtle" aria-hidden="true">-></span>
						</a>
					{/each}
				</div>
			</aside>
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-1">
				<h2 class="text-2xl font-display font-semibold text-balance">Enrollment terbaru</h2>
				<p class="max-w-3xl text-muted text-pretty">
					Perubahan kelas terbaru yang perlu ditinjau.
				</p>
			</div>

			<a href="/enrollment" class="touch-target inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-base-content">
				Seluruh enrollment
				<span aria-hidden="true">-></span>
			</a>
		</div>

		<div class="card-elevated overflow-hidden">
			{#if data.recentEnrollments.length === 0}
				<div class="grid gap-3 px-6 py-8 text-left lg:px-8">
					<h3 class="text-lg font-display font-semibold text-balance">Belum ada aktivitas enrollment terbaru.</h3>
					<p class="max-w-2xl text-sm text-muted text-pretty">
						Tidak ada perubahan kelas baru yang perlu ditinjau saat ini. Lanjutkan ke modul utama untuk memastikan semester tetap berjalan rapi.
					</p>
					<div>
						<a href={recentEmptyAction.href} class="touch-target inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-base-content">
							{recentEmptyAction.label}
							<span aria-hidden="true">-></span>
						</a>
					</div>
				</div>
			{:else}
				<div class="divide-y divide-base-300/60">
					{#each data.recentEnrollments as enrollment}
						<a href="/enrollment" class="dashboard-activity-row">
							<div class="min-w-0 space-y-1">
							<p class="font-medium text-base-content text-pretty">{enrollment.mahasiswa?.nama}</p>
							<p class="text-sm text-muted text-pretty">{enrollment.mataKuliah?.nama}</p>
							</div>

							<div class="flex items-center gap-3">
							<span class={`${getEnrollmentStatusChip(enrollment.status)} px-2 py-1 rounded-md flex-shrink-0`}>{formatAcademicLabel(enrollment.status)}</span>
								<span class="text-subtle" aria-hidden="true">-></span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
