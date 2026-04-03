<script lang="ts">
	import type { Snippet } from 'svelte';

	interface PaginationInfo {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	}

	interface Props {
		items: any[];
		pagination: PaginationInfo;
		itemLabelPlural: string;
		loading?: boolean;
		loadingMessage?: string;
		emptyMessage?: string;
		emptyState?: Snippet;
		visibilityClass?: string;
		onPageChange?: (page: number) => void;
		item: Snippet<[any]>;
	}

	let {
		items,
		pagination,
		itemLabelPlural,
		loading = false,
		loadingMessage = 'Memuat data...',
		emptyMessage = 'Belum ada data untuk ditampilkan.',
		emptyState,
		visibilityClass = 'lg:hidden',
		onPageChange,
		item
	}: Props = $props();

	const visibleRangeStart = $derived(pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1);
	const visibleRangeEnd = $derived(
		pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total)
	);

</script>

<div class={`space-y-4 ${visibilityClass}`.trim()}>
	{#if loading}
		<div class="card-elevated px-4 py-10 sm:px-6">
			<div class="flex items-center justify-center gap-3" role="status" aria-live="polite" aria-atomic="true">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-base-300 border-t-current text-base-content/70" aria-hidden="true"></div>
				<span class="text-sm text-muted">{loadingMessage}</span>
			</div>
		</div>
	{:else if items.length === 0}
		<div class="card-elevated px-4 py-8 sm:px-6">
			{#if emptyState}
				{@render emptyState()}
			{:else}
				<div class="py-2 text-center text-sm text-muted">{emptyMessage}</div>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-1 px-1 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-3" aria-live="polite" aria-atomic="true">
			<p class="min-w-0">Menampilkan {visibleRangeStart}-{visibleRangeEnd} dari {pagination.total} {itemLabelPlural}</p>
			<p class="sm:text-right">Halaman {pagination.page} dari {pagination.totalPages}</p>
		</div>

		<div class="space-y-3">
			{#each items as row}
				{@render item(row)}
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="card-elevated space-y-3 p-4 sm:p-5">
				<p class="text-sm text-muted">Pilih halaman untuk melihat {itemLabelPlural} lainnya.</p>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						class="btn btn-outline btn-sm"
						disabled={pagination.page === 1}
						onclick={() => onPageChange?.(pagination.page - 1)}
					>
						Halaman sebelumnya
					</button>
					<button
						type="button"
						class="btn btn-outline btn-sm"
						disabled={pagination.page === pagination.totalPages}
						onclick={() => onPageChange?.(pagination.page + 1)}
					>
						Halaman berikutnya
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
