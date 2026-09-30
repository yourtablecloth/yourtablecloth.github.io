# 개인정보 처리방침

시행일: 2026년 9월 30일

식탁보는 Windows 호스트 앱, Windows Sandbox에서 실행하는 Spork, 식탁보 AI Preview와 홈페이지를 제공합니다. 이 방침은 각 기능이 사용하는 정보와 외부 서비스로 전달될 수 있는 정보를 설명합니다. 기능을 사용하지 않아도 모든 항목을 일괄 수집한다는 뜻은 아닙니다.

공동인증서 파일은 사용자가 선택한 샌드박스 기능에서 로컬로 처리합니다. 식탁보 AI 대화는 사용자의 ChatGPT 계정으로 OpenAI에 전달합니다. 홈페이지는 GitHub Pages에서 제공하며 방문자의 IP 주소를 GitHub가 보안 목적으로 기록합니다. 아래에서 처리 목적과 항목, 보관과 삭제 방법, 문의 경로를 순서대로 안내합니다. 방침의 구성에는 [개인정보 보호법 제30조](https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1029331583)와 [개인정보보호위원회의 2026년 작성지침](https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885)을 참고했습니다.

## 공동인증서의 로컬 사용과 샌드박스 복사

식탁보는 사용자가 공동인증서 가져오기 또는 NPKI 폴더 공유를 선택하면 인증서 파일을 Windows Sandbox에서 사용할 수 있도록 처리합니다. 파일 가져오기에는 공개 인증서와 개인키 파일의 쌍 또는 PKCS #12 파일과 비밀번호가 사용될 수 있습니다. 이 과정에서 호스트의 임시 준비 폴더와 샌드박스 안에 인증서 사본이 생길 수 있습니다. NPKI 폴더 공유를 켜면 호스트 폴더를 샌드박스에 읽기 전용으로 연결한 뒤 게스트의 표준 경로로 복사합니다. 샌드박스를 닫으면 게스트의 복사본은 Windows Sandbox의 폐기 방식에 따라 처리됩니다. 호스트 원본과 호스트의 임시 파일은 별도로 관리되므로 모든 파일이 창을 닫을 때 즉시 사라진다고 보장하지 않습니다.

인증서를 이용해 접속하는 금융기관이나 공공기관 웹사이트는 해당 사이트의 방침에 따라 정보를 처리합니다. [Microsoft의 Windows Sandbox 설명](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/)에서 게스트 환경의 수명과 파일 공유 방식을 확인할 수 있습니다.

## OpenAI에 전달하는 식탁보 AI 대화

식탁보 AI는 v1.22.0 Preview의 선택 기능입니다. 사용자가 ChatGPT로 로그인하고 메시지를 보내면 식탁보가 사용자 입력, 현재 대화의 일부 이전 메시지, 선택한 모델, 앱 버전 및 기능 안내를 전용 Codex 런타임에 전달합니다. 런타임은 답변을 생성하기 위해 OpenAI 서비스에 요청합니다. 이전 대화는 앱 메모리에 최대 12개 메시지와 20,000자까지만 유지하며, 새 대화를 시작하거나 AI 창을 닫으면 앱의 대화 기록을 비웁니다. 앱의 메모리 삭제가 OpenAI 측 기록의 삭제를 뜻하지는 않습니다.

