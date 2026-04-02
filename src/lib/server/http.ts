import { Prisma } from '@prisma/client';
import { json } from '@sveltejs/kit';
import type { PaginationInfo } from '$lib/types';

export class ApiHttpError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiHttpError';
	}
}

export function httpError(status: number, message: string): never {
	throw new ApiHttpError(status, message);
}

export function apiOk<T>(data: T, status = 200, message?: string) {
	return json(
		message ? { success: true, data, message } : { success: true, data },
		{ status }
	);
}

export function apiList<T>(data: T[], pagination: PaginationInfo) {
	return json({ success: true, data, pagination });
}

export function apiMessage(message: string, status = 200) {
	return json({ success: true, data: null, message }, { status });
}

export function apiError(status: number, message: string) {
	return json({ success: false, error: message }, { status });
}

export function parseIdParam(value: string | undefined, label = 'ID'): number {
	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		httpError(400, `Invalid ${label}`);
	}

	return parsed;
}

export function parseOptionalPositiveInt(value: string | null | undefined, label: string): number | undefined {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		httpError(400, `Invalid ${label}`);
	}

	return parsed;
}

export function parseOptionalBoolean(value: string | null | undefined, label: string): boolean | undefined {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	httpError(400, `Invalid ${label}`);
}

export function parseOptionalEnum<T extends string>(
	value: string | null | undefined,
	label: string,
	allowedValues: readonly T[]
): T | undefined {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	if (!allowedValues.includes(value as T)) {
		httpError(400, `Invalid ${label}`);
	}

	return value as T;
}

export function parsePagination(
	url: URL,
	options: { defaultLimit?: number; maxLimit?: number } = {}
) {
	const defaultLimit = options.defaultLimit ?? 10;
	const maxLimit = options.maxLimit ?? 100;

	const page = parseOptionalPositiveInt(url.searchParams.get('page'), 'page') ?? 1;
	const limit = parseOptionalPositiveInt(url.searchParams.get('limit'), 'limit') ?? defaultLimit;

	if (limit > maxLimit) {
		httpError(400, `limit must be less than or equal to ${maxLimit}`);
	}

	return {
		page,
		limit,
		skip: (page - 1) * limit
	};
}

export async function readRequestBody(request: Request): Promise<Record<string, unknown>> {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		httpError(400, 'Invalid JSON body');
	}

	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		httpError(400, 'Request body must be a JSON object');
	}

	return payload as Record<string, unknown>;
}

export function requireFields<T extends Record<string, unknown>>(
	data: T,
	message = 'At least one field is required'
) {
	if (Object.keys(data).length === 0) {
		httpError(400, message);
	}

	return data;
}

function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return error instanceof Prisma.PrismaClientKnownRequestError;
}

function statusForPrismaCode(code: string): number {
	switch (code) {
		case 'P2002':
			return 409;
		case 'P2003':
			return 409;
		case 'P2025':
			return 404;
		default:
			return 500;
	}
}

function defaultMessageForPrismaCode(code: string): string {
	switch (code) {
		case 'P2002':
			return 'A record with the same unique value already exists';
		case 'P2003':
			return 'The requested change would violate a related record constraint';
		case 'P2025':
			return 'Record not found';
		default:
			return 'Database request failed';
	}
}

export function handleApiError(
	error: unknown,
	logLabel: string,
	overrides: Partial<Record<string, string>> = {},
	fallbackMessage = 'Internal server error'
) {
	if (error instanceof ApiHttpError) {
		return apiError(error.status, error.message);
	}

	if (isPrismaKnownError(error)) {
		console.error(logLabel, error);
		return apiError(
			statusForPrismaCode(error.code),
			overrides[error.code] ?? defaultMessageForPrismaCode(error.code)
		);
	}

	console.error(logLabel, error);
	return apiError(500, fallbackMessage);
}
