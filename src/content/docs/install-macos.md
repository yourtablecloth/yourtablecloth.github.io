# macOS에서 식탁보 설치하기

> 💡 Windows PC를 사용하고 계시다면 [Windows용 설치 가이드](install-windows.md)를 확인해주세요.

Windows 샌드박스를 macOS로 포팅한 [macSandbox](https://yourtablecloth.app/macSandbox)를 이용하면, Apple Silicon 기반 맥에서도 식탁보 무설치 버전(`.wsb`)을 그대로 실행할 수 있습니다.

macSandbox는 부팅할 때마다 깨끗한 새 Windows 환경을 제공하고, 창을 닫으면 모든 변경 사항이 완전히 삭제되는 일회용 샌드박스입니다. 클립보드 공유, 폴더 공유, 프린터 리다이렉션도 지원합니다.

> 🚀 **정식 macOS 앱도 준비 중입니다** — 지금은 macSandbox와 무설치 버전(`.wsb`) 조합으로 식탁보를 사용하실 수 있고, 앞으로 macOS 전용 정식 식탁보 앱도 추가로 출시할 예정입니다.

## 1️⃣ 시스템 요구사항 확인

- **Apple Silicon 기반 Mac (M1 이상)** — 인텔 기반 맥은 지원되지 않습니다.
- **macOS 26 (Tahoe) 이상 권장** — macOS 14~15에서도 실행될 수 있으나, 공식적으로 테스트되지 않았습니다.
- 본인이 사용할 수 있는 라이선스의 **Windows 11 ARM64 ISO** — macSandbox에는 Windows가 포함되어 있지 않으며, 마이크로소프트 공식 채널에서 직접 내려받아야 합니다.
- 약 **24GB**의 여유 디스크 공간

## 2️⃣ macSandbox 설치

1. [macSandbox 릴리스 페이지](https://github.com/yourtablecloth/macSandbox/releases/latest)에서 최신 `macSandbox-for-Windows-<버전>.dmg` 파일을 내려받습니다.

2. DMG 파일을 열고 **macSandbox for Windows** 앱을 **응용 프로그램(Applications)** 폴더로 드래그합니다.

3. 아직 서명되지 않은 앱이므로, 처음 실행할 때 macOS Gatekeeper가 실행을 차단할 수 있습니다. 아래 두 가지 방법 중 하나로 허용해주세요.

   - 터미널에서 다음 명령을 실행 (권장):

     ```bash
     xattr -dr com.apple.quarantine "/Applications/macSandbox for Windows.app"
     ```

   - 또는 **시스템 설정 → 개인정보 보호 및 보안**에서 **그래도 열기**를 누릅니다.

## 3️⃣ Windows 이미지 빌드 (최초 1회)

macSandbox를 처음 실행하면 Windows 11 ARM64 ISO 파일을 선택하라는 안내가 나옵니다. ISO를 선택하면 자동으로 기본 이미지를 빌드하며, 보통 **20~40분** 정도 걸립니다.

빌드는 **한 번만** 하면 됩니다. 이후에는 샌드박스를 열 때마다 이 이미지를 바탕으로 깨끗한 새 환경이 준비됩니다.

## 4️⃣ 식탁보 다운로드 및 실행

1. [식탁보 무설치 버전 (`no-install-spork.wsb`)](https://github.com/yourtablecloth/TableCloth/releases/latest/download/no-install-spork.wsb)을 내려받습니다.
2. 내려받은 `.wsb` 파일을 macSandbox로 엽니다.
3. 샌드박스 안에서 식탁보가 자동으로 열리면, 원하는 사이트를 선택하고 시작하세요!

창을 닫으면 샌드박스 안에서 있었던 모든 일이 완전히 삭제됩니다. 실제 맥에는 아무런 흔적도 남지 않아요.

## 🔎 더 자세한 내용

- `.wsb` 설정 파일이 어디까지 지원되는지는 [WSB-SUPPORT 문서](https://github.com/yourtablecloth/macSandbox/blob/main/WSB-SUPPORT.md)에서 확인할 수 있습니다.
- macSandbox의 구조와 동작 원리가 궁금하다면 [ARCHITECTURE 문서](https://github.com/yourtablecloth/macSandbox/blob/main/ARCHITECTURE.md)를 참고하세요.
- macSandbox는 식탁보와는 별도의 프로젝트로, [GNU AGPL-3.0 또는 상용 라이선스](https://github.com/yourtablecloth/macSandbox/blob/main/LICENSING.md)로 제공됩니다.
- 사용 중 문제가 있다면 [macSandbox GitHub 이슈](https://github.com/yourtablecloth/macSandbox/issues)로 알려주세요.
