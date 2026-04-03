import type { ApiListResponse } from '$lib/types';

type PagedFetcher<T> = (params: { page: number; limit: number }) => Promise<ApiListResponse<T>>;

export async function fetchAllPages<T>(fetchPage: PagedFetcher<T>, limit = 100) {
	let page = 1;
	let totalPages = 1;
	const items: T[] = [];

	while (page <= totalPages) {
		const response = await fetchPage({ page, limit });
		if (!response.success) {
			return response;
		}

		items.push(...response.data);
		totalPages = response.pagination.totalPages;
		page += 1;
	}

	return {
		success: true as const,
		data: items,
		pagination: {
			page: 1,
			limit: items.length,
			total: items.length,
			totalPages: 1
		}
	};
}
