<script lang="ts">
	interface Props {
		value: string;
		label?: string;
		ariaLabel?: string;
		placeholder?: string;
		loading?: boolean;
		debounce?: number;
		onSearch?: (value: string) => void;
	}

	let {
		value = $bindable(),
		label,
		ariaLabel,
		placeholder = 'Cari data',
		loading = false,
		debounce = 300,
		onSearch
	}: Props = $props();

	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl = $state<HTMLInputElement | null>(null);
	let inputId = $derived(`${(ariaLabel ?? label ?? placeholder).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'search'}-input`);

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onSearch?.(value);
		}, debounce);
	}

	function clearSearch() {
		value = '';
		onSearch?.('');
		inputEl?.focus();
	}
</script>

<div class="space-y-2">
	{#if label}
		<label class="block text-sm font-medium text-base-content" for={inputId}>{label}</label>
	{/if}
	<div class="relative block">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			class="input input-bordered w-full pl-10 pr-10"
			{placeholder}
			value={value}
			oninput={handleInput}
			aria-label={ariaLabel ?? label ?? placeholder}
		/>
		{#if loading}
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			</div>
		{:else if value}
			<button
				type="button"
				class="touch-target absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-subtle hover:text-base-content"
				onclick={clearSearch}
				aria-label="Hapus pencarian"
			>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
			</button>
		{/if}
	</div>
</div>
