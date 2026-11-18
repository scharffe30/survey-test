'use strict';
// index.html 안 인라인 <script>·<style> 내용의 sha256 해시로 CSP 값을 만든다.
const crypto = require('node:crypto');

const hash = (s) => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";

function inlineBlocks(html, tag) {
  const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'g');
  return [...html.matchAll(re)].map((m) => m[1]);
}

function expectedCsp(html) {
  const scripts = inlineBlocks(html, 'script').map(hash).join(' ');
  const styles = inlineBlocks(html, 'style').map(hash).join(' ');
  return `default-src 'none'; script-src ${scripts}; style-src ${styles}; base-uri 'none'; form-action 'none'`;
}

const CSP_RE = /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(">)/;

module.exports = { expectedCsp, CSP_RE };
