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
| `preview-unlimited` | AI 횟수 제한을 끌 수 있는 전용 테스트 | APK |
| `production` | 스토어 배포 준비 | 기본 AAB |

```bash
npx eas-cli@latest build -p android --profile development
npx eas-cli@latest build -p android --profile preview
npx eas-cli@latest build -p android --profile production
```

위 세 명령 중 목적에 맞는 하나만 실행합니다. 현재 EAS 프로젝트로 빌드하려면 해당 Expo 계정·팀 접근 권한이 필요합니다.

Preview APK의 화면 코드는 앱에 포함되며, AI 단어 생성·회화·피드백·음성 인식 확인은 EAS Hosting의 공개 서버 `https://gentalk-pixel3238.expo.app`을 호출합니다. `app.json`의 `expo-router` 플러그인 `origin`에 서버 주소가 설정되어 있습니다. 개발용 APK에서는 기존처럼 현재 개발 서버를 이용합니다.

### 공개 AI API 배포

EAS 프로젝트의 `production` 환경에 다음 서버 변수를 등록합니다. OpenAI 키에는 `EXPO_PUBLIC_` 접두사를 붙이지 않습니다.

| 변수 | EAS 표시 설정 | 용도 |
| --- | --- | --- |
| `OPENAI_API_KEY` | Sensitive | 서버에서만 사용하는 OpenAI 키 |
| `OPENAI_MODEL` | Plain text | AI 모델 (`gpt-4.1-mini`) |
| `FIREBASE_PROJECT_ID` | Plain text | Firebase 프로젝트 (`gentalk-595d2`) |
| `AI_RATE_LIMIT_ENABLED` | Plain text | `true`; 배포 서버는 항상 요청 제한 적용 |

EAS Hosting은 `Sensitive` 변수를 지원하며, EAS의 `Secret` 표시 설정은 Hosting에서 지원하지 않습니다. 변수 값은 EAS 대시보드에서 관리하고 Git에 저장하지 않습니다.

서버 코드나 AI 규칙을 수정한 뒤 다음 두 명령으로 배포합니다.

```bash
npx expo export --platform web --output-dir .expo/hosting
npx eas-cli@latest deploy --export-dir .expo/hosting --environment production --prod
```

같은 공개 주소의 서버 코드·환경 변수만 변경할 때는 APK를 다시 만들 필요가 없습니다. 서버 주소 또는 앱 화면 코드를 변경한 경우에는 Preview APK를 다시 빌드합니다. 기존에 서버 주소가 없었던 APK는 새 APK로 업데이트해야 합니다. GitHub에 코드를 올리는 것만으로 AI API가 배포되지는 않습니다.

### AI 한도 해제 테스트 APK

제한을 켠 경우 계정별 하루 한도는 단어 생성 20회, 회화·음성 인식 확인 합계 200회, 피드백 20회, 전체 240회이며, 분당 한도는 8회입니다. 서버의 `ai-rate-limit.ts`와 `firestore.rules`를 같은 수치로 유지해야 합니다. 날짜 한도는 현재 UTC 날짜 기준입니다.

한도를 바꾼 경우 일반 서버와 테스트 서버를 각각 재배포하고 Firestore 규칙도 함께 배포합니다. 서버 주소가 그대로라면 기존 APK에도 새 한도가 적용됩니다.

```bash
npx firebase-tools@latest deploy --only firestore:rules --project gentalk-595d2
```

`preview-unlimited` 프로필은 `app.config.js`에서 API 주소를 `https://gentalk-pixel3238--unlimited.expo.app`으로 변경하고, 처음 실행할 때 앱 자체 요청 횟수 제한을 끕니다. 일반 `preview`의 주소와 제한 설정은 유지합니다. 프로필 → 앱 정보 → 왼쪽 위 i 아이콘을 5번 누르면 요청 제한을 다시 켜거나 끌 수 있으며, 테스트 APK의 설정은 별도로 저장됩니다. OpenAI 계정 자체의 사용 한도와 과금은 그대로 적용됩니다.

전용 서버는 EAS `preview` 환경의 서버 변수와 `ALLOW_PREVIEW_RATE_LIMIT_BYPASS=true`를 사용합니다. 이 변수는 일반 서버의 `production` 환경에 설정하지 않습니다. 제한을 끄더라도 Firebase 토큰과 사용자 경로 소유권 검사는 유지합니다.

```bash
npx expo export --platform web --output-dir .expo/hosting
npx eas-cli@latest deploy --export-dir .expo/hosting --environment preview --alias unlimited
npx eas-cli@latest build -p android --profile preview-unlimited --non-interactive --no-wait
```

빌드는 접수 후 종료하며, 완료 시 EAS 빌드 페이지에서 APK를 다운로드할 수 있습니다.

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
