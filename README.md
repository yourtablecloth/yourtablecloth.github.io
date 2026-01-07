# yourtablecloth.github.io

이 리포지터리는 식탁보(TableCloth) 홈페이지 웹 사이트의 소스 코드를 관리하는 리포지터리입니다.

## 관련 리포지터리

이 리포지터리는 식탁보(TableCloth)의 홈페이지 부분에 대한 코드만 담고 있습니다. 실제 프로그램 코드와 카탈로그는 아래 리포지터리를 각각 확인하여 주십시오.

- **메인 프로그램**: [TableCloth](https://github.com/yourtablecloth/TableCloth) - 식탁보 메인 애플리케이션
- **카탈로그**: [TableClothCatalog](https://github.com/yourtablecloth/TableClothCatalog) - 사이트별 소프트웨어 설치 목록 관리

## 프로젝트 개요

식탁보는 윈도우 샌드박스를 활용하여 인터넷 뱅킹과 전자정부 서비스 이용 시 필요한 보안 프로그램들을 격리된 환경에서 안전하게 사용할 수 있도록 도와주는 도구입니다.

## 웹사이트 구조

```plaintext
docs/                    # GitHub Pages 배포 디렉터리
├── index.html          # 메인 페이지 (마크다운 렌더링)
├── CNAME               # 커스텀 도메인 설정
└── docs/               # 문서 콘텐츠 (마크다운)
    ├── index.md        # 홈 페이지 콘텐츠
    ├── howto_install_sandbox.md    # 샌드박스 설치 가이드
    ├── need_to_know.md            # 사용 전 알아둘 사항
    ├── privacy.md                 # 개인정보 처리방침
    ├── troubleshoot.md            # 문제 해결 가이드
    └── images/                    # 이미지 리소스
```

> NOTE: `docs_previous` 디렉터리는 더 이상 사용되지 않습니다.

## 로컬 개발 환경 설정

리포지터리를 먼저 클론합니다.

```bash
git clone https://github.com/yourtablecloth/yourtablecloth.github.io.git
cd yourtablecloth.github.io
```

리포지터리를 클론한 다음에는 단순 웹 서버만 띄우면 바로 내용을 보고 작업할 수 있습니다. 본 웹사이트는 정적 HTML/CSS/JavaScript로 구성되어 있어 별도의 빌드 과정이 필요하지 않습니다.

예를 들어 .NET 10 또는 그 이후 버전의 SDK가 설치되어있으면 다음과 같이 실행할 수 있습니다.

```bash
cd docs
dnx -y dotnet-serve -p 8000
```

## 기여 방법

### 문서 수정

1. **마크다운 파일 편집**: `docs/docs/` 디렉터리 내의 `.md` 파일들을 수정
2. **이미지 추가**: `docs/docs/images/` 디렉터리에 이미지 파일 추가
3. **로컬 테스트**: 위의 로컬 서버 실행 방법으로 변경사항 확인

### 스타일링 수정

웹사이트는 다음 기술을 사용합니다:

- **CSS 프레임워크**: Bootstrap 5 (Simplex 테마)
- **폰트**: SUITE Variable 웹폰트
- **마크다운 렌더링**: marked.js + DOMPurify

CSS 수정이 필요한 경우 `docs/index.html` 파일 내의 `<style>` 태그를 편집하세요.

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
- **배포 소스**: `docs/` 디렉터리
- **배포 트리거**: `main` 브랜치에 푸시 시 자동 배포

## 라이선스

이 웹사이트의 소스코드와 문서는 식탁보 프로젝트와 동일한 라이선스를 따릅니다. 자세한 내용은 [메인 리포지터리](https://github.com/yourtablecloth/TableCloth)를 참조하세요.

## 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/yourtablecloth/TableCloth/issues)
- **토론**: [GitHub Discussions](https://github.com/yourtablecloth/TableCloth/discussions)
- **웹사이트 관련 이슈**: [여기에 이슈 등록](https://github.com/yourtablecloth/yourtablecloth.github.io/issues)
