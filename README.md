# Trivia Multiplayer Quiz

실시간 친구와 퀴즈 대결을 할 수 있는 멀티플레이어 퀴즈 게임

## 기술 스택

- **Frontend**: React 18, Socket.io-client, React Router v6
- **Backend**: Node.js, Express, Socket.io, Firebase Admin SDK
- **Database**: Firebase Realtime Database
- **External API**: Open Trivia Database API
- **DevOps**: Docker, Docker Compose, AWS ECR/App Runner

## 프로젝트 구조

```
trivia-multiplayer/
├── frontend/          # React 앱
├── backend/           # Node.js 서버
├── docker-compose.yml
└── 기획서.md
```

## 로컬 개발 환경 설정

### 1. 환경 변수 설정

Backend `.env` 파일 생성:
```bash
cd backend
cp .env.example .env
# .env 파일을 열어서 Firebase 설정 추가
```

Frontend `.env` 파일 생성:
```bash
cd frontend
cp .env.example .env
```

### 2. 개별 실행

**Backend 실행:**
```bash
cd backend
npm install
npm run dev
```

**Frontend 실행:**
```bash
cd frontend
npm install
npm start
```

### 3. Docker Compose로 실행

```bash
docker-compose up
```

## 접속 정보

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Backend Health Check: http://localhost:3000/health

## 주요 기능

- 실시간 1:1 또는 다중 플레이어 퀴즈 대결
- 카테고리별 랭킹 시스템
- 친구 매칭 및 방 생성 기능
- 점수 계산 시스템 (시간 보너스 + 난이도 배수)

## 개발 진행 상황

- [x] 프로젝트 구조 생성
- [x] Backend 기본 설정
- [x] Frontend 기본 설정
- [ ] Firebase 연동
- [ ] 퀴즈 게임 로직
- [ ] 랭킹 시스템
- [ ] 배포 설정

## 라이선스

ISC
