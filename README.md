# 설문 집계기

엑셀에서 머리글 줄까지 복사해 붙여넣으면 문항별 결과 표(문항 / 유효 응답 / 평균 / 빈 응답 / 제외)를 보여 주는 단일 페이지입니다.

- 사용: `index.html`을 브라우저로 열거나 GitHub Pages로 게시합니다(`.nojekyll` 포함).
- 외부 라이브러리·외부 글꼴·분석 도구를 쓰지 않으며, 붙여넣은 데이터는 브라우저 밖으로 보내거나 저장하지 않습니다. CSP(`default-src 'none'`)로 외부 연결을 막습니다.
- 집계 규칙과 구조는 [PLAN.md](PLAN.md)에 있습니다.

## 시험

```bash
npm test
```

외부 의존 없이 Node 18 이상의 `node --test`로 돌아갑니다. 계산 로직은 `index.html`의 `<script id="survey-core">` 블록에 있고, 시험은 그 블록만 꺼내 실행합니다.

## 인라인 코드를 고친 뒤

CSP가 인라인 `<script>`·`<style>`의 해시만 허용하므로, 고친 뒤에는 해시를 갱신해야 페이지가 동작합니다(시험이 어긋남을 잡아냅니다).

```bash
node tools/update-csp.js
```
