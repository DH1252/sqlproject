import assert from 'node:assert/strict';
import test from 'node:test';
import {
	calculateGPA,
	calculateGrade,
	calculateTotalScore,
	convertToLetterGrade,
	getGradePoint
} from './grade-calculator';

test('calculateTotalScore returns a rounded weighted score', () => {
	const total = calculateTotalScore({
		nilaiTugas: 80,
		nilaiUTS: 90,
		nilaiUAS: 85
	});

	assert.equal(total, 85);
});

test('calculateGrade returns null when a component is missing', () => {
	const result = calculateGrade({
		nilaiTugas: 80,
		nilaiUTS: null,
		nilaiUAS: 90
	});

	assert.equal(result, null);
});

test('calculateTotalScore rejects non-finite scores', () => {
	assert.throws(
		() =>
			calculateTotalScore({
				nilaiTugas: Number.NaN,
				nilaiUTS: 80,
				nilaiUAS: 90
			}),
		/finite number/
	);
});

test('convertToLetterGrade maps thresholds correctly', () => {
	assert.equal(convertToLetterGrade(80), 'B+');
	assert.equal(convertToLetterGrade(49.99), 'E');
});

test('getGradePoint rejects unknown grades', () => {
	assert.throws(() => getGradePoint('Z'), /Unknown letter grade/);
});

test('calculateGPA rejects invalid SKS values', () => {
	assert.throws(
		() => calculateGPA([{ hurufMutu: 'A', sks: 0 }]),
		/positive integer/
	);
});
