'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./load-core');

const core = loadCore();
// vm 안에서 만든 객체는 프로토타입이 달라 deepStrictEqual이 실패하므로 JSON으로 옮긴다.
const plain = (v) => JSON.parse(JSON.stringify(v));
const pick = (q) => [q.name, q.valid, q.average, q.blank, q.excluded];
const table = (text) => {
  const r = core.summarize(text);
  return r.questions.map(pick);
};

test('classifyCell: 1~5는 유효, 공백 제거 후 판정', () => {
  for (const v of ['1', '2', '3', '4', '5', ' 3 ', '\t4', '5 ', '　2']) {
    assert.equal(core.classifyCell(v).kind, 'valid', JSON.stringify(v));
  }
  assert.equal(core.classifyCell(' 4 ').score, 4);
});

test('classifyCell: 비었거나 공백만 있으면 빈 응답', () => {
  for (const v of ['', ' ', '   ', ' ', undefined]) {
    assert.equal(core.classifyCell(v).kind, 'blank', JSON.stringify(v));
  }
});

test('classifyCell: 그 밖의 값은 제외', () => {
  for (const v of ['0', '6', '3.0', '3.5', '03', '+3', '-1', '３', 'a', '3점', '1 2', 'NaN']) {
    assert.equal(core.classifyCell(v).kind, 'excluded', JSON.stringify(v));
  }
});

test('formatAverage: 소수 셋째 자리에서 반올림해 둘째 자리까지', () => {
  assert.equal(core.formatAverage(0, 0), '-');
  assert.equal(core.formatAverage(9, 3), '3.00');
  assert.equal(core.formatAverage(10, 3), '3.33'); // 3.333…
  assert.equal(core.formatAverage(11, 3), '3.67'); // 3.666…
  assert.equal(core.formatAverage(5, 2), '2.50');
  assert.equal(core.formatAverage(1, 1), '1.00');
  assert.equal(core.formatAverage(5, 1), '5.00');
  // 셋째 자리가 정확히 5인 경우는 올림: 107/40 = 2.675, 부동소수 toFixed로는 2.67이 나옴
  assert.equal(core.formatAverage(107, 40), '2.68');
  assert.equal(core.formatAverage(1, 8), '0.13'); // 0.125
  assert.equal(core.formatAverage(3, 8), '0.38'); // 0.375
  assert.equal(core.formatAverage(17, 8), '2.13'); // 2.125
  assert.equal(core.formatAverage(2, 3), '0.67');
});

test('parseTsv: 줄 끝 형식과 끝 줄바꿈', () => {
  const expect = [['a', 'b'], ['1', '2']];
  assert.deepEqual(plain(core.parseTsv('a\tb\n1\t2')), expect);
  assert.deepEqual(plain(core.parseTsv('a\tb\r\n1\t2\r\n')), expect);
  assert.deepEqual(plain(core.parseTsv('a\tb\r1\t2\r')), expect);
  assert.deepEqual(plain(core.parseTsv('﻿a\tb\n1\t2\n\n')), expect);
  assert.deepEqual(plain(core.parseTsv('')), []);
});

test('parseTsv: 엑셀식 큰따옴표 칸', () => {
  assert.deepEqual(plain(core.parseTsv('"문항\n하나"\t"따옴표""안"\n1\t2')), [['문항\n하나', '따옴표"안'], ['1', '2']]);
  assert.deepEqual(plain(core.parseTsv('a\t"x\ty"\tb')), [['a', 'x\ty', 'b']]);
});

test('parseTsv: 닫히지 않은 따옴표는 글자 그대로', () => {
  assert.deepEqual(plain(core.parseTsv('번호\tQ1\n1\t"3\n2\t4')), [['번호', 'Q1'], ['1', '"3'], ['2', '4']]);
});

test('summarize: 기본 집계, 첫 열(응답번호)은 집계 안 함', () => {
  const text = [
    '응답번호\t만족도\t추천',
    '1\t5\t4',
    '2\t3\t',
    '3\t4\t모름',
    '4\t \t2',
  ].join('\r\n') + '\r\n';
  const r = core.summarize(text);
  assert.equal(r.error, null);
  assert.equal(r.respondents, 4);
  assert.deepEqual(plain(r.questions.map(pick)), [
    ['만족도', 3, '4.00', 1, 0],
    ['추천', 2, '3.00', 1, 1],
  ]);
});

test('summarize: 응답번호 열 값이 1~5여도 집계하지 않음', () => {
  assert.deepEqual(plain(table('번호\tQ\n1\t\n2\t\n')), [['Q', 0, '-', 2, 0]]);
});

test('summarize: 칸이 모자란 줄은 모자란 칸을 빈 응답으로', () => {
  const text = '번호\tQ1\tQ2\tQ3\n1\t5\n2\n3\t1\t2\t3';
  assert.deepEqual(plain(table(text)), [
    ['Q1', 2, '3.00', 1, 0],
    ['Q2', 1, '2.00', 2, 0],
    ['Q3', 1, '3.00', 2, 0],
  ]);
});

test('summarize: 머리글보다 많은 칸은 무시', () => {
  assert.deepEqual(plain(table('번호\tQ1\n1\t2\t9\tx')), [['Q1', 1, '2.00', 0, 0]]);
});

test('summarize: 유효가 0이면 평균은 "-"', () => {
  assert.deepEqual(plain(table('번호\tQ1\n1\tx\n2\t')), [['Q1', 0, '-', 1, 1]]);
});

test('summarize: 머리글만 있으면 모두 0', () => {
  const r = core.summarize('번호\tQ1\tQ2\n');
  assert.equal(r.respondents, 0);
  assert.deepEqual(plain(r.questions.map(pick)), [['Q1', 0, '-', 0, 0], ['Q2', 0, '-', 0, 0]]);
});

test('summarize: 머리글 이름 공백 정리, 빈 이름은 열 번호로', () => {
  assert.deepEqual(plain(table('번호\t  Q1 \t\n1\t1\t2').map((q) => q[0])), ['Q1', '(3열)']);
});

test('summarize: 빈 입력과 문항 없는 입력', () => {
  assert.equal(core.summarize('').error, 'empty');
  assert.equal(core.summarize('\n\n').error, 'empty');
  assert.equal(core.summarize('번호\n1\n2').error, 'noQuestions');
});

test('summarize: 평균 반올림이 정수 계산으로 정확함', () => {
  // 40명: 2점 27명 + 4점 13명 → 2.65, 한 명을 3점으로 바꾸면 2.675
  const rows = ['번호\tQ'];
  const scores = [];
  for (let i = 0; i < 27; i++) scores.push(2);
  for (let i = 0; i < 13; i++) scores.push(4);
  scores.forEach((s, i) => rows.push(`${i + 1}\t${s}`));
  // 합 = 54 + 52 = 106 → 106/40 = 2.65
  assert.equal(core.summarize(rows.join('\n')).questions[0].average, '2.65');
  rows[1] = '1\t3'; // 합 107 → 2.675 → 2.68
  assert.equal(core.summarize(rows.join('\n')).questions[0].average, '2.68');
});
