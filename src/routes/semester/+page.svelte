<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SemesterForm from '$lib/components/forms/SemesterForm.svelte';
	import { semesterService } from '$lib/api/services/semester';
	import type { Semester, SemesterFormData, JenisSemester } from '$lib/types';

	let data = $state<Semester[]>([]);
	let loading = $state(false);
	let error = $state('');

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<Semester | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);
	let activateLoading = $state<number | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await semesterService.getAll({
				page: pagination.page,
				limit: pagination.limit
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

	function handlePageChange(page: number) {
		pagination.page = page;
		loadData();
	}

	function openCreate() {
		editingData = undefined;
		isModalOpen = true;
	}

	function openEdit(item: Semester) {
		editingData = item;
		isModalOpen = true;
	}

	async function handleActivate(id: number) {
		if (!confirm('Aktifkan semester ini? Semester lain akan dinonaktifkan.')) return;
		
		activateLoading = id;
		try {
			const response = await semesterService.activate(id);
			if (response.success) {
				loadData();
			} else {
				alert(response.error || 'Semester aktif belum berhasil diperbarui.');
			}
		} catch (err) {
			alert('Koneksi bermasalah. Coba lagi dalam beberapa saat.');
		} finally {
			activateLoading = null;
		}
	}

	async function handleSubmit(formData: SemesterFormData) {
		formLoading = true;
		try {
			if (editingData) {
				const response = await semesterService.update(editingData.id, formData);
				if (response.success) {
					isModalOpen = false;
					loadData();
				} else {
					alert(response.error || 'Perubahan belum berhasil disimpan.');
				}
			} else {
				const response = await semesterService.create(formData);
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

	async function handleDelete(item: Semester) {
		if (!confirm(`Hapus semester ${item.tahunAjaran} ${item.semester}? Tindakan ini tidak bisa dibatalkan.`)) return;
		
		deleteLoading = item.id;
		try {
			const response = await semesterService.delete(item.id);
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
	});

	const columns = [
		{ field: 'tahunAjaran', header: 'Tahun Ajaran', sortable: true },
		{ field: 'semester', header: 'Semester', sortable: true, badge: true },
		{ field: 'isActive', header: 'Status', sortable: true, badge: true }
	];
</script>

<svelte:head>
	<title>Semester - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold">Semester</h1>
			<p class="text-muted">Kelola data semester akademik</p>
		</div>
		<button class="btn btn-primary" onclick={openCreate}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah Semester
		</button>
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
			{#snippet actions(row: Semester)}
				{#if !row.isActive}
					<button 
						class="btn btn-sm btn-success" 
						onclick={() => handleActivate(row.id)}
						disabled={activateLoading === row.id}
					>
						{#if activateLoading === row.id}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Aktifkan
						{/if}
					</button>
				{:else}
					<span class="badge badge-success">Aktif</span>
				{/if}
				<button class="btn btn-sm btn-ghost" aria-label="Ubah data" onclick={() => openEdit(row)} disabled={deleteLoading === row.id}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => handleDelete(row)} disabled={deleteLoading === row.id || row.isActive}>
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
	title={editingData ? 'Edit Semester' : 'Tambah Semester'}
	onClose={() => isModalOpen = false}
	size="md"
>
	<SemesterForm
		data={editingData}
		onSubmit={handleSubmit}
		onCancel={() => isModalOpen = false}
		loading={formLoading}
	/>
</Modal>
