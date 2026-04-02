<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import MahasiswaForm from '$lib/components/forms/MahasiswaForm.svelte';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { programStudiService } from '$lib/api/services/programStudi';
	import type { Mahasiswa, MahasiswaFormData, ProgramStudi, StatusMahasiswa } from '$lib/types';

	let data = $state<Mahasiswa[]>([]);
	let programs = $state<ProgramStudi[]>([]);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let filterProgram = $state<number | ''>('');
	let filterStatus = $state<StatusMahasiswa | ''>('');

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<Mahasiswa | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await mahasiswaService.getAll({
				page: pagination.page,
				limit: pagination.limit,
				programStudiId: filterProgram || undefined,
				status: filterStatus || undefined
			});
			if (response.success) {
				data = response.data;
				pagination = response.pagination;
			} else {
				error = response.error || 'Data belum berhasil dimuat.';
			}
		} catch (err) {
			error = 'Koneksi bermasalah. Coba lagi dalam beberapa saat.';
		} finally {
			loading = false;
		}
	}

	async function loadPrograms() {
		try {
			const response = await programStudiService.getAll({ limit: 100 });
			if (response.success) {
				programs = response.data;
			}
		} catch (err) {
			console.error('Failed to load programs');
		}
	}

	function handlePageChange(page: number) {
		pagination.page = page;
		loadData();
	}

	function handleSearch(query: string) {
		searchQuery = query;
		pagination.page = 1;
		loadData();
	}

	function openCreate() {
		editingData = undefined;
		isModalOpen = true;
	}

	function openEdit(item: Mahasiswa) {
		editingData = item;
		isModalOpen = true;
	}

	async function handleSubmit(formData: MahasiswaFormData) {
		formLoading = true;
		try {
			if (editingData) {
				const response = await mahasiswaService.update(editingData.id, formData);
				if (response.success) {
					isModalOpen = false;
					loadData();
				} else {
					alert(response.error || 'Perubahan belum berhasil disimpan.');
				}
			} else {
				const response = await mahasiswaService.create(formData);
				if (response.success) {
					isModalOpen = false;
					loadData();
				} else {
					alert(response.error || 'Data baru belum berhasil disimpan.');
				}
			}
		} catch (err) {
			alert('Koneksi bermasalah. Coba lagi dalam beberapa saat.');
		} finally {
			formLoading = false;
		}
	}

	async function handleDelete(item: Mahasiswa) {
		if (!confirm(`Hapus ${item.nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
		
		deleteLoading = item.id;
		try {
			const response = await mahasiswaService.delete(item.id);
			if (response.success) {
				loadData();
			} else {
				alert(response.error || 'Data belum berhasil dihapus.');
			}
		} catch (err) {
			alert('Koneksi bermasalah. Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	onMount(() => {
		loadData();
		loadPrograms();
	});

	const columns = [
		{ field: 'nim', header: 'NIM', sortable: true },
		{ field: 'nama', header: 'Nama', sortable: true },
		{ field: 'programStudi.nama', header: 'Program Studi', sortable: false },
		{ field: 'angkatan', header: 'Angkatan', sortable: true },
		{ field: 'status', header: 'Status', sortable: true, badge: true },
		{ field: 'ipk', header: 'IPK', sortable: true }
	];
</script>

<svelte:head>
	<title>Mahasiswa - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold">Mahasiswa</h1>
			<p class="text-muted">Kelola data mahasiswa universitas</p>
		</div>
		<button class="btn btn-primary" onclick={openCreate}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah Mahasiswa
		</button>
	</div>

	<div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
		<div class="w-full lg:max-w-md lg:flex-1">
			<SearchInput 
				label="Cari mahasiswa"
				ariaLabel="Cari mahasiswa berdasarkan nama atau NIM"
				value={searchQuery}
				placeholder="Nama mahasiswa atau NIM"
				onSearch={handleSearch}
			/>
		</div>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Program studi</span>
			<select class="select select-bordered w-full sm:min-w-56" bind:value={filterProgram} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter program studi mahasiswa">
				<option value="">Semua Program Studi</option>
				{#each programs as p}
					<option value={p.id}>{p.nama}</option>
				{/each}
			</select>
		</label>
		<label class="w-full space-y-2 sm:w-auto">
			<span class="block text-sm font-medium text-base-content">Status mahasiswa</span>
			<select class="select select-bordered w-full sm:min-w-48" bind:value={filterStatus} onchange={() => { pagination.page = 1; loadData(); }} aria-label="Filter status mahasiswa">
				<option value="">Semua Status</option>
				<option value="ACTIVE">Aktif</option>
				<option value="INACTIVE">Tidak Aktif</option>
				<option value="GRADUATED">Lulus</option>
			</select>
		</label>
	</div>

	{#if error}
		<div class="alert alert-error">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" onclick={loadData}>Coba Lagi</button>
		</div>
	{/if}

	<div class="bg-base-100 rounded-lg shadow">
		<DataTable
			{columns}
			{data}
			{pagination}
			{loading}
			onPageChange={handlePageChange}
		>
		{#snippet actions(row: Mahasiswa)}
				<button class="btn btn-sm btn-ghost" aria-label="Ubah data" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => handleDelete(row)} disabled={deleteLoading === row.id}>
					{#if deleteLoading === row.id}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					{/if}
				</button>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal 
	open={isModalOpen} 
	title={editingData ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
	onClose={() => isModalOpen = false}
	size="md"
>
	<MahasiswaForm
		data={editingData}
		onSubmit={handleSubmit}
		onCancel={() => isModalOpen = false}
		loading={formLoading}
	/>
</Modal>
