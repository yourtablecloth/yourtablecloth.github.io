---
layout: default
title: 홈
permalink: /
---

[![식탁보 최신 버전 다운로드 (GitHub 릴리스)](https://img.shields.io/github/downloads/yourtablecloth/TableCloth/total?label=%EC%8B%9D%ED%83%81%EB%B3%B4%20%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C)](https://github.com/yourtablecloth/TableCloth/releases)

![식탁보 실행 화면](images/tablecloth.png)

## 개요

이 프로젝트는 윈도우 10 버전 1909부터 추가된 윈도우 샌드박스를 활용하여, 컴퓨터에서 인터넷 뱅킹을 사용하거나, 전자정부 인터넷 서비스를 사용할 때 설치되는 여러가지 클라이언트 보안 프로그램을 실제 컴퓨터 환경에 영향을 주지 않고 사용할 수 있도록 도와주는 프로그램입니다.

보안을 명목으로 설치되는 여러가지 에이전트, 가상 키보드, 중간 암호화 프로그램들은 그 나름대로의 의미가 있습니다. 하지만 계속해서 변화하는 웹 생태계, 윈도우 운영 체제의 요구 사항을 제대로 반영하지 못하는 웹 사이트가 여전히 많습니다. 그로 인해 보안과 안정성을 추구해야 할 보조 소프트웨어들이 오히려 시스템의 성능을 저하시키거나 때로는 윈도우 운영 체제를 파괴하는 일도 발생합니다.

이런 문제를 완화하고, 컴퓨터를 항상 안정적인 상태로 유지할 수 있도록 도와주기 위하여 이 프로젝트를 시작하게 되었습니다.

## 주의

**식탁보를 사용 중 발생하는 개인, 기업, 기관의 금전손실, 세금신고 누락 등을 비롯한 어떠한 장애나 손해에 대해서는 사용자 본인에게 책임이 있습니다. 중요한 작업의 경우 반드시 실제 PC 환경에서 사용해야 합니다.**

## 주요 기능 소개

- 호스트 USB 드라이브, 로컬 컴퓨터에 저장된 공동 인증서를 샌드박스 내의 `%userprofile%\AppData\LocalLow` 폴더에 자동으로 복사해주는 기능을 제공합니다. 샌드박스를 닫으면, 복사되었던 공동 인증서 사본은 자동으로 삭제됩니다.
- [카탈로그 XML 파일](https://yourtablecloth.github.io/TableClothCatalog/Catalog.xml)에 기재된 각 사이트별 필요 소프트웨어를 확인하여 샌드박스 시작 시 자동으로 다운로드하고 설치를 대행합니다. 지원되는 경우에 한하여, 무인 설치 방식으로 설치를 시도합니다.
- [호환성 목록 XML 파일](https://yourtablecloth.github.io/TableClothCatalog/sites.xml) 호스트 컴퓨터에 Internet Explorer가 설치되어있다는 전제 하에서 샌드박스 내에서 Microsoft Edge의 IE 모드를 활성화하고 해당 뱅킹 사이트를 IE 브라우저로 띄울 수 있게 설정합니다.
- [피로곰](https://www.youtube.com/channel/UC034aoKNX5oheqhL3w-oBOQ)님께서 개발하신 [모두의 프린터](https://modu-print.tistory.com/)를 다운로드하여 설치할 수 있도록 띄우는 기능을 제공합니다. 실물 프린터를 요구하는 일부 DRM 소프트웨어로 인해 빚어지는 불편함을 예방할 수 있습니다.
- 그 외에도 한글 문서를 읽고 인쇄할 수 있는 [한컴오피스 뷰어](https://www.hancom.com/cs_center/csDownload.do)와 PDF 변환 기능 처리를 목적으로 일부 인터넷 서비스에서 필요로 하는 [Adobe Reader](https://www.adobe.com/kr/acrobat/pdf-reader.html)를 다운로드하여 설치할 수 있도록 띄우는 기능을 제공합니다.
- 마이크, 웹캠, 프린터를 샌드박스 안에서 공유해서 쓸 수 있도록 연결할 수 있습니다.

### 시스템 요구 사항

식탁보는 다음의 시스템에서 사용할 수 있습니다.

- 인텔 및 AMD 프로세서를 사용하는 실제 데스크톱 또는 노트북
  - Windows 10 Pro, Windows 10 Enterprise, Windows 10 Education, Windows 10 Pro for Workstation (버전 1909 이상)
  - Windows 11 Pro, Windows 11 Enterprise, Windows 11 Education, Windows 11 Pro for Workstation
- ARM 기반 프로세서를 사용하는 실제 데스크톱 또는 노트북 (애플 실리콘 제외)
  - Windows 11 Pro, Windows 11 Enterprise, Windows 11 Education, Windows 11 Pro for Workstation (버전 22H2 이상)

## 기여 방법

이 프로그램은 카탈로그 파일을 통해 각 인터넷 뱅킹 및 전자 정부 사이트에 접속할 때 설치해야 할 소프트웨어들을 자동으로 찾아 다운로드받습니다.

이 때 프로그램을 직접 다운로드받을 수 있는 URL이 바뀌거나, 구 버전으로 다운로드되는 경우가 있을 수 있는데, 이 부분에 대한 컨트리뷰터 여러분의 기여가 필요합니다.

[Catalog 리포지터리](https://github.com/yourtablecloth/TableClothCatalog)에 보내실 수 있는 풀 리퀘스트는 다음과 같습니다.

- 설치하는 소프트웨어의 주소가 바뀌었거나 새로운 사이트를 추가하려면 `Catalog.xml` 파일에 대한 풀 리퀘스트를 보내주세요.
  - 새로운 사이트를 추가할 때는 사이트의 대표 아이콘이나 엠블렘 이미지도 같이 포함해서 풀 리퀘스트를 보내주세요.
- Internet Explorer 모드에 관련된 설정 변경이 필요하다면 `sites.xml` 파일에 대한 풀 리퀘스트를 보내주세요.

## 스폰서

GitHub Sponsorship을 통하여 후원해주시면 지속적으로 프로젝트를 진행하는데에 큰 도움이 됩니다. [프로젝트 후원하러 가기](https://github.com/sponsors/yourtablecloth)

{% include_relative Sponsors.md %}

## 라이선스

- 본 프로젝트는 [MIT 라이선스](https://github.com/yourtablecloth/TableCloth/blob/dev/LICENSE.txt)를 따릅니다.

- Project emblem made by [Eucalyp](https://www.flaticon.com/authors/eucalyp) from [Flaticon](https://www.flaticon.com/).

- Photo by [Brooke Lark](https://unsplash.com/@brookelark?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/tablecloth?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).

## 개인 정보 보호 정책

개인 정보 보호 정책은 [이 문서](privacy)에 상세하게 기술되어있습니다.

## 같이 보세요

- [식탁보를 사용하기 앞서 알아두실 내용](need_to_know)
- [Windows Sandbox 설치하기](howto_install_sandbox)
- [식탁보 문제 해결](troubleshoot)
- [개인 정보 보호 정책](privacy)
