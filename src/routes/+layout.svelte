<script lang="ts">
	import './layout.css';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type ThemeMode = 'light' | 'dark';
	type RouteMeta = {
		section: string;
		title: string;
	};

	let { children } = $props();

	const routeMetaEntries: Array<{ prefix: string; meta: RouteMeta }> = [
		{ prefix: '/ruang-kelas/timetable', meta: { section: 'Akademik', title: 'Timetable Ruang' } },
		{ prefix: '/program-studi', meta: { section: 'Master Data', title: 'Program Studi' } },
		{ prefix: '/mahasiswa', meta: { section: 'Master Data', title: 'Mahasiswa' } },
		{ prefix: '/dosen', meta: { section: 'Master Data', title: 'Dosen' } },
		{ prefix: '/mata-kuliah', meta: { section: 'Master Data', title: 'Mata Kuliah' } },
		{ prefix: '/ruang-kelas', meta: { section: 'Master Data', title: 'Ruang Kelas' } },
		{ prefix: '/semester', meta: { section: 'Akademik', title: 'Semester' } },
		{ prefix: '/jadwal', meta: { section: 'Akademik', title: 'Jadwal Kuliah' } },
		{ prefix: '/enrollment', meta: { section: 'Akademik', title: 'Enrollment' } },
		{ prefix: '/nilai', meta: { section: 'Nilai & KRS', title: 'Nilai' } },
		{ prefix: '/krs', meta: { section: 'Nilai & KRS', title: 'KRS' } },
		{ prefix: '/transkrip', meta: { section: 'Nilai & KRS', title: 'Transkrip Akademik' } },
		{ prefix: '/', meta: { section: 'Ringkasan Operasional', title: 'Dashboard Akademik' } }
	];

	function titleCaseSegment(value: string) {
		return value
			.split('-')
			.filter(Boolean)
			.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
			.join(' ');
	}

	function resolveRouteMeta(pathname: string): RouteMeta {
		const match = routeMetaEntries.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`));

		if (match) {
			return match.meta;
		}

		const fallbackTitle = pathname.split('/').filter(Boolean).at(-1);

		return {
			section: 'Sistem Akademik',
			title: fallbackTitle ? titleCaseSegment(fallbackTitle) : 'Sistem Akademik'
		};
	}

	const currentRouteMeta = $derived(resolveRouteMeta(page.url.pathname));
	let title = $derived(page.data?.title || currentRouteMeta.title);
	let section = $derived(currentRouteMeta.section);

	let theme = $state<ThemeMode>('light');

	function getStoredTheme(): ThemeMode | null {
		if (!browser) return null;

		try {
			const stored = localStorage.getItem('theme');
			return stored === 'dark' || stored === 'light' ? stored : null;
		} catch {
			return null;
		}
	}

	function resolveTheme(): ThemeMode {
		const storedTheme = getStoredTheme();
		if (storedTheme) return storedTheme;

		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	function applyTheme(nextTheme: ThemeMode, persist = true) {
		theme = nextTheme;

		if (!browser) return;

		document.documentElement.setAttribute('data-theme', nextTheme);
		document.documentElement.style.colorScheme = nextTheme;

		if (!persist) return;

		try {
			localStorage.setItem('theme', nextTheme);
		} catch {
			return;
		}
	}

	onMount(() => {
		const initialTheme = (document.documentElement.getAttribute('data-theme') as ThemeMode | null) ?? resolveTheme();
		applyTheme(initialTheme, false);
	});

	function toggleTheme() {
		applyTheme(theme === 'light' ? 'dark' : 'light');
	}
</script>

<svelte:head>
	<script>
		(() => {
			try {
				const stored = localStorage.getItem('theme');
				const theme = stored === 'dark' || stored === 'light'
					? stored
					: window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light';

				document.documentElement.setAttribute('data-theme', theme);
				document.documentElement.style.colorScheme = theme;
			} catch {
				const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				document.documentElement.setAttribute('data-theme', fallbackTheme);
				document.documentElement.style.colorScheme = fallbackTheme;
			}
		})();
	</script>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<AppShell {title} {section} {theme} {toggleTheme}>
	{@render children()}
</AppShell>
