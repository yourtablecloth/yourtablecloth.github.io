# yourtablecloth.github.io

이 리포지터리는 식탁보(TableCloth) 홈페이지 웹 사이트의 소스 코드를 관리하는 리포지터리입니다.

## 관련 리포지터리

이 리포지터리는 식탁보(TableCloth)의 홈페이지 부분에 대한 코드만 담고 있습니다. 실제 프로그램 코드와 카탈로그는 아래 리포지터리를 각각 확인하여 주십시오.

- **메인 프로그램**: [TableCloth](https://github.com/yourtablecloth/TableCloth) - 식탁보 메인 애플리케이션
- **카탈로그**: [TableClothCatalog](https://github.com/yourtablecloth/TableClothCatalog) - 사이트별 소프트웨어 설치 목록 관리

## 프로젝트 개요

식탁보는 윈도우 샌드박스를 활용하여 인터넷 뱅킹과 전자정부 서비스 이용 시 필요한 보안 프로그램들을 격리된 환경에서 안전하게 사용할 수 있도록 도와주는 도구입니다.

## 웹사이트 구조

React + TanStack Start로 만들고, 빌드할 때 라우트마다 HTML을 미리 만들어 정적 파일로 배포합니다. 서버는 없습니다.

```plaintext
src/
  routes/          / , /docs , /docs/$slug , /404 (파일 기반 라우팅)
  components/      천 렌더러(three.js), 랜딩 섹션, 헤더·푸터, 문서 스타일
  content/
    site.ts        모든 페이지 카피 (한국어/영어)
    docs/*.md      문서 본문 (기존 docs/docs/*.md 를 그대로 옮긴 것)
  data/            카탈로그 집계 수치, 후원자·FAQ·보도 스냅숏
  lib/             천 물리, 로케일, 테마, 마크다운 변환
  styles/app.css   전역 스타일
public/            빌드 결과 루트로 그대로 복사되는 파일
  CNAME            커스텀 도메인 설정
  docs/images/     문서 본문이 참조하는 이미지
  sponsors.json    워크플로가 매주 갱신
  og.png, robots.txt, sitemap.xml, site.webmanifest
scripts/           정적 미리보기 서버
```

## 로컬 개발 환경 설정

Node.js 22.12 이상과 pnpm 11.9.0이 필요합니다. pnpm 버전은 `package.json`의 `packageManager` 필드에 적혀 있으므로 corepack을 켜두면 맞춰 줍니다.

```bash
git clone https://github.com/yourtablecloth/yourtablecloth.github.io.git
cd yourtablecloth.github.io
corepack enable
pnpm install
pnpm dev          # http://localhost:3100
```

| 명령 | 하는 일 |
| --- | --- |
| `pnpm dev` | 개발 서버, 3100 포트 |
| `pnpm build` | 정적 사이트를 `dist/client`에 빌드 |
| `pnpm preview` | 빌드 결과를 GitHub Pages와 같은 규칙으로 서빙, 3100 포트 |
| `pnpm generate-routes` | 파일 기반 라우트에서 `src/routeTree.gen.ts` 재생성 |

배포되는 것은 `dist/client` 디렉터리 하나뿐입니다. 실제로 어떻게 보이는지 확인할 때는 `pnpm build && pnpm preview`로 이 디렉터리를 직접 열어 보시는 편이 정확합니다. 타입 검사는 `pnpm exec tsc --noEmit`으로 합니다.

## 기여 방법

### 문서 수정

1. **마크다운 파일 편집**: `src/content/docs/` 디렉터리 내의 `.md` 파일들을 수정
2. **문서 추가**: 마크다운을 추가한 뒤 `src/content/docs/index.ts`의 `DocSlug`와 `DOCS`에 등록하고, `public/sitemap.xml`에 URL 추가
3. **이미지 추가**: `public/docs/images/` 디렉터리에 이미지 파일 추가 (마크다운에는 `images/파일명` 으로 작성)
4. **로컬 테스트**: 위의 개발 서버로 변경사항 확인

### 문구 수정

페이지에 보이는 문구는 `src/content/site.ts`에 한국어와 영어 두 벌로 모여 있습니다. 숫자는 문구에 직접 쓰지 않고 `src/data/catalog.ts`에서 가져옵니다.

### 후원자 목록

후원자 목록은 손으로 고치지 않습니다. 배포 워크플로가 GitHub Sponsors API로 `public/sponsors.json`을 다시 쓰고, 빌드가 그 파일을 읽어 홈의 후원자 영역과 `/docs/sponsor` 페이지를 함께 그립니다(`src/data/sponsors.ts`). 비공개를 선택한 후원자는 이름 없이 인원수로만 표시합니다.

### 스타일링 수정

- **스타일**: CSS Modules (`*.module.css`)와 `src/styles/app.css`
- **폰트**: Pretendard(본문), JetBrains Mono(코드) — 필요한 글자 범위만 내려받도록 나뉘어 있습니다
- **3D**: three.js로 그리는 천 시뮬레이션 (`src/components/cloth/`, `src/lib/cloth.ts`)

### Pull Request 절차

1. 이 리포지터리를 포크
2. 새로운 브랜치 생성: `git checkout -b feature/문서-개선`
3. 변경사항 커밋: `git commit -am '문서 개선: 설치 가이드 업데이트'`
4. 브랜치에 푸시: `git push origin feature/문서-개선`
5. Pull Request 생성

### 기여 가이드라인

- **문서 스타일**: 명확하고 이해하기 쉬운 한국어 작성
- **이미지**: 스크린샷은 가능한 한 최신 상태 유지
- **링크 검증**: 외부 링크의 유효성 확인
- **접근성**: 모든 사용자가 접근 가능한 콘텐츠 작성

## 배포

이 리포지터리는 GitHub Pages를 통해 자동 배포됩니다.

- **배포 URL**: <https://yourtablecloth.app>
- **배포 소스**: GitHub Actions가 빌드한 `dist/client` 디렉터리
- **배포 트리거**: `main` 브랜치에 푸시 시 자동 배포, 매주 일요일 후원자·기여자 목록 갱신

워크플로(`.github/workflows/deploy.yml`)는 후원자·기여자 목록을 `public/`에 쓰고, `pnpm build`로 사이트를 만든 뒤 그 결과를 Pages에 올립니다. `sponsors.json`과 `contributors.json` 주소는 이전과 같고, 후원자 목록은 그 파일을 읽어 화면에 그립니다.

파일이 없는 주소는 `404.html`이 404 상태로 응답하고, 그때부터 앱이 주소를 보고 화면을 그립니다. 예전 사이트가 쓰던 `#install`, `#faq` 같은 해시 주소는 홈에서 받아 새 경로로 넘겨 줍니다.

## 라이선스

이 웹사이트의 소스코드와 문서는 식탁보 프로젝트와 동일한 라이선스를 따릅니다. 자세한 내용은 [메인 리포지터리](https://github.com/yourtablecloth/TableCloth)를 참조하세요.

## 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/yourtablecloth/TableCloth/issues)
- **토론**: [GitHub Discussions](https://github.com/yourtablecloth/TableCloth/discussions)
- **웹사이트 관련 이슈**: [여기에 이슈 등록](https://github.com/yourtablecloth/yourtablecloth.github.io/issues)
