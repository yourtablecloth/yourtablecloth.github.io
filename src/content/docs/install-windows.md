# Windows에서 식탁보 설치하기

식탁보 데스크톱 앱은 Windows 11 Pro, Education 또는 Enterprise와 Windows Sandbox를 사용합니다. Apple Silicon 맥에서는 [macOS 설치 가이드](/docs/install-macos)를 참고할 수 있습니다.

## Windows Sandbox 활성화

시작 메뉴에서 `Windows 기능 켜기/끄기`를 열고 `Windows 샌드박스`를 선택합니다. 변경을 적용한 뒤 Windows를 다시 시작합니다. 가상 컴퓨터나 클라우드 PC에서는 중첩 가상화를 제공해야 Windows Sandbox를 켤 수 있습니다. [Microsoft의 Windows Sandbox 요구 사항](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/)에서 지원 환경을 확인할 수 있습니다.

## 정식 버전과 Preview 내려받기

일반 사용자는 [최신 정식 릴리스](https://github.com/yourtablecloth/TableCloth/releases/latest)의 Windows 아키텍처에 맞는 TableCloth 설치 관리자 또는 Portable ZIP을 선택할 수 있습니다. 식탁보 AI의 현재 화면과 기능을 확인하려면 [v1.22.0-preview.5](https://github.com/yourtablecloth/TableCloth/releases/tag/v1.22.0-preview.5)의 `TableCloth-Preview` 설치 관리자 또는 Portable ZIP을 선택합니다. Preview는 사전 출시 버전이므로 정식 출시에서 기능과 화면이 달라질 수 있습니다.

## 빠른 시작 화면

식탁보를 실행한 뒤 기관 이름, 웹 주소 또는 질문을 입력할 수 있습니다. 입력이 비어 있으면 빈 샌드박스를 시작합니다. AI 기능은 `식탁보 AI (베타)`에서 열 수 있으며 별도의 ChatGPT 로그인이 필요합니다.

아래 화면은 v1.22.0-preview.5의 UI 테스트에서 예시 카탈로그 데이터로 렌더링했습니다. `bank.example`은 실제 금융기관 주소가 아닙니다.

![v1.22.0-preview.5 빠른 시작 화면과 예시 서비스 제안](images/tablecloth-preview5-quick-start.png)

AI 창의 현재 화면과 개인정보 입력 안내는 [식탁보 AI Preview 사용 안내](/docs/managed-ai)에서 확인할 수 있습니다.
