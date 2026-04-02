<script lang="ts">
	import type { Snippet } from 'svelte';

	type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox';

	interface FieldDef {
		name: string;
		label: string;
		type: FieldType;
		required?: boolean;
		options?: { value: string | number; label: string }[];
		placeholder?: string;
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
</script>

<div class="space-y-4">
	{#each fields as field}
		<div class="form-control">
			<label class="label items-start justify-between gap-3" for={field.name}>
				<span class="label-text font-medium">{field.label}</span>
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
					aria-describedby={errors[field.name] ? errorId(field.name) : undefined}
					aria-invalid={errors[field.name] ? 'true' : 'false'}
				></textarea>
			{:else if field.type === 'select'}
				<select
					id={field.name}
					name={field.name}
					class="select select-bordered w-full {errors[field.name] ? 'select-error' : ''}"
					required={field.required}
					disabled={loading}
					bind:value={data[field.name]}
					aria-describedby={errors[field.name] ? errorId(field.name) : undefined}
					aria-invalid={errors[field.name] ? 'true' : 'false'}
				>
					<option value="">Pilih {field.label}</option>
					{#each field.options || [] as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			{:else if field.type === 'checkbox'}
				<label class="label cursor-pointer justify-start gap-3">
					<input
						type="checkbox"
						id={field.name}
						name={field.name}
						class="checkbox checkbox-primary"
						disabled={loading}
						checked={data[field.name] || false}
						onchange={(e) => handleInput(field.name, e.currentTarget.checked)}
						aria-describedby={errors[field.name] ? errorId(field.name) : undefined}
						aria-invalid={errors[field.name] ? 'true' : 'false'}
					/>
					<span class="label-text">{field.placeholder || 'Ya'}</span>
				</label>
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
					aria-describedby={errors[field.name] ? errorId(field.name) : undefined}
					aria-invalid={errors[field.name] ? 'true' : 'false'}
				/>
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
