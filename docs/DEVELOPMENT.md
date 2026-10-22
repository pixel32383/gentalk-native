# GENTALK 개발·실행 가이드

[프로젝트 소개로 돌아가기](../README.md)

## 개발 환경

- Node.js 24, npm, Git
- Android 실기기와 GENTALK 개발용 APK
- Firebase Authentication·Firestore·Storage가 설정된 프로젝트
- 서버에서 사용할 OpenAI API 키

Expo SDK 57을 사용합니다. 패키지나 기기 기능을 변경할 때는 [SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)를 확인하세요.

## 설치와 환경 변수

```bash
git clone https://github.com/pixel32383/gentalk-native.git
cd gentalk-native
npm ci
```

Windows PowerShell에서 환경 변수 예시를 복사합니다. 기존 `.env`가 있다면 그대로 사용합니다.

```powershell
Copy-Item .env.example .env
```

`.env`를 열어 `OPENAI_API_KEY`를 채웁니다.

| 변수 | 용도 |
| --- | --- |
| `OPENAI_API_KEY` | 서버에서 OpenAI 요청에 사용하는 비밀 키 |
| `OPENAI_MODEL` | 단어·회화·피드백 생성 모델. 현재 코드 기본값은 `gpt-4.1-mini` |
| `FIREBASE_PROJECT_ID` | 서버 요청 제한에서 사용할 Firebase 프로젝트 ID |
| `AI_RATE_LIMIT_ENABLED` | 개발 환경 요청 제한. 기본값 `true`, 로컬 테스트 중 `false`로 변경 가능 |

환경 변수를 바꾸면 개발 서버를 재시작합니다. 비밀 키에 `EXPO_PUBLIC_` 접두사를 붙이지 않습니다. `.env`와 환경별 `.env.*`는 Git에서 제외되며, 값이 없는 `.env.example`만 공유합니다.

## Firebase 연결

현재 저장소에는 GENTALK 프로젝트의 Firebase 클라이언트 설정이 포함되어 있습니다. 다른 프로젝트로 복제해 실행한다면 다음 설정을 함께 맞춰야 합니다.

| 파일·설정 | 확인 내용 |
| --- | --- |
| `src/firebase/firebase.ts` | Firebase 웹 앱 설정 |
| `google-services.json` | Firebase Console에서 내려받은 Android 앱 설정 |
| `src/firebase/auth.ts` | Google 로그인용 웹 클라이언트 ID |
| `app.json` | Android 패키지 이름과 EAS 프로젝트 연결 정보 |
| `.firebaserc`, `.env` | Firebase 배포 대상과 `FIREBASE_PROJECT_ID` |

Firebase Console에서 Google·익명 인증 제공업체를 활성화하고 Android 서명 지문을 등록합니다. 프로필 사진을 사용하려면 Storage 버킷 설정도 필요합니다. 보안 규칙은 `firestore.rules`, `storage.rules`에서 관리합니다.

Firebase 클라이언트 설정에는 앱 식별용 값이 포함됩니다. 서비스 계정의 개인 키, 서명 키, OpenAI 키는 저장소에 추가하지 않습니다.

## 개발 서버 연결

개발용 APK를 설치한 휴대폰과 컴퓨터를 같은 네트워크에 연결합니다.

```bash
npx expo start --dev-client
```

포트를 지정하려면 다음처럼 실행합니다.

```bash
npx expo start --dev-client --port 8082
```

같은 네트워크에서 연결하기 어려울 때는 터널을 사용할 수 있습니다. 터널 서비스 상태에 따라 연결이 실패할 수 있습니다.

```bash
npx expo start --dev-client --tunnel
```

패키지 변경 후 이전 코드가 남아 있다면 캐시를 초기화합니다.

```bash
npx expo start --dev-client --clear
```

Google 로그인과 음성 인식은 추가 네이티브 모듈을 사용합니다. Expo Go 대신 해당 모듈이 포함된 개발용 APK로 확인합니다. 화면·문구·정렬 변경은 개발 서버에서 반영되며, 네이티브 모듈이나 플러그인 설정을 변경하면 개발용 APK를 다시 빌드해야 합니다.

