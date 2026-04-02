<script lang="ts">
	import type { Snippet } from 'svelte';

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
		emptyMessage?: string;
		onSort?: (field: string) => void;
		onPageChange?: (page: number) => void;
		actions?: Snippet<[any]>;
	}

	let {
		columns,
		data,
		pagination,
		loading = false,
		emptyMessage = 'Belum ada data untuk ditampilkan.',
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

	function getCellValue(row: any, field: string): string {
		const value = field.includes('.') 
			? field.split('.').reduce((obj, key) => obj?.[key], row)
			: row[field];
		
		if (value === null || value === undefined) return '—';
		return String(value);
	}

	function getBadgeClass(value: string): string {
		const lower = String(value).toLowerCase();
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

<div class="card-elevated overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table-refined w-full">
			<thead>
				<tr>
					{#each columns as column}
						<th class="{column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}">
							{#if column.sortable && onSort}
								<button class="flex items-center gap-1.5 hover:opacity-100 transition-opacity" onclick={() => handleSort(column.field)}>
									{column.header}
									{#if sortField === column.field}
										<span class="text-xs opacity-60">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							{:else}
								{column.header}
							{/if}
						</th>
					{/each}
					{#if actions}
						<th class="text-right w-24">Aksi</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={columns.length + (actions ? 1 : 0)} class="text-center py-12">
							<div class="flex items-center justify-center gap-3">
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-base-300 border-t-current text-base-content/70"></div>
								<span class="opacity-50">Memuat data...</span>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length + (actions ? 1 : 0)} class="text-center py-12 opacity-50">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each data as row}
						<tr>
							{#each columns as column}
								<td class="{column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}">
									{#if column.badge}
										<span class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium {getBadgeClass(getCellValue(row, column.field))}">
											{getCellValue(row, column.field)}
										</span>
									{:else}
										{getCellValue(row, column.field)}
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
		<div class="flex flex-col gap-3 px-4 py-3 border-t border-base-300/50 sm:flex-row sm:items-center sm:justify-between">
			<div class="text-xs text-muted">
				Menampilkan {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
			</div>
			<div class="flex flex-wrap items-center gap-1 sm:justify-end">
				<button 
					class="touch-target px-3 py-1.5 rounded-md text-sm hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
					disabled={pagination.page === 1}
					onclick={() => onPageChange?.(pagination.page - 1)}
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
							class="touch-target rounded-md text-sm {pageNum === pagination.page ? 'pagination-current' : 'hover:bg-base-200'} transition-colors"
							onclick={() => onPageChange?.(pageNum)}
						>
							{pageNum}
						</button>
					{/if}
				{/each}
				<button 
					class="touch-target px-3 py-1.5 rounded-md text-sm hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
					disabled={pagination.page === pagination.totalPages}
					onclick={() => onPageChange?.(pagination.page + 1)}
				>
					Berikutnya
				</button>
			</div>
		</div>
	{/if}
</div>
