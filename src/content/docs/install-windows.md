# Windows에서 식탁보 설치하기

> 🍎 **Mac을 사용하시나요?** Apple Silicon 기반 맥이라면 [macOS 설치 가이드](install-macos.md)를 확인해주세요.

## 1️⃣ 시스템 요구사항 확인

식탁보는 Windows 11 Pro, Enterprise, Education, Pro for Workstation이 필요합니다.

클라우드 PC나 가상 컴퓨터처럼 일반적인 PC가 아닌 환경인 경우 아래의 **더 자세한 내용** 단락을 확인해주세요.

## 2️⃣ Windows Sandbox 활성화

식탁보를 설치하기 전, 먼저 윈도우 샌드박스를 활성화해야 합니다.

- "Windows 기능 켜기/끄기" 어플리케이션을 실행합니다.

  ![윈도우 기능 켜기/끄기](images/Step1.png)

- "Windows 샌드박스" 기능을 켭니다.

  ![윈도우 샌드박스 켜기](images/Step2.png)

샌드박스 기능을 켜거나 끄려면 컴퓨터를 다시 시작해야 하므로, 작업 중인 모든 파일을 저장한 후 컴퓨터를 다시 시작합니다.

## 3️⃣ 식탁보 다운로드 및 실행

1. [최신 릴리스](https://github.com/yourtablecloth/TableCloth/releases)에서 다운로드
2. 압축 해제 후 실행
3. 원하는 사이트 선택하고 시작!

## 🔎 더 자세한 내용

- 윈도우 365, 혹은 윈도우 가상 데스크톱 (마이크로소프트 애저 기반), 혹은 Hyper-V 같은 가상 컴퓨터 상에서 식탁보를 이용하고자 할 경우, 해당 서비스 또는 가상 컴퓨터 인스턴스 내에서 추가로 가상화 (혹은 Second Level Address Translation, SLAT) 기능을 지원해야만 윈도우 샌드박스를 활성화할 수 있습니다.
