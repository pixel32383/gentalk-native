# GENTALK

> 실생활 상황을 입력하고, 필요한 단어를 익힌 뒤 AI와 직접 대화하는 언어 학습 앱입니다.

카페 주문부터 호텔 체크인, 공항 보안 검색까지 원하는 상황으로 학습을 시작합니다. 단어 학습·짝맞추기·AI 회화·피드백을 하나의 과정으로 연결하고, 배운 표현은 복습과 오늘의 문장으로 이어갑니다.

[개발·실행 가이드](docs/DEVELOPMENT.md) · [변경 기록](CHANGELOG.md) · [개인정보처리방침](https://pixel32383.github.io/gentalk-native/privacy-policy.html) · [서비스 이용약관](https://pixel32383.github.io/gentalk-native/terms-of-service.html)

## 학습 흐름

**상황 입력 → 단어 학습 → 짝맞추기 → AI 회화 → 피드백 → 복습**

1. 상황을 직접 입력하거나 홈의 추천 상황을 선택합니다.
2. 학습 언어와 단어 수에 맞춰 생성된 단어를 확인합니다.
3. 모르거나 헷갈리는 단어를 선택해 짝맞추기로 익힙니다.
4. 상황 속 Staff와 글 또는 음성으로 대화합니다.
5. 대화 내용에 대한 피드백과 교정 표현을 확인합니다.
6. 중요한 표현을 오늘의 문장에 저장하고, 지정한 시간에 복습합니다.

### 온보딩 안내

| 상황 입력 | 단어·회화 연습 | 피드백·복습 |
| --- | --- | --- |
| <img src="assets/onboarding/1.png" alt="원하는 상황을 입력하는 온보딩 안내" width="220" /> | <img src="assets/onboarding/2.png" alt="단어와 AI 회화 연습을 소개하는 온보딩 안내" width="220" /> | <img src="assets/onboarding/3.png" alt="피드백과 복습을 소개하는 온보딩 안내" width="220" /> |

## 주요 기능

| 영역 | 기능 |
| --- | --- |
| 홈 | 상황 직접 입력, 추천 상황, 학습 언어·단어 수 설정, 진행 중 학습 이어하기 |
| 단어·게임 | 선택한 단어 짝맞추기, 페이지별 최대 6쌍, 정답·오답 표시, 단어 선택 시 듣기 |
| AI 회화 | 상황과 학습 단어를 반영한 대화, 말하기 입력, 다시 듣기, 예시 답변·해석·발음 안내 |
| 피드백 | 대화 개선 제안, 잘한 점·개선할 점, 교정 문장, 다음 연습 목표 |
| 복습 | 상황 검색·언어 필터, 단어 게임 재학습, 표현·대화·피드백, 교정 확인 표시 |
| 오늘의 문장 | 표현 북마크, 날짜별 문장 배정, 하루 한 번 1~3문장 알림, 월별 학습 중·완료, 완료일 최신순 보기 |
| 계정·설정 | Google 로그인·게스트 모드, 프로필 사진·이름, 음성 속도·목소리 미리듣기, 권한·데이터 관리 |
| 저장 | 계정별 기록, 진행 중 학습 자동 저장, 기기 캐시와 저장 대기열을 통한 재동기화 |

**앱 표시 언어:** 한국어 · 영어 · 일본어

**학습 언어:** 영어 · 일본어 · 한국어 · 중국어 · 프랑스어 · 스페인어 · 독일어 · 러시아어 · 아랍어

기기의 음성 인식 서비스와 설치된 음성에 따라 말하기·듣기 지원 범위가 달라질 수 있습니다. 오늘의 문장에 표시되는 말하기 일치도는 인식된 글자와 목표 문장을 비교한 값입니다.

## 개발 및 제출 상태

Android 실기기에서 사용자가 주요 기능의 정상 동작을 확인한 졸업작품 개발본입니다. 버전은 `1.0.0`이며, 현재 소스에는 Expo SDK 57 호환 패키지 업데이트가 반영되어 있습니다.

- 개발용 앱은 개발 서버에 연결해 실행합니다.
- 제출용 Preview APK는 공개 AI API 서버(`https://gentalk-pixel3238.expo.app`)에 연결합니다. 인터넷이 연결되어 있으면 PC 개발 서버 없이 AI 학습을 사용할 수 있습니다.
- 일반 Preview APK와 한도 ON/OFF 기능이 있는 테스트 전용 APK의 빌드를 완료했습니다. 설치 파일은 EAS에서 관리하며 GitHub에는 소스와 문서만 저장합니다.
- 제한을 켠 경우 계정별 하루 한도는 단어 생성 20회, 회화·음성 확인 합계 200회, 피드백 20회, 전체 240회이며 분당 한도는 8회입니다.

API 서버 배포와 최종 APK 배포는 GitHub 소스 업데이트와 별도 작업입니다.

## 빠른 시작

Node.js 24와 npm을 기준으로 개발·검증합니다.

```bash
git clone https://github.com/pixel32383/gentalk-native.git
cd gentalk-native
npm ci
```

루트의 [.env.example](.env.example)을 `.env`로 복사한 뒤 서버용 OpenAI API 키를 입력합니다. 다른 Firebase 프로젝트로 실행할 경우 인증·앱 설정도 변경해야 합니다. 자세한 과정은 [개발·실행 가이드](docs/DEVELOPMENT.md)를 참고하세요.

개발용 APK를 설치한 기기에서 연결합니다.

```bash
npx expo start --dev-client
```

Google 로그인과 음성 인식은 추가 네이티브 모듈을 사용하므로 개발용 APK가 필요합니다.

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 앱 | Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Expo Router |
| UI | NativeWind · Lucide · Reanimated |
| AI | Expo Router API Routes · OpenAI API |
| 인증·저장 | Firebase Authentication · Cloud Firestore · Firebase Storage |
| 기기 기능 | Expo Notifications · Expo Speech · Expo Speech Recognition · Image Picker |
| 로컬 저장 | AsyncStorage · 계정별 캐시 · 저장 대기열 |
| 빌드·문서 | EAS Build · GitHub Pages |

## 프로젝트 구조

```text
src/
├── app/                 # 앱 진입점·화면 전환
│   └── api/             # 단어 생성·회화·피드백·음성 인식 확인 API
├── screens/             # 홈·복습·오늘의 문장·프로필·온보딩
├── learning/            # 학습 과정과 5개 단계 화면
├── components/          # 공통 UI·모달
├── firebase/            # 인증·학습 기록·프로필·이미지 저장
├── services/            # API 요청·알림·음성·동기화
│   └── server/          # AI 회화 규칙·피드백 규칙·요청 제한
├── data/                # 추천 상황·언어·번역
└── types/               # 공통 타입
tests/                   # 저장 기록 병합 테스트
assets/                  # 앱 아이콘·온보딩 이미지
docs/                    # 실행 가이드·공개 정책 문서
```

## 검증

```bash
npx tsc --noEmit
npm test
npx expo export --platform android
```

자동 테스트는 서버 기록과 기기 캐시·저장 대기열의 병합을 확인합니다. 로그인, 마이크, 알림, 키보드 동작은 실제 기기에서 추가 확인합니다.

## 데이터와 보안

- OpenAI 키는 서버 환경 변수로 읽으며, `.env`는 Git에서 제외합니다.
- AI 요청에는 Firebase ID 토큰을 포함하고 사용자별 요청 제한을 적용합니다.
- 계정별 접근을 제한하는 Firestore·Storage 규칙을 저장소에서 관리합니다. 실제 서버 적용은 Firebase 규칙 배포가 필요합니다.
- 오프라인 중 저장·삭제 대기 작업은 계정별로 관리하고, 앱 실행·활성화 및 주기적인 재시도로 반영합니다.
- 오늘의 문장 알림은 14일치 로컬 예약 방식입니다. 앱을 열 때 예약을 갱신하며, 새 AI 학습에는 인터넷 연결이 필요합니다.

## 문서

- [개발·실행 및 빌드 안내](docs/DEVELOPMENT.md)
- [최근 변경 기록](CHANGELOG.md)
- [정책 문서 관리 안내](docs/README.md)
- [라이선스](LICENSE)
