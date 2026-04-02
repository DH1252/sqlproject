<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import KRSForm from '$lib/components/forms/KRSForm.svelte';
	import { krsService } from '$lib/api/services/krs';
	import { StatusKRS } from '$lib/types';
	import type { KRS, KRSFormData } from '$lib/types';

	let data = $state<KRS[]>([]);
	let loading = $state(false);
	let error = $state('');

	let pagination = $state({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0
	});

	let isModalOpen = $state(false);
	let editingData = $state<KRS | undefined>(undefined);
	let formLoading = $state(false);
	let deleteLoading = $state<number | null>(null);
	let actionLoading = $state<{ id: number; action: string } | null>(null);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const response = await krsService.getAll({
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

	function openEdit(item: KRS) {
		editingData = item;
		isModalOpen = true;
	}

	async function handleSubmit(formData: KRSFormData) {
		formLoading = true;
		try {
			if (editingData) {
				const response = await krsService.update(editingData.id, {
					status: StatusKRS.DRAFT
				});
				if (response.success) {
					isModalOpen = false;
					await loadData();
				} else {
					alert(response.error || 'Perubahan belum berhasil disimpan.');
				}
			} else {
				const response = await krsService.create(formData);
				if (response.success) {
					isModalOpen = false;
					await loadData();
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

	async function handleDelete(item: KRS) {
		if (!confirm(`Hapus data KRS ini? Tindakan ini tidak bisa dibatalkan.`)) return;
		
		deleteLoading = item.id;
		try {
			const response = await krsService.delete(item.id);
			if (response.success) {
				await loadData();
			} else {
				alert(response.error || 'Data belum berhasil dihapus.');
			}
		} catch (err) {
			alert('Koneksi bermasalah. Coba lagi dalam beberapa saat.');
		} finally {
			deleteLoading = null;
		}
	}

	async function handleAction(item: KRS, action: 'submit' | 'approve' | 'reject') {
		const messages = {
			submit: 'Ajukan KRS ini?',
			approve: 'Setujui KRS ini?',
			reject: 'Tolak KRS ini?'
		};
		
		if (!confirm(messages[action])) return;
		
		actionLoading = { id: item.id, action };
		try {
			const response =
				action === 'submit'
					? await krsService.submit(item.id)
					: action === 'approve'
						? await krsService.approve(item.id)
						: await krsService.reject(item.id);

			if (response.success) {
				await loadData();
			} else {
				alert(response.error || 'Permintaan belum berhasil diproses.');
			}
		} catch (err) {
			alert('Koneksi bermasalah. Coba lagi dalam beberapa saat.');
		} finally {
			actionLoading = null;
		}
	}

	onMount(() => {
		loadData();
	});

	const columns = [
		{ field: 'mahasiswa.nim', header: 'NIM', sortable: false },
		{ field: 'mahasiswa.nama', header: 'Mahasiswa', sortable: false },
		{ field: 'semester.tahunAjaran', header: 'Tahun Ajaran', sortable: false },
		{ field: 'semester.semester', header: 'Semester', sortable: false, badge: true },
		{ field: 'status', header: 'Status', sortable: true, badge: true },
		{ field: 'tanggalSubmit', header: 'Tanggal Submit', sortable: false }
	];
</script>

<svelte:head>
	<title>KRS - Sistem Akademik</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold">KRS</h1>
			<p class="text-muted">Kelola data Kartu Rencana Studi</p>
		</div>
		<button class="btn btn-primary" onclick={openCreate}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Buat KRS
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
			{#snippet actions(row: KRS)}
				{#if row.status === 'DRAFT'}
					<button 
						class="btn btn-sm btn-info" 
						onclick={() => handleAction(row, 'submit')}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'submit'}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Ajukan
						{/if}
					</button>
				{:else if row.status === 'SUBMITTED'}
					<button 
						class="btn btn-sm btn-success" 
						onclick={() => handleAction(row, 'approve')}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'approve'}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Setujui
						{/if}
					</button>
					<button 
						class="btn btn-sm btn-error" 
						onclick={() => handleAction(row, 'reject')}
						disabled={actionLoading?.id === row.id}
					>
						{#if actionLoading?.id === row.id && actionLoading.action === 'reject'}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Tolak
						{/if}
					</button>
				{:else if row.status === 'REJECTED'}
					<button
						class="btn btn-sm btn-warning"
						onclick={() => openEdit(row)}
						disabled={actionLoading?.id === row.id || deleteLoading === row.id}
					>
						Kembalikan
					</button>
				{/if}
				<button class="btn btn-sm btn-error btn-ghost" aria-label="Hapus data" onclick={() => handleDelete(row)} disabled={deleteLoading === row.id || actionLoading?.id === row.id}>
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
	title={editingData ? 'Kembalikan KRS ke Draft' : 'Buat KRS'}
	onClose={() => isModalOpen = false}
	size={editingData ? 'sm' : 'md'}
>
	<KRSForm
		data={editingData}
		onSubmit={handleSubmit}
		onCancel={() => isModalOpen = false}
		loading={formLoading}
	/>
</Modal>
