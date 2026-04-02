/**
 * Grade calculation utilities for the Academic Information System
 */

export interface GradeComponents {
	nilaiTugas: number | null;
	nilaiUTS: number | null;
	nilaiUAS: number | null;
}

export interface GradeResult {
	nilaiTotal: number;
	hurufMutu: LetterGrade;
}

export const LETTER_GRADES = ['A', 'B+', 'B', 'C+', 'C', 'D', 'E'] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

/**
 * Weight constants for grade calculation
 */
export const GRADE_WEIGHTS = {
	TUGAS: 0.3, // 30%
	UTS: 0.3, // 30%
	UAS: 0.4 // 40%
} as const;

/**
 * Grade thresholds for letter grade conversion
 */
export const GRADE_THRESHOLDS = [
	{ min: 85, grade: 'A' },
	{ min: 80, grade: 'B+' },
	{ min: 75, grade: 'B' },
	{ min: 70, grade: 'C+' },
	{ min: 65, grade: 'C' },
	{ min: 50, grade: 'D' },
	{ min: 0, grade: 'E' }
] as const satisfies ReadonlyArray<{ min: number; grade: LetterGrade }>;

/**
 * Grade points for GPA calculation
 */
export const GRADE_POINTS: Record<LetterGrade, number> = {
	A: 4.0,
	'B+': 3.5,
	B: 3.0,
	'C+': 2.5,
	C: 2.0,
	D: 1.0,
	E: 0.0
} as const;

function assertFiniteScore(score: number, label = 'Score') {
	if (!Number.isFinite(score)) {
		throw new Error(`${label} must be a finite number, got ${score}`);
	}

	if (score < 0 || score > 100) {
		throw new Error(`${label} must be between 0 and 100, got ${score}`);
	}
}

export function isLetterGrade(value: string): value is LetterGrade {
	return LETTER_GRADES.includes(value as LetterGrade);
}

/**
 * Calculate total score from grade components
 * Formula: nilaiTotal = nilaiTugas * 0.3 + nilaiUTS * 0.3 + nilaiUAS * 0.4
 */
export function calculateTotalScore(components: GradeComponents): number | null {
	const { nilaiTugas, nilaiUTS, nilaiUAS } = components;

	// Return null if any component is missing
	if (nilaiTugas === null || nilaiUTS === null || nilaiUAS === null) {
		return null;
	}

	// Validate score ranges (0-100)
	const scores = [nilaiTugas, nilaiUTS, nilaiUAS];
	for (const [index, score] of scores.entries()) {
		assertFiniteScore(score, ['nilaiTugas', 'nilaiUTS', 'nilaiUAS'][index]);
	}

	const total =
		nilaiTugas * GRADE_WEIGHTS.TUGAS +
		nilaiUTS * GRADE_WEIGHTS.UTS +
		nilaiUAS * GRADE_WEIGHTS.UAS;

	return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert numerical score to letter grade
 */
export function convertToLetterGrade(score: number): LetterGrade {
	assertFiniteScore(score);

	for (const threshold of GRADE_THRESHOLDS) {
		if (score >= threshold.min) {
			return threshold.grade;
		}
	}

	return 'E'; // Default to E if something goes wrong
}

/**
 * Calculate complete grade result from components
 */
export function calculateGrade(components: GradeComponents): GradeResult | null {
	const nilaiTotal = calculateTotalScore(components);

	if (nilaiTotal === null) {
		return null;
	}

	const hurufMutu = convertToLetterGrade(nilaiTotal);

	return {
		nilaiTotal,
		hurufMutu
	};
}

/**
 * Get grade point for a letter grade
 */
export function getGradePoint(hurufMutu: string): number {
	if (!isLetterGrade(hurufMutu)) {
		throw new Error(`Unknown letter grade: ${hurufMutu}`);
	}

	return GRADE_POINTS[hurufMutu];
}

/**
 * Calculate GPA (IPK) from a list of grades with credit units
 * @param grades - Array of { hurufMutu, sks }
 * @returns GPA value
 */
export function calculateGPA(
	grades: Array<{ hurufMutu: string; sks: number }>
): number {
	if (grades.length === 0) {
		return 0.0;
	}

	let totalPoints = 0;
	let totalSks = 0;

	for (const grade of grades) {
		if (!Number.isInteger(grade.sks) || grade.sks <= 0) {
			throw new Error(`SKS must be a positive integer, got ${grade.sks}`);
		}

		const point = getGradePoint(grade.hurufMutu);
		totalPoints += point * grade.sks;
		totalSks += grade.sks;
	}

	if (totalSks === 0) {
		return 0.0;
	}

	return Math.round((totalPoints / totalSks) * 100) / 100;
}

/**
 * Validate if a score is within valid range
 */
export function isValidScore(score: number | null | undefined): boolean {
	if (score === null || score === undefined) {
		return true; // Allow null/undefined for incomplete grades
	}
	return Number.isFinite(score) && score >= 0 && score <= 100;
}

/**
 * Format score for display
 */
export function formatScore(score: number | null | undefined): string {
	if (score === null || score === undefined || !Number.isFinite(score)) {
		return '-';
	}
	return score.toFixed(2);
}
