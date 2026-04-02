import type { ApiListResponse, ApiMessageResponse, ApiResponse } from '$lib/types';

const API_BASE = '';

export class ApiClientError extends Error {
	constructor(
		message: string,
		public readonly status: number
	) {
		super(message);
		this.name = 'ApiClientError';
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	const payload = await response.json().catch(() => null);

	if (!response.ok) {
		if (payload && typeof payload === 'object' && 'success' in payload) {
			return payload as T;
		}

		throw new ApiClientError(`HTTP error ${response.status}`, response.status);
	}

	if (payload === null) {
		throw new ApiClientError('Response was not valid JSON', response.status);
	}

	return payload as T;
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE}${endpoint}`;
	
	const defaultOptions: RequestInit = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	};

	const response = await fetch(url, { ...defaultOptions, ...options });
	return handleResponse<T>(response);
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
	return apiRequest<ApiResponse<T>>(endpoint, { method: 'GET' });
}

export async function apiGetList<T>(endpoint: string): Promise<ApiListResponse<T>> {
	return apiRequest<ApiListResponse<T>>(endpoint, { method: 'GET' });
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
	return apiRequest<ApiResponse<T>>(endpoint, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
	return apiRequest<ApiResponse<T>>(endpoint, {
		method: 'PUT',
		body: JSON.stringify(data)
	});
}

export async function apiDelete<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T> | ApiMessageResponse> {
	return apiRequest<ApiResponse<T> | ApiMessageResponse>(endpoint, {
		method: 'DELETE',
		...(data !== undefined && { body: JSON.stringify(data) })
	});
}

// Helper to build query string from params
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
	const query = Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
	return query ? `?${query}` : '';
}
