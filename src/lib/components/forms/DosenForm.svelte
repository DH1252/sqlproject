<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Dosen, DosenFormData, ProgramStudi } from '$lib/types';
	import { programStudiService } from '$lib/api/services/programStudi';
	import { onMount } from 'svelte';

	interface Props {
		data?: Dosen;
		onSubmit: (data: DosenFormData) => void;
		onCancel: () => void;
		loading?: boolean;
		errors?: Record<string, string>;
		formNotice?: {
			tone?: 'error' | 'warning' | 'info';
			title: string;
			description?: string;
		} | null;
	}

	let { data, onSubmit, onCancel, loading = false, errors = {}, formNotice = null }: Props = $props();

	let programs = $state<ProgramStudi[]>([]);
	let programsLoading = $state(false);
	let programsError = $state('');
	let programQuery = $state('');
	let selectedProgram = $state<ProgramStudi | null>(null);

	// svelte-ignore state_referenced_locally
	let formData = $state<DosenFormData>({
		nip: data?.nip || '',
		nama: data?.nama || '',
		email: data?.email || '',
		programStudiId: data?.programStudiId || 0,
		jabatan: data?.jabatan || 'Dosen'
	});

	async function loadPrograms(query = programQuery) {
		programsLoading = true;
		programsError = '';

		try {
			const response = await programStudiService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				const nextPrograms = response.data;
				programs = selectedProgram && !nextPrograms.some((program) => program.id === selectedProgram?.id)
					? [selectedProgram, ...nextPrograms]
					: nextPrograms;
				if (!data && programs.length > 0 && formData.programStudiId === 0) {
					formData.programStudiId = programs[0].id;
					selectedProgram = programs[0];
				}
				return;
			}

			programsError = response.error || 'Daftar program studi belum berhasil dimuat.';
			programs = [];
		} catch (error) {
			programsError = 'Daftar program studi belum berhasil dimuat. Coba muat ulang.';
			programs = [];
		} finally {
			programsLoading = false;
		}
	}

	async function ensureSelectedProgram() {
		if (!formData.programStudiId) return;

		const response = await programStudiService.getById(formData.programStudiId);
		if (response.success) {
			selectedProgram = response.data;
			programs = [response.data];
		}
	}

	function handleProgramSearch(query: string) {
		programQuery = query;
		void loadPrograms(query);
	}

	onMount(() => {
		if (data?.programStudiId) {
			void ensureSelectedProgram();
		}
	});

	$effect(() => {
		const currentProgram = programs.find((program) => program.id === Number(formData.programStudiId));
		if (currentProgram) {
			selectedProgram = currentProgram;
		}
	});

	const fields = $derived([
		{
			name: 'nip',
			label: 'NIP',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: 198001011999031001'
		},
		{
			name: 'nama',
			label: 'Nama Lengkap',
			type: 'text' as const,
			required: true,
			placeholder: 'Nama dosen'
		},
		{
			name: 'email',
			label: 'Email',
			type: 'email' as const,
			required: true,
			placeholder: 'email@umd.ac.id'
		},
		{
			name: 'programStudiId',
			label: 'Program Studi',
			type: 'async-select' as const,
			required: true,
			options: programs.map(p => ({ value: p.id, label: `${p.kode} - ${p.nama}` })),
			searchValue: programQuery,
			searchPlaceholder: 'Cari program studi berdasarkan nama atau kode',
			loadingOptions: programsLoading,
			onSearch: handleProgramSearch,
			emptyMessage: 'Tidak ada program studi yang sesuai dengan pencarian.'
		},
		{
			name: 'jabatan',
			label: 'Jabatan',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: Dosen, Kepala Program Studi'
		}
	]);

	function handleSubmit() {
		onSubmit(formData);
	}
</script>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<div class="space-y-4">
		{#if formNotice}
			<div class="alert {formNotice.tone === 'warning' ? 'alert-warning' : formNotice.tone === 'info' ? 'alert-info' : 'alert-error'}" role={formNotice.tone === 'error' ? 'alert' : 'status'}>
				<div class="space-y-1">
					<div class="font-medium">{formNotice.title}</div>
					{#if formNotice.description}
						<div class="text-sm">{formNotice.description}</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if programsError}
			<div class="alert alert-warning" role="status">
				<div class="space-y-1">
					<div class="font-medium">Daftar program studi perlu dimuat ulang.</div>
					<div class="text-sm">{programsError}</div>
				</div>
				<button type="button" class="btn btn-sm btn-ghost" onclick={() => void loadPrograms()} disabled={loading || programsLoading}>
					Muat ulang daftar
				</button>
			</div>
		{/if}

		<EntityForm {fields} bind:data={formData} {loading} {errors}>
		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button type="submit" class="btn btn-primary w-full sm:w-auto" disabled={loading || programsLoading || formData.programStudiId === 0}>
				{#if loading}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				{data ? 'Simpan perubahan' : 'Simpan data dosen'}
			</button>
		</div>
		</EntityForm>
	</div>
	</form>