## Android 빌드

빌드 프로필은 [`eas.json`](../eas.json)에 정의되어 있습니다.

| 프로필 | 용도 | Android 결과물 |
| --- | --- | --- |
| `development` | 개발 서버와 연결해 기능 확인 | 개발용 APK |
| `preview` | 제출·내부 테스트 | APK |
| `production` | 스토어 배포 준비 | 기본 AAB |

```bash
npx eas-cli@latest build -p android --profile development
npx eas-cli@latest build -p android --profile preview
npx eas-cli@latest build -p android --profile production
```

위 세 명령 중 목적에 맞는 하나만 실행합니다. 현재 EAS 프로젝트로 빌드하려면 해당 Expo 계정·팀 접근 권한이 필요합니다.

Preview APK의 화면 코드는 앱에 포함되지만, AI 단어 생성·회화·피드백은 별도 서버를 호출합니다. 현재 앱은 `/api/...` 상대 경로를 사용하므로 제출 전 공개 API 배포와 앱의 서버 주소 연결을 구성해야 합니다. 서버 키는 배포 환경의 비밀 환경 변수에 등록합니다. GitHub에 코드를 올리는 것만으로 AI API가 배포되지는 않습니다.

## 코드를 수정할 위치

| 수정 목적 | 파일·폴더 |
| --- | --- |
| 앱 상태·화면 전환 | `src/app/index.tsx` |
| 탭별 화면 | `src/screens/` |
| 단어·게임·회화·피드백·타임라인 | `src/learning/` |
| Staff 대화 규칙·최소 답변 횟수·종료 조건 | `src/services/server/conversation-rules.ts` |
| 피드백 기준·교정 내용·추천 표현 | `src/services/server/feedback-rules.ts` |
| 사용자별 AI 요청 제한 | `src/services/server/ai-rate-limit.ts` |
| 앱에서 보내는 API 요청 | `src/services/learning-api.ts` |
| 오늘의 문장 선정·월별 완료 상태·알림 | `src/services/daily-sentence-plan.ts`, `daily-sentence-status.ts`, `notifications.ts` |
| 음성 속도·목소리 선택 | `src/services/voice-settings.ts` |
| 계정별 데이터·오프라인 동기화 | `src/firebase/`, `src/services/pending-sync.ts`, `merge-cached-records.ts` |
| 표시 언어·지원 언어 | `src/data/translations.ts`, `src/data/languages.ts` |

## 검증

```bash
npx tsc --noEmit
npm test
npx expo export --platform android
```

- 타입 검사는 파일 간 연결과 타입 오류를 확인합니다.
- 현재 자동 테스트는 서버·캐시·미전송 저장 및 삭제 기록의 병합을 확인합니다.
- Android 내보내기는 JavaScript·에셋 번들 생성 확인이며 APK 생성이나 실기기 검증을 대신하지 않습니다.
- `lint` 스크립트는 남아 있지만 ESLint 설정이 구성되어 있지 않아 현재 필수 검증에 포함하지 않습니다.

## 제출 전 실기기 확인

- 첫 실행·온보딩·Google 로그인·게스트 모드
- 상황 입력부터 단어·게임·회화·피드백·복습까지의 흐름
- 마이크·듣기·음성 속도 변경·키보드 열기와 닫기
- 학습 기록 및 오늘의 문장 저장·삭제·월별 완료 상태
- 계정 전환, 오프라인 저장 후 재연결, 앱 재실행
- 알림 예약·알림을 눌렀을 때의 화면 이동
- 컴퓨터 개발 서버를 끈 상태에서 최종 Preview APK의 AI 학습

오늘의 문장은 14일치 로컬 알림을 예약하고 앱을 열 때 갱신합니다. 기존 기록의 기기 캐시를 이용한 복습과 새 AI 요청의 인터넷 필요 여부를 구분해서 확인합니다.
