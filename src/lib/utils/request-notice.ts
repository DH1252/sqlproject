import { ApiClientError } from '$lib/api/client';
import type { NoticeMessage } from '$lib/types/notice';

export function describeRequestFailure(
	error: unknown,
	fallbackTitle: string,
	fallbackDescription: string
): NoticeMessage {
	if (error instanceof ApiClientError) {
		if (error.status === 401 || error.status === 403) {
			return {
				tone: 'error',
				title: 'Akses untuk permintaan ini tidak tersedia.',
				description: 'Masuk ulang atau gunakan akun dengan hak akses yang sesuai.'
			};
		}

		if (error.status >= 500) {
			return {
				tone: 'error',
				title: fallbackTitle,
				description: 'Server kampus sedang bermasalah. Coba lagi dalam beberapa saat.'
			};
		}
	}

	if (error instanceof TypeError) {
		return {
			tone: 'error',
			title: fallbackTitle,
			description: 'Koneksi terputus sebelum permintaan selesai. Periksa jaringan lalu coba lagi.'
		};
	}

	return {
		tone: 'error',
		title: fallbackTitle,
		description: fallbackDescription
	};
}
