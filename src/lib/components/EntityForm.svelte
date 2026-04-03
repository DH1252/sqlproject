<script lang="ts">
	import type { Snippet } from 'svelte';
	import SearchInput from './SearchInput.svelte';

	type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'async-select' | 'checkbox';
	type FieldOption = { value: string | number; label: string };

	interface FieldDef {
		name: string;
		label: string;
		type: FieldType;
		required?: boolean;
		options?: FieldOption[];
		placeholder?: string;
		helperText?: string;
		searchValue?: string;
		searchPlaceholder?: string;
		loadingOptions?: boolean;
		emptyMessage?: string;
		onSearch?: (value: string) => void;
		min?: number;
		max?: number;
	}

	interface Props {
		fields: FieldDef[];
		data: Record<string, any>;
		errors?: Record<string, string>;
		loading?: boolean;
		children?: Snippet;
	}

	let { fields, data = $bindable(), errors = {}, loading = false, children }: Props = $props();

	function handleInput(name: string, value: any) {
		data[name] = value;
	}

	function errorId(name: string) {
		return `${name}-error`;
	}

	function helperId(name: string) {
		return `${name}-helper`;
	}

	function describedBy(name: string, helperText?: string) {
		return [helperText ? helperId(name) : undefined, errors[name] ? errorId(name) : undefined].filter(Boolean).join(' ') || undefined;
	}
</script>

<div class="space-y-4">
	{#each fields as field}
		<div class="form-control">
		<label class="label items-start justify-between gap-3" for={field.name}>
			<span class="label-text font-medium">
				{field.label}
				{#if field.required}
					<span class="text-error" aria-hidden="true">*</span>
				{/if}
			</span>
			{#if field.required}
				<span class="label-text-alt text-muted">Wajib diisi</span>
			{/if}
		</label>
			
			{#if field.type === 'textarea'}
				<textarea
					id={field.name}
					name={field.name}
					class="textarea textarea-bordered w-full {errors[field.name] ? 'textarea-error' : ''}"
					placeholder={field.placeholder}
					required={field.required}
					disabled={loading}
					bind:value={data[field.name]}
					aria-describedby={describedBy(field.name, field.helperText)}
					aria-invalid={errors[field.name] ? 'true' : undefined}
				></textarea>
			{:else if field.type === 'select' || field.type === 'async-select'}
				{#if field.type === 'async-select'}
					<div class="mb-3">
						<SearchInput
							value={field.searchValue ?? ''}
							ariaLabel={`Cari ${field.label}`}
							placeholder={field.searchPlaceholder ?? `Cari ${field.label.toLowerCase()}`}
							loading={field.loadingOptions}
							debounce={250}
							onSearch={(value) => field.onSearch?.(value)}
						/>
					</div>
				{/if}
				<select
					id={field.name}
					name={field.name}
					class="select select-bordered w-full {errors[field.name] ? 'select-error' : ''}"
					required={field.required}
					disabled={loading}
					bind:value={data[field.name]}
					aria-describedby={describedBy(field.name, field.helperText)}
					aria-invalid={errors[field.name] ? 'true' : undefined}
				>
					<option value="">{field.loadingOptions ? `Memuat ${field.label.toLowerCase()}...` : `Pilih ${field.label}`}</option>
					{#each field.options || [] as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				{#if field.type === 'async-select' && !field.loadingOptions && (field.options?.length ?? 0) === 0}
					<div class="label">
						<span class="label-text-alt text-muted">{field.emptyMessage ?? `Belum ada hasil untuk ${field.label.toLowerCase()}.`}</span>
					</div>
				{/if}
			{:else if field.type === 'checkbox'}
				<div class="label cursor-pointer justify-start gap-3">
					<input
						type="checkbox"
						id={field.name}
						name={field.name}
						class="checkbox checkbox-primary"
						disabled={loading}
						checked={data[field.name] || false}
						onchange={(e) => handleInput(field.name, e.currentTarget.checked)}
						aria-describedby={describedBy(field.name, field.helperText)}
						aria-invalid={errors[field.name] ? 'true' : undefined}
					/>
					<span class="label-text">{field.placeholder || 'Ya'}</span>
				</div>
			{:else}
				<input
					type={field.type}
					id={field.name}
					name={field.name}
					class="input input-bordered w-full {errors[field.name] ? 'input-error' : ''}"
					placeholder={field.placeholder}
					required={field.required}
					min={field.min}
					max={field.max}
					disabled={loading}
					bind:value={data[field.name]}
					aria-describedby={describedBy(field.name, field.helperText)}
					aria-invalid={errors[field.name] ? 'true' : undefined}
				/>
			{/if}

			{#if field.helperText}
				<div class="label">
					<span id={helperId(field.name)} class="label-text-alt text-muted">{field.helperText}</span>
				</div>
			{/if}
			
			{#if errors[field.name]}
				<div class="label">
					<span id={errorId(field.name)} class="label-text-alt text-error">{errors[field.name]}</span>
				</div>
			{/if}
		</div>
	{/each}
	
	{#if children}
		{@render children()}
	{/if}
</div>
