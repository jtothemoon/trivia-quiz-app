# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `trivia-multiplayer-quiz`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Realtime Database 활성화

1. Firebase Console 왼쪽 메뉴에서 **"빌드" > "Realtime Database"** 클릭
2. "데이터베이스 만들기" 클릭
3. 위치 선택 (예: `asia-southeast1`)
4. 보안 규칙 설정:
   - **테스트 모드**로 시작 (개발 단계)
   - 나중에 보안 규칙 적용 필요

### 보안 규칙 설정

Realtime Database > 규칙 탭에서 다음과 같이 설정:

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": true,
        ".write": true
      }
    },
    "rankings": {
      ".read": true,
      ".write": true
    },
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    },
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**주의**: 위 규칙은 개발용입니다. 프로덕션에서는 더 엄격한 규칙 필요!

## 3. 서비스 계정 키 발급

1. Firebase Console > **프로젝트 설정** (톱니바퀴 아이콘)
2. **서비스 계정** 탭 클릭
3. **새 비공개 키 생성** 클릭
4. JSON 파일 다운로드 (예: `serviceAccountKey.json`)

다운로드한 파일을 절대 Git에 커밋하지 마세요!

## 4. 환경 변수 설정

### 방법 1: .env 파일 사용 (로컬 개발)

`backend/.env` 파일 생성:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
TRIVIA_API_URL=https://opentdb.com/api.php

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
```

**서비스 계정 JSON에서 값 복사하는 방법:**

다운로드한 `serviceAccountKey.json` 파일을 열면:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

여기서:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (따옴표로 감싸기!)

**Database URL 찾기:**
- Firebase Console > Realtime Database > 데이터 탭
- 상단에 URL이 표시됨 (예: `https://xxx.firebaseio.com` 또는 `https://xxx.asia-southeast1.firebasedatabase.app`)

### 방법 2: Docker Compose 사용

루트 디렉토리에 `.env` 파일 생성:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
```

그리고 다음 명령어로 실행:
```bash
docker-compose up
```

## 5. Firebase 연동 테스트

서버를 실행하면 다음 메시지가 표시되어야 합니다:

```
✅ Firebase initialized successfully
✅ Firebase Realtime Database connected
🚀 Server is running on port 3000
```

만약 에러가 발생하면:
- 환경 변수가 올바르게 설정되었는지 확인
- `FIREBASE_PRIVATE_KEY`에 따옴표가 있는지 확인
- Database URL이 정확한지 확인

## 6. 데이터 구조 확인

Firebase Console > Realtime Database > 데이터 탭에서 다음 구조가 자동으로 생성됩니다:

```
/
├── users/
├── rankings/
│   ├── overall/
│   ├── categories/
│   └── weekly/
├── games/
└── rooms/
```

## 트러블슈팅

### 문제 1: "Firebase initialization error"
- 환경 변수 확인
- serviceAccountKey.json 파일 확인

### 문제 2: "PERMISSION_DENIED"
- Realtime Database 보안 규칙 확인
- 테스트 모드로 변경

### 문제 3: "Invalid private key"
- `FIREBASE_PRIVATE_KEY` 값에 따옴표가 있는지 확인
- `\n` 줄바꿈 문자가 포함되어 있는지 확인

## 다음 단계

Firebase 설정이 완료되면:
1. ✅ 사용자 등록/조회 기능 구현
2. ✅ 게임 결과 저장 기능 구현
3. ✅ 랭킹 시스템 구현
