<script lang="ts">
	import type { Snippet } from 'svelte';
	import { formatAcademicLabel } from '$lib/utils/format-label';

	interface ColumnDef {
		field: string;
		header: string;
		sortable?: boolean;
		badge?: boolean;
		align?: 'left' | 'center' | 'right';
		format?: (value: unknown) => string;
	}

	interface PaginationInfo {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	}

	interface Props {
		columns: ColumnDef[];
		data: any[];
		pagination: PaginationInfo;
		loading?: boolean;
		loadingMessage?: string;
		emptyMessage?: string;
		emptyState?: Snippet;
		desktopOnly?: boolean;
		desktopVisibilityClass?: string;
		ariaLabel?: string;
		tableClass?: string;
		onSort?: (field: string) => void;
		onPageChange?: (page: number) => void;
		actions?: Snippet<[any]>;
	}

	let {
		columns,
		data,
		pagination,
		loading = false,
		loadingMessage = 'Memuat data...',
		emptyMessage = 'Belum ada data untuk ditampilkan.',
		emptyState,
		desktopOnly = false,
		desktopVisibilityClass = 'hidden lg:block',
		ariaLabel,
		tableClass = '',
		onSort,
		onPageChange,
		actions
	}: Props = $props();

	let sortField = $state('');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	function handleSort(field: string) {
		if (!onSort) return;
		
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
		onSort(`${field}:${sortDirection}`);
	}

	const columnAccessors = $derived.by(() => {
		const accessors = new Map<string, (row: any) => unknown>();

		for (const column of columns) {
			if (column.field.includes('.')) {
				const path = column.field.split('.');
				accessors.set(column.field, (row: any) => path.reduce((obj, key) => obj?.[key], row));
				continue;
			}

			accessors.set(column.field, (row: any) => row?.[column.field]);
		}

		return accessors;
	});

	function getCellRawValue(row: any, field: string): unknown {
		return columnAccessors.get(field)?.(row);
	}

	function getCellValue(row: any, field: string): string {
		const value = getCellRawValue(row, field);

		if (value === null || value === undefined) return '—';
		return String(value);
	}

	function getBadgeLabel(value: unknown): string {
		return formatAcademicLabel(value);
	}

	function getBadgeClass(value: unknown): string {
		const lower = String(value).toLowerCase();
		if (lower === 'true') {
			return 'status-chip tone-emerald';
		}
		if (lower === 'false') {
			return 'status-chip tone-slate';
		}
		if (['active', 'approved', 'available', 'completed'].includes(lower)) {
			return 'status-chip tone-emerald';
		}
		if (['inactive', 'maintenance', 'draft', 'dropped'].includes(lower)) {
			return 'status-chip tone-gold';
		}
		if (['unavailable', 'rejected', 'graduated'].includes(lower)) {
			return 'status-chip tone-rose';
		}
		if (['submitted', 'pending'].includes(lower)) {
			return 'status-chip tone-sky';
		}
		return 'status-chip tone-neutral';
	}
</script>

<div class={`card-elevated overflow-hidden ${desktopOnly ? desktopVisibilityClass : ''}`.trim()}>
	<div class="overflow-x-auto">
		<table class={`table-refined w-full ${tableClass}`.trim()} aria-label={ariaLabel}>
			<thead>
				<tr>
					{#each columns as column}
						<th
							scope="col"
							class="{column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}"
							aria-sort={column.sortable ? (sortField === column.field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
						>
							{#if column.sortable && onSort}
								<button
									type="button"
									class="flex items-center gap-1.5 hover:opacity-100 transition-opacity"
									onclick={() => handleSort(column.field)}
									aria-label={`Urutkan berdasarkan ${column.header}`}
								>
									{column.header}
									{#if sortField === column.field}
										<span class="text-xs text-subtle">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							{:else}
								{column.header}
							{/if}
						</th>
					{/each}
					{#if actions}
						<th scope="col" class="text-right w-24">Aksi</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={columns.length + (actions ? 1 : 0)} class="text-center py-12">
							<div class="flex items-center justify-center gap-3" role="status" aria-live="polite" aria-atomic="true">
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-base-300 border-t-current text-base-content/70" aria-hidden="true"></div>
								<span class="text-subtle">{loadingMessage}</span>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length + (actions ? 1 : 0)} class="px-4 py-10 sm:px-6">
							{#if emptyState}
								{@render emptyState()}
							{:else}
								<div class="text-center py-2 text-subtle">
									{emptyMessage}
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					{#each data as row}
						<tr>
							{#each columns as column}
								<td class="{column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}">
									{#if column.badge}
										{@const rawValue = getCellRawValue(row, column.field)}
										<span class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium {getBadgeClass(rawValue)}">
											{getBadgeLabel(rawValue)}
										</span>
									{:else}
										<div class="min-w-0 break-words">
											{getCellValue(row, column.field)}
										</div>
									{/if}
								</td>
							{/each}
							{#if actions}
								<td class="text-right">
									{@render actions(row)}
								</td>
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if pagination.totalPages > 1}
		<div class="flex flex-col gap-3 border-t border-base-300/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="navigation" aria-label="Navigasi halaman tabel">
			<div class="text-xs text-muted" aria-live="polite" aria-atomic="true">
				Menampilkan {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
			</div>
			<div class="flex flex-wrap items-center gap-1 sm:justify-end">
				<button 
					type="button"
					class="touch-target px-3 py-1.5 rounded-md text-sm hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
					disabled={pagination.page === 1}
					onclick={() => onPageChange?.(pagination.page - 1)}
					aria-label="Buka halaman sebelumnya"
				>
					Sebelumnya
				</button>
				{#each Array(Math.min(5, pagination.totalPages)) as _, i}
					{@const pageNum = pagination.page <= 3 
						? i + 1 
						: pagination.page >= pagination.totalPages - 2 
							? pagination.totalPages - 4 + i 
							: pagination.page - 2 + i}
					{#if pageNum <= pagination.totalPages && pageNum > 0}
						<button 
							type="button"
							class="touch-target rounded-md text-sm {pageNum === pagination.page ? 'pagination-current' : 'hover:bg-base-200'} transition-colors"
							onclick={() => onPageChange?.(pageNum)}
							aria-label={`Buka halaman ${pageNum}`}
							aria-current={pageNum === pagination.page ? 'page' : undefined}
						>
							{pageNum}
						</button>
					{/if}
				{/each}
				<button 
					type="button"
					class="touch-target px-3 py-1.5 rounded-md text-sm hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
					disabled={pagination.page === pagination.totalPages}
					onclick={() => onPageChange?.(pagination.page + 1)}
					aria-label="Buka halaman berikutnya"
				>
					Berikutnya
				</button>
			</div>
		</div>
	{/if}
</div>
