# Trivia Multiplayer Quiz

<div align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
  <img src="https://img.shields.io/badge/Firebase-13.6.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white"/>
</div>

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [기술 스택](#-기술-스택)
- [주요 기능](#-주요-기능)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 환경 설정](#-개발-환경-설정)
- [배포](#-배포)

## 🎮 프로젝트 소개

실시간으로 친구와 퀴즈 대결을 할 수 있는 멀티플레이어 퀴즈 게임입니다.<br>
Socket.io를 활용한 실시간 통신과 Firebase Realtime Database를 통한 랭킹 시스템을 제공합니다.

## 🛠 기술 스택

### Frontend
- **Framework**: React 19.2.0
- **Routing**: React Router 7.9.5
- **Real-time**: Socket.io-client 4.8.1
- **HTTP Client**: Axios 1.13.2

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express 5.1.0
- **Real-time**: Socket.io 4.8.1
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Admin SDK 13.6.0

### External API
- **Quiz Data**: Open Trivia Database API (https://opentdb.com)

### Infrastructure
- **Container**: Docker
- **Registry**: AWS ECR
- **Compute**: AWS EC2
- **Deployment**: GitHub Actions

## ✨ 주요 기능

### 🎯 게임 시스템
- 실시간 멀티플레이어 퀴즈 대결
- 카테고리 및 난이도 선택
- 공개방/비공개방 생성
- 점수 계산 (정답 여부 + 응답 시간)

### 👥 방 관리
- 방 생성 및 참가
- 준비 시스템
- 최대 인원 설정 (2~10명)

### 🏆 랭킹 시스템
- 전체 랭킹 조회
- 사용자별 점수 누적
- Firebase Realtime Database 기반

### 🔐 인증
- 닉네임 기반 간단 로그인
- Firebase Auth 연동

## 📁 프로젝트 구조

```
trivia-multi-quiz/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── services/        # API & Socket 서비스
│   │   ├── utils/           # 유틸리티 함수
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   ├── services/        # 비즈니스 로직
│   │   ├── socket/          # Socket.io 핸들러
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
├── MANUAL_DEPLOYMENT.md     # 수동 배포 가이드
└── AUTO_DEPLOYMENT.md       # 자동 배포 가이드
```

## 🛠 개발 환경 설정

### 필수 요구사항

- Node.js 20.x 이상
- npm 또는 yarn

### 환경 변수 설정

**Backend `.env`**:
```bash
# Server
NODE_ENV=development
PORT=3000

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# External API
TRIVIA_API_URL=https://opentdb.com/api.php
```

**Frontend `.env`**:
```bash
# Backend API
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
```

### 로컬 실행

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

### Docker Compose 실행

```bash
docker-compose up
```

### 접속 정보

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 🚀 배포

### 배포 환경

| 환경   | URL                     | 배포 방식 |
|--------|-------------------------|-----------|
| 개발   | localhost:3000 / :3001  | 로컬      |
| 프로덕션 | http://3.37.187.170     | AWS EC2   |

### 배포 아키텍처

```
GitHub → GitHub Actions → Docker Build → ECR → EC2
                                                ↓
사용자 → ALB → EC2 (Frontend:80, Backend:3000)
```

### AWS EC2 배포

**인프라 구성**:
- **ECR**: 2개 리포지토리 (trivia-backend, trivia-frontend)
- **EC2**: Ubuntu, Docker 설치
- **포트**: 80 (Frontend), 3000 (Backend), 22 (SSH)

**배포 방법**:

1. **수동 배포**: [MANUAL_DEPLOYMENT.md](MANUAL_DEPLOYMENT.md) 참조
2. **자동 배포**: [AUTO_DEPLOYMENT.md](AUTO_DEPLOYMENT.md) 참조

**GitHub Secrets 설정** (자동 배포 시 필요):
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
EC2_HOST
EC2_USER
EC2_PASSWORD
FRONTEND_URL
REACT_APP_API_URL
REACT_APP_SOCKET_URL
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_DATABASE_URL
```

### 배포 명령어

```bash
# 수동 배포 (EC2 접속 후)
# Backend
cd /home/edu08
aws ecr get-login-password --region ap-northeast-2 | sudo docker login --username AWS --password-stdin 796973519343.dkr.ecr.ap-northeast-2.amazonaws.com
sudo docker pull 796973519343.dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
sudo docker stop trivia-backend || true
sudo docker rm trivia-backend || true
sudo docker run -d --name trivia-backend -p 3000:3000 --env-file backend.env --restart unless-stopped 796973519343.dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest

# Frontend
sudo docker pull 796973519343.dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
sudo docker stop trivia-frontend || true
sudo docker rm trivia-frontend || true
sudo docker run -d --name trivia-frontend -p 80:80 --restart unless-stopped 796973519343.dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest

# 자동 배포
# GitHub → Actions → "Deploy Backend/Frontend to EC2" → Run workflow
```

## 📚 API 문서

### REST API

- `GET /health` - Health check
- `GET /api/rooms` - 공개방 목록 조회
- `GET /api/rankings/overall` - 전체 랭킹 조회

### Socket.io Events

**Client → Server**:
- `room:create` - 방 생성
- `room:join` - 방 참가
- `room:leave` - 방 떠나기
- `room:ready` - 준비 상태 변경
- `game:start` - 게임 시작
- `game:answer` - 답변 제출

**Server → Client**:
- `room:created` - 방 생성 완료
- `room:joined` - 방 참가 완료
- `room:player_joined` - 플레이어 입장
- `room:player_left` - 플레이어 퇴장
- `game:started` - 게임 시작
- `game:question` - 문제 출제
- `game:scores` - 점수 업데이트
- `game:finished` - 게임 종료

---

<div align="center">
  <sub>Built with ❤️</sub>
</div>
