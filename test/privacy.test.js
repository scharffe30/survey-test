'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readHtml } = require('./load-core');
const { expectedCsp, CSP_RE } = require('./csp');

const html = readHtml();

test('CSP가 외부 연결을 막고 인라인 코드 해시와 일치', () => {
  const m = html.match(CSP_RE);
  assert.ok(m, 'CSP 메타 태그가 있어야 함');
  assert.match(m[2], /default-src 'none'/);
  assert.doesNotMatch(m[2], /unsafe-inline|unsafe-eval|https?:|\*/);
  assert.equal(m[2], expectedCsp(html), 'node tools/update-csp.js 로 해시를 갱신하세요');
  assert.ok(html.indexOf(m[0]) < html.indexOf('<script'), 'CSP는 스크립트보다 앞에 있어야 함');
});

test('외부 자원·주소를 참조하지 않음', () => {
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /\/\/[a-z0-9.-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(html, /<script[^>]*\ssrc=/i);
  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html, /@import|url\(/i);
  assert.doesNotMatch(html, /<(img|iframe|form|object|embed|audio|video)\b/i);
});

test('네트워크 전송·저장 API를 쓰지 않음', () => {
  const banned = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource',
    'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'caches', 'serviceWorker',
    'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function'];
  for (const word of banned) assert.ok(!html.includes(word), `${word} 사용 금지`);
});

test('입력란은 자동완성·맞춤법 검사를 끔', () => {
  const ta = html.match(/<textarea[^>]*>/)[0];
  assert.match(ta, /autocomplete="off"/);
  assert.match(ta, /spellcheck="false"/);
});
