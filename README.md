# GENTALK

> 실생활 상황을 입력하면 AI가 학습 단어, 짝맞추기 게임, 회화 연습, 피드백까지 이어주는 상황 기반 언어 학습 앱입니다.

GENTALK은 카페 주문, 호텔 체크인, 공항 보안 검색처럼 실제로 마주칠 수 있는 상황에서 필요한 표현을 익히고, AI와 대화하며 복습할 수 있도록 설계했습니다.

## 학습 흐름

1. 원하는 상황을 입력하거나 추천 상황을 선택합니다.
2. 상황에 맞는 단어를 학습하고, 헷갈리는 단어를 선택합니다.
3. 선택한 단어로 짝맞추기 게임을 진행합니다.
4. AI Staff와 상황에 맞는 회화를 연습합니다.
5. 대화 피드백과 타임라인을 확인하고 중요한 표현을 저장합니다.
6. 저장한 표현은 `오늘의 문장` 알림으로 다시 말해봅니다.

| 상황 입력 | 단어·회화 연습 | 피드백·복습 |
| --- | --- | --- |
| <img src="assets/onboarding/1.png" alt="상황 입력 화면" width="220" /> | <img src="assets/onboarding/2.png" alt="단어와 회화 연습 화면" width="220" /> | <img src="assets/onboarding/3.png" alt="피드백과 복습 화면" width="220" /> |

## 주요 기능

- 상황별 AI 단어 생성과 단어 수 설정
- 단어 짝맞추기 게임과 오답 동작 피드백
- 상황·역할·학습 단어를 반영한 AI 회화
- Staff 문장 듣기, 해석, 예시 답변, 말하기 연습
- 회화 결과 기반의 개선 제안·잘한 점·개선할 점 피드백
- 학습 기록, 표현, 대화, 피드백을 한 곳에서 복습
- 오늘의 문장 저장, 알림 시간·문장 수 설정, 말하기 연습
- Google 로그인 및 게스트 모드
- Firestore 기반 학습 기록·프로필 동기화와 오프라인 저장 대기
- 프로필 이미지, 음성·권한·데이터 관리 설정

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 앱 | Expo SDK 57, React Native, TypeScript, Expo Router |
| UI | NativeWind, Lucide icons, Reanimated |
| AI | Expo Router API Routes, OpenAI API |
| 인증·데이터 | Firebase Authentication, Cloud Firestore, Firebase Storage |
| 기기 기능 | 알림, 음성 합성, 음성 인식, 이미지 선택 |
| 배포 | EAS Build, GitHub Pages (정책 문서) |

## 프로젝트 구조

```text
src/
├── app/             # 앱 진입점과 AI API 라우트
├── screens/         # 홈·복습·오늘의 문장·프로필 화면
├── learning/        # 단어·게임·AI 회화·피드백 학습 흐름
├── components/      # 공통 UI와 설정 모달
├── firebase/        # 인증, Firestore, Storage 처리
├── services/        # AI 요청, 알림, 음성, 오프라인 동기화
├── data/            # 추천 상황, 언어, 번역 문구
└── types/           # 공통 타입
```

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 OpenAI 키를 설정합니다. 이 파일은 GitHub에 올리지 않습니다.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Firebase 웹 설정은 `src/firebase/firebase.ts`에서 관리합니다. Google 로그인과 Firebase Storage를 사용하려면 Firebase Console의 인증 제공업체·보안 규칙도 설정해야 합니다.

### 3. 개발 서버 실행

```bash
npx expo start
```

### 4. Android 개발용 앱 빌드

음성 인식처럼 네이티브 기능을 포함해 테스트하려면 개발용 APK를 빌드합니다.

```bash
npx eas-cli@latest build -p android --profile development
```

## 빌드 구분

| 목적 | 명령 |
| --- | --- |
| 개발 중 빠른 확인 | `npx expo start` |
| 개발용 네이티브 기능 테스트 | `npx eas-cli@latest build -p android --profile development` |
| 제출·내부 테스트용 APK | `npx eas-cli@latest build -p android --profile preview` |
| 스토어 배포 준비 | `npx eas-cli@latest build -p android --profile production` |

> Preview/Production APK에서 AI 기능까지 사용하려면 API Routes를 별도 공개 배포하고, 앱 요청 주소를 해당 API 주소로 연결해야 합니다. OpenAI 키는 항상 서버 환경 변수로만 관리해야 합니다.

## 보안과 데이터

- Firebase 보안 규칙으로 로그인한 사용자는 자신의 학습 기록과 프로필만 읽고 쓸 수 있습니다.
- AI 요청은 Firebase ID 토큰으로 사용자별 제한을 적용합니다.
- 네트워크가 불안정할 때 학습 기록·오늘의 문장·프로필 설정은 기기에 저장 대기 후 재연결 시 동기화합니다.
- OpenAI API 키와 기타 비밀값은 클라이언트 코드 및 GitHub에 포함하지 않습니다.

## 정책 문서

- [개인정보처리방침](https://pixel32383.github.io/gentalk-native/privacy-policy.html)
- [서비스 이용약관](https://pixel32383.github.io/gentalk-native/terms-of-service.html)

## 확인 항목

```bash
npx tsc --noEmit
npx expo export -p android
```

---

개인 프로젝트 · GENTALK
