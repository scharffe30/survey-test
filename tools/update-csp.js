'use strict';
// index.html의 인라인 스크립트·스타일을 고친 뒤 실행: node tools/update-csp.js
const fs = require('node:fs');
const path = require('node:path');
const { expectedCsp, CSP_RE } = require('../test/csp');

const file = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
if (!CSP_RE.test(html)) throw new Error('CSP 메타 태그를 찾지 못함');
fs.writeFileSync(file, html.replace(CSP_RE, (_, a, __, c) => a + expectedCsp(html) + c));
console.log('CSP 해시를 갱신했습니다.');