대화 처리 목적은 사용자가 요청한 답변과 웹 검색 결과를 제공하는 것입니다. OpenAI 측 처리, 보관, 모델 개선 사용 여부는 계정 종류와 설정에 따라 달라질 수 있습니다. 자세한 내용과 제어 방법은 [OpenAI 개인정보 처리방침](https://openai.com/policies/row-privacy-policy/)과 [ChatGPT 데이터 제어 안내](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt)를 참고할 수 있습니다. 식탁보가 Codex의 일시적 실행 옵션을 사용하는 사실만으로 OpenAI 측의 임시 대화 또는 학습 제외를 보장하지 않습니다. 대화 전송에는 사용자의 OpenAI 구독 사용량이 적용됩니다.

## 만료 건수 조회와 입력 보호

사용자가 인증서 만료 여부 조회에 동의하면 호스트의 로컬 도구가 공개 인증서의 만료일을 확인합니다. AI에는 만료된 인증서 수, 향후 30일 안에 만료되는 인증서 수, 조회 완료 여부와 고정된 조회 기간만 전달합니다. 개별 인증서의 이름, 발급자, 일련번호, 경로, 공개 인증서 내용과 개인키는 이 조회 결과에 넣지 않습니다. 식탁보 AI는 인증서의 세부 정보나 스크린샷을 직접 볼 수 없습니다. 로컬 도구는 이 조회 중 개인키 파일의 존재만 확인하며 그 내용을 읽지 않습니다. [식탁보 AI 사용 안내](/docs/managed-ai)에서 조회 범위를 더 설명합니다.

AI 입력란 위에는 민감 개인정보, 공동인증서 파일, 스크린샷을 입력하거나 링크로 공유하지 말라는 안내를 항상 표시합니다. 입력란의 정적 필터는 일부 국내 전화번호, 주민등록번호와 주소 형식을 가리고, 인식 가능한 인증서 세부 정보 및 인증서 스크린샷 링크를 거부합니다. 파일 첨부 기능은 제공하지 않습니다. 정규표현식만으로 모든 개인정보나 링크 대상의 내용을 판별할 수는 없습니다. 따라서 필터가 가리지 못한 텍스트를 전송하면 OpenAI에 전달될 수 있습니다. 개인정보보호위원회의 [생성형 AI 관련 처리방침 안내](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&nttId=12021)도 AI 입력과 외부 처리에 관한 안내를 다룹니다.

## 로컬 진단 기록과 Sentry

식탁보 AI는 실행 시각, 실행 식별자, 런타임 버전, 소요 시간, 이벤트 및 검색 호출 수, 출력 바이트 수와 결과 상태를 `%LOCALAPPDATA%\TableCloth\ManagedAi\logs`의 JSONL 진단 파일에 기록합니다. 이 기록 형식에는 대화 입력, 답변, 인증서 정보와 오류 원문을 넣지 않습니다. 새 진단 기록을 쓸 때 7일이 지난 파일과 용량 한도를 초과한 파일을 정리합니다. 그동안 AI 요청이 없으면 오래된 파일이 다음 기록 시점까지 남을 수 있습니다. 로컬 기록은 사용자의 기기에서 해당 파일을 삭제할 수 있습니다.

호스트 앱의 `오류 로그 자동 수집` 설정은 기본적으로 켜져 있으며 호스트의 Sentry SDK 초기화 여부를 제어합니다. 설정을 바꾸면 앱을 다시 시작한 뒤 적용됩니다. SDK가 활성화되면 오류, 성능 및 세션 진단 정보가 [Sentry](https://sentry.io/privacy/)의 처리 대상이 될 수 있습니다. Windows Sandbox의 Spork는 Sentry를 별도로 초기화하며 호스트 설정을 따르지 않습니다. 실제 전송 항목, Sentry 프로젝트의 보관 기간과 처리 지역은 공개 소스만으로 확인되지 않았습니다. 이 사항은 운영 설정 확인 후 방침에 보완하겠습니다.

## 홈페이지 접속과 외부 링크

홈페이지는 GitHub Pages의 정적 사이트입니다. 현재 홈페이지 소스에는 자체 방문 분석 스크립트나 개인정보 입력 양식이 없습니다. 다만 [GitHub Pages는 방문자의 IP 주소를 보안 목적으로 기록하고 보관합니다](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection). GitHub의 보관과 권리 행사 방법은 [GitHub 개인정보처리방침](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)을 따릅니다. 홈페이지에서 GitHub, 후원, 문의 또는 기타 외부 링크를 열면 해당 서비스가 자체 방침에 따라 정보를 처리할 수 있습니다.

홈페이지는 GitHub의 공개 기여 기록과 공개 후원 정보에서 계정 이름, 프로필 링크, 아바타 주소, 기여 횟수 또는 후원 등급을 가져와 표시합니다. GitHub Sponsors에서 비공개로 설정한 후원자의 신원은 홈페이지에 표시하지 않고 인원수에만 합산합니다. 이 데이터는 [홈페이지 배포 워크플로](https://github.com/yourtablecloth/yourtablecloth.github.io/blob/main/.github/workflows/deploy.yml)에서 갱신합니다. 공개 프로필이나 후원 공개 범위를 변경할 때는 GitHub 계정 설정이 적용됩니다.

## 정보주체의 요청과 문의

사용자는 AI 창의 `새 대화`로 앱 메모리의 대화 기록을 지울 수 있습니다. 앱의 진단 설정을 변경하거나 로컬 AI 진단 파일을 삭제할 수 있습니다. OpenAI 대화와 계정 데이터에 관한 요청은 [OpenAI의 데이터 제어](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt)를 이용할 수 있으며, GitHub Pages의 접속 기록은 [GitHub의 개인정보 절차](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)를 따릅니다. 식탁보 운영자에게는 개인정보 열람, 정정, 삭제, 처리 정지와 관련한 문의를 [rkttu@rkttu.com](mailto:rkttu@rkttu.com)으로 보낼 수 있습니다. 담당자 성명과 별도 연락처는 운영자 확인 후 보완하겠습니다.

## 방침 개정과 확인 범위

이번 개정은 v1.22.0-preview.5의 공개 코드와 홈페이지 배포 설정을 기준으로 작성했습니다. 외부 서비스의 실제 운영 설정 및 보관 기간처럼 저장소에서 확인할 수 없는 항목은 추정하지 않았습니다. 처리 방식이나 운영 정보가 달라지면 이 페이지의 시행일과 내용을 수정하겠습니다. 이전 문구와 변경 내역은 [홈페이지 저장소의 파일 이력](https://github.com/yourtablecloth/yourtablecloth.github.io/commits/main/src/content/docs/privacy.md)에서 확인할 수 있습니다.
