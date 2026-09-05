# 봉담 안전지도 대작전

봉담읍 청소년 안전 교육 RPG — 브라우저에서 바로 플레이할 수 있습니다.

## ▶ 플레이

- **https://bongdam-safety.netlify.app** (주 채널 · 권장)
- https://jjih129.github.io/bongdam/ (GitHub Pages · 병행)

현재 버전 **v397** (Ver. 1.0.0 · Build 397)

- 경량 웹판: `index.html` 약 3.3MB + 외부 `assets/` (오프라인 캐시 지원 PWA)
- 진행 저장은 브라우저(localStorage)에 보관됩니다
- 지원: Chrome / Edge / Firefox / Safari 14+ · 태블릿·폰은 **가로 화면**

## 🛠 개발 · 인수인계

이 `main` 브랜치는 **웹 게시 산출물**입니다. 코드를 수정하거나 다른 PC에서
이어서 작업하려면 **`source` 브랜치**(개발 원본)를 받으세요.

```bash
git clone -b source https://github.com/JJih129/bongdam.git 봉담
cd 봉담
node 검수도구/tools/bundle.js src 봉담지킴이_게시용_v338_final.html
```

마지막 명령이 `src/` 트리를 단일 HTML(약 45MB)로 재조립합니다(1초). 자세한 구조·워크플로·QA 절차는
[`source` 브랜치의 README](https://github.com/JJih129/bongdam/blob/source/README.md)에 있습니다.

| 브랜치 | 내용 |
|---|---|
| `main` | 웹 게시본 (경량 HTML + assets, 인게임 에디터 제외) |
| `source` | 개발 원본 (src 트리 + QA 하네스 + 문서) |
