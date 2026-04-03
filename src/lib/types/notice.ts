export type NoticeTone = 'success' | 'error' | 'warning' | 'info';

export interface NoticeMessage {
	tone: NoticeTone;
	title: string;
	description?: string;
}
