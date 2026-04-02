<script lang="ts">
	import { page } from '$app/state';

	interface NavItem {
		label: string;
		href: string;
		icon: string;
		children?: NavItem[];
	}

	interface Props {
		collapsed?: boolean;
		onNavigate?: () => void;
	}

	let { collapsed = false, onNavigate }: Props = $props();

	const navItems: NavItem[] = [
		{ label: 'Dashboard', href: '/', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>' },
		{
			label: 'Master Data',
			href: '#',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>',
			children: [
				{ label: 'Program Studi', href: '/program-studi', icon: '' },
				{ label: 'Mahasiswa', href: '/mahasiswa', icon: '' },
				{ label: 'Dosen', href: '/dosen', icon: '' },
				{ label: 'Mata Kuliah', href: '/mata-kuliah', icon: '' },
				{ label: 'Ruang Kelas', href: '/ruang-kelas', icon: '' }
			]
		},
		{
			label: 'Akademik',
			href: '#',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>',
			children: [
				{ label: 'Semester', href: '/semester', icon: '' },
				{ label: 'Jadwal', href: '/jadwal', icon: '' },
				{ label: 'Enrollment', href: '/enrollment', icon: '' }
			]
		},
		{
			label: 'Nilai & KRS',
			href: '#',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
			children: [
				{ label: 'Nilai', href: '/nilai', icon: '' },
				{ label: 'KRS', href: '/krs', icon: '' }
			]
		}
	];

	let expandedItems = $state<Set<string>>(new Set());

	function toggleExpand(label: string) {
		if (expandedItems.has(label)) {
			expandedItems.delete(label);
		} else {
			expandedItems.add(label);
		}
		expandedItems = new Set(expandedItems);
	}

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	function hasActiveChild(item: NavItem): boolean {
		return item.children?.some(child => isActive(child.href)) ?? false;
	}

	function groupId(label: string): string {
		return `nav-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
	}
</script>

<aside class="bg-base-200/50 min-h-screen w-64 flex flex-col border-r border-base-300/50">
	<div class="p-4 border-b border-base-300/50">
		<a href="/" class="flex items-center gap-3 group">
			<div class="brand-mark w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-lg transition-transform group-hover:scale-105">
				U
			</div>
			{#if !collapsed}
				<div>
					<div class="font-display font-semibold text-sm tracking-tight">UMD Akademik</div>
					<div class="text-xs opacity-50">Sistem Informasi</div>
				</div>
			{/if}
		</a>
	</div>

	<nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
		{#each navItems as item}
			{#if item.children}
				<div class="py-1">
					<button
						type="button"
						onclick={() => toggleExpand(item.label)}
						class="nav-item w-full {expandedItems.has(item.label) || hasActiveChild(item) ? 'opacity-90' : ''}"
						aria-expanded={expandedItems.has(item.label) || hasActiveChild(item)}
						aria-controls={groupId(item.label)}
					>
						<span class="opacity-70">{@html item.icon}</span>
						{#if !collapsed}
							<span class="flex-1 text-left text-sm">{item.label}</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50 transition-transform duration-200 {expandedItems.has(item.label) || hasActiveChild(item) ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
							</svg>
						{/if}
					</button>
					{#if (expandedItems.has(item.label) || hasActiveChild(item)) && !collapsed}
						<div id={groupId(item.label)} class="ml-3 pl-3 border-l border-base-300/70 space-y-0.5 mt-1">
							{#each item.children as child}
								<a
									href={child.href}
									class="nav-item text-sm {isActive(child.href) ? 'active' : ''}"
									onclick={onNavigate}
								>
									{child.label}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<a
					href={item.href}
					class="nav-item {isActive(item.href) ? 'active' : ''}"
					onclick={onNavigate}
				>
					<span class="opacity-70">{@html item.icon}</span>
					{#if !collapsed}
						<span class="text-sm">{item.label}</span>
					{/if}
				</a>
			{/if}
		{/each}
	</nav>

	{#if !collapsed}
		<div class="p-4 border-t border-base-300/50">
			<div class="sidebar-footer text-center">
				<div class="font-medium opacity-70">Universitas Merdeka Digital</div>
				<div class="opacity-50 mt-0.5">© 2024</div>
			</div>
		</div>
	{/if}
</aside>
