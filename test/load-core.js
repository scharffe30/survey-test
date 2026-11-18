'use strict';
// index.html에서 <script id="survey-core"> 블록만 꺼내 격리된 vm에서 실행한다.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

function readHtml() {
  return fs.readFileSync(HTML_PATH, 'utf8');
}

function loadCore() {
  const m = readHtml().match(/<script id="survey-core">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('survey-core 스크립트를 찾지 못함');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(m[1], sandbox, { filename: 'index.html#survey-core' });
  return sandbox.SurveyCore;
}

module.exports = { loadCore, readHtml };
