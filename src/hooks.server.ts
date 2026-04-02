import type { Handle } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { prisma } from '$lib/server/prisma';

declare global {
	namespace App {
		interface Locals {
			prisma: typeof prisma;
			auth: {
				username: string;
			} | null;
		}
	}
}

const authUsername = process.env.BASIC_AUTH_USERNAME?.trim();
const authPassword = process.env.BASIC_AUTH_PASSWORD;
const authConfigured = Boolean(authUsername && authPassword);
const authRequired = process.env.NODE_ENV === 'production' || authConfigured;

if (authRequired && !authConfigured) {
	throw new Error('BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be configured when authentication is required');
}

function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function unauthorizedResponse(isApiRequest: boolean) {
	const headers = {
		'WWW-Authenticate': 'Basic realm="Academic System", charset="UTF-8"',
		'Cache-Control': 'no-store'
	};

	if (isApiRequest) {
		return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
			status: 401,
			headers: {
				...headers,
				'content-type': 'application/json'
			}
		});
	}

	return new Response('Authentication required', {
		status: 401,
		headers
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.prisma = prisma;
	event.locals.auth = null;

	if (authRequired) {
		const authorization = event.request.headers.get('authorization');
		const isApiRequest = event.url.pathname.startsWith('/api');

		if (!authorization?.startsWith('Basic ')) {
			return unauthorizedResponse(isApiRequest);
		}

		let decoded: string;

		try {
			decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
		} catch {
			return unauthorizedResponse(isApiRequest);
		}

		const separatorIndex = decoded.indexOf(':');

		if (separatorIndex === -1) {
			return unauthorizedResponse(isApiRequest);
		}

		const providedUsername = decoded.slice(0, separatorIndex);
		const providedPassword = decoded.slice(separatorIndex + 1);

		if (!safeEqual(providedUsername, authUsername!) || !safeEqual(providedPassword, authPassword!)) {
			return unauthorizedResponse(isApiRequest);
		}

		event.locals.auth = {
			username: providedUsername
		};
	}

	return resolve(event);
};
