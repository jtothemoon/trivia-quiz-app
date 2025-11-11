# Trivia Quiz - 수동 배포 가이드

이 문서는 Trivia Quiz 애플리케이션을 AWS EC2에 수동으로 배포하는 전체 과정을 설명합니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [AWS 환경 설정](#aws-환경-설정)
3. [EC2 초기 설정](#ec2-초기-설정)
4. [로컬 환경 설정](#로컬-환경-설정)
5. [애플리케이션 배포](#애플리케이션-배포)
6. [검증 및 문제 해결](#검증-및-문제-해결)

---

## 사전 요구사항

### 필수 도구
- AWS 계정
- AWS CLI (로컬 머신)
- Docker (로컬 머신)
- Git
- SSH 클라이언트

### 필수 정보
- Firebase 프로젝트 인증 정보
  - Project ID
  - Client Email
  - Private Key
  - Database URL

---

## AWS 환경 설정

### 1. ECR 리포지토리 생성

AWS Console에서 ECR 리포지토리 2개를 생성합니다.

**백엔드 리포지토리:**
```
이름: trivia-backend
리전: ap-northeast-2 (서울)
```

**프론트엔드 리포지토리:**
```
이름: trivia-frontend
리전: ap-northeast-2 (서울)
```

생성 후 리포지토리 URI를 기록합니다:
```
백엔드: [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend
프론트엔드: [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend
```

### 2. EC2 인스턴스 설정

**인스턴스 사양:**
- AMI: Ubuntu Server 20.04 LTS 이상
- 인스턴스 타입: t2.small 이상 권장
- 스토리지: 20GB 이상

### 3. 보안그룹 설정

EC2 인스턴스의 보안그룹에 다음 인바운드 규칙을 추가합니다:

| 유형 | 프로토콜 | 포트 범위 | 소스 |
|------|----------|-----------|------|
| SSH | TCP | 22 | 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 |

### 4. IAM 역할 설정

EC2가 ECR에 접근할 수 있도록 IAM 역할을 생성하고 연결합니다.

**역할 생성:**
1. IAM 콘솔에서 새 역할 생성
2. 신뢰할 수 있는 엔터티: AWS 서비스 → EC2
3. 권한 정책: `AmazonEC2ContainerRegistryReadOnly`
4. 역할 이름: `EC2-ECR-Role`

**EC2에 역할 연결:**
1. EC2 인스턴스 선택
2. 작업 → 보안 → IAM 역할 수정
3. 생성한 역할 선택 및 저장

---

## EC2 초기 설정

EC2 인스턴스에 SSH로 접속한 후 다음 작업을 수행합니다.

### 1. 시스템 업데이트

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Docker 설치

```bash
# Docker 설치에 필요한 패키지 설치
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker 리포지토리 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker 설치 확인
sudo docker --version
```

**선택사항: 사용자를 docker 그룹에 추가 (sudo 없이 docker 실행)**
```bash
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인 필요
```

### 3. AWS CLI 설치

```bash
# AWS CLI v2 다운로드
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# unzip 설치 (없는 경우)
sudo apt-get install -y unzip

# 압축 해제 및 설치
unzip awscliv2.zip
sudo ./aws/install

# 설치 확인
aws --version
```

### 4. ECR 로그인 (EC2에서)

```bash
aws ecr get-login-password --region ap-northeast-2 | sudo docker login --username AWS --password-stdin [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com
```

---

## 로컬 환경 설정

### 1. AWS CLI 설정

로컬 머신에서 AWS CLI를 설정합니다.

```bash
aws configure --profile ec2-account
```

다음 정보를 입력합니다:
- AWS Access Key ID: [액세스 키]
- AWS Secret Access Key: [시크릿 키]
- Default region name: ap-northeast-2
- Default output format: json

### 2. ECR 로그인 (로컬에서)

```bash
aws ecr get-login-password --region ap-northeast-2 --profile ec2-account | docker login --username AWS --password-stdin [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com
```

---

## 애플리케이션 배포

### 백엔드 배포

#### 1. 로컬에서 Docker 이미지 빌드

```bash
cd backend

docker build -t trivia-backend .
```

#### 2. 이미지 태그 지정

```bash
docker tag trivia-backend:latest [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
```

#### 3. ECR에 푸시

```bash
docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
```

#### 4. EC2에서 컨테이너 실행

SSH로 EC2에 접속한 후:

```bash
# 이미지 풀
sudo docker pull [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest

# 기존 컨테이너 중지 및 삭제 (재배포 시)
sudo docker stop trivia-backend
sudo docker rm trivia-backend

# 컨테이너 실행
sudo docker run -d \
  --name trivia-backend \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e FRONTEND_URL=http://[EC2_PUBLIC_IP] \
  -e FIREBASE_PROJECT_ID="trivia-multiplayer-quiz" \
  -e FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@trivia-multiplayer-quiz.iam.gserviceaccount.com" \
  -e FIREBASE_PRIVATE_KEY=$'-----BEGIN PRIVATE KEY-----\n[전체 Private Key]\n-----END PRIVATE KEY-----\n' \
  -e FIREBASE_DATABASE_URL="https://trivia-multiplayer-quiz-default-rtdb.asia-southeast1.firebasedatabase.app" \
  [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
```

**중요: FIREBASE_PRIVATE_KEY 설정**
- `$'...'` 구문을 사용해야 줄바꿈(\n)이 제대로 처리됩니다
- 전체 Private Key를 한 줄로 입력해야 합니다

#### 5. 백엔드 로그 확인

```bash
sudo docker logs trivia-backend

# 실시간 로그 확인
sudo docker logs -f trivia-backend
```

정상 동작 시 다음과 같은 로그가 보여야 합니다:
```
✅ Firebase initialized successfully
🚀 Server running on port 3000
```

---

### 프론트엔드 배포

#### 1. 로컬에서 Docker 이미지 빌드

```bash
cd frontend

docker build \
  --build-arg REACT_APP_API_URL=http://[EC2_PUBLIC_IP]:3000 \
  --build-arg REACT_APP_SOCKET_URL=http://[EC2_PUBLIC_IP]:3000 \
  -t trivia-frontend . \
  --no-cache
```

**중요: --no-cache 플래그**
- React 환경 변수 변경 시 캐시를 사용하지 않고 새로 빌드해야 합니다

#### 2. 이미지 태그 지정

```bash
docker tag trivia-frontend:latest [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
```

#### 3. ECR에 푸시

```bash
docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
```

#### 4. EC2에서 컨테이너 실행

SSH로 EC2에 접속한 후:

```bash
# 이미지 풀
sudo docker pull [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest

# 기존 컨테이너 중지 및 삭제 (재배포 시)
sudo docker stop trivia-frontend
sudo docker rm trivia-frontend

# 컨테이너 실행
sudo docker run -d \
  --name trivia-frontend \
  -p 80:80 \
  --restart unless-stopped \
  [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
```

#### 5. 프론트엔드 로그 확인

```bash
sudo docker logs trivia-frontend

# 실시간 로그 확인
sudo docker logs -f trivia-frontend
```

---

## 검증 및 문제 해결

### 배포 검증

#### 1. 백엔드 API 테스트

브라우저 또는 curl로 테스트:
```bash
curl http://[EC2_PUBLIC_IP]:3000/api/rooms
```

예상 응답:
```json
{
  "success": true,
  "data": []
}
```

#### 2. 프론트엔드 접속 테스트

브라우저에서 접속:
```
http://[EC2_PUBLIC_IP]
```

정상 동작 확인:
- 닉네임 입력 화면이 표시되어야 합니다
- 방 만들기, 공개방 목록, 랭킹 탭이 작동해야 합니다

#### 3. 전체 기능 테스트

1. 닉네임 입력
2. 방 생성
3. 다른 브라우저/기기에서 방 참가
4. 게임 진행
5. 랭킹 확인

---

### 문제 해결

#### 백엔드 연결 실패

**증상:**
- 프론트엔드에서 "Failed to fetch rooms" 오류
- CORS 에러

**해결:**
1. EC2 보안그룹에 포트 3000이 열려있는지 확인
2. 백엔드 컨테이너가 실행 중인지 확인:
   ```bash
   sudo docker ps
   ```
3. 백엔드 로그 확인:
   ```bash
   sudo docker logs trivia-backend
   ```

#### Firebase 연결 실패

**증상:**
- 백엔드 로그에 "Failed to initialize Firebase" 에러
- "Failed to parse private key" 에러

**해결:**
1. FIREBASE_PRIVATE_KEY가 `$'...'` 구문으로 설정되었는지 확인
2. Private Key에 `\n` 문자가 포함되어 있는지 확인
3. 모든 Firebase 환경 변수가 올바르게 설정되었는지 확인

#### 프론트엔드 API 호출 실패 (모바일)

**증상:**
- PC에서는 작동하지만 모바일에서 방 목록이 보이지 않음

**해결:**
1. 프론트엔드 빌드 시 올바른 EC2 IP로 환경 변수가 설정되었는지 확인
2. `--no-cache` 플래그를 사용하여 재빌드
3. 브라우저 캐시 삭제 후 테스트

#### 컨테이너 자동 재시작

모든 컨테이너는 `--restart unless-stopped` 옵션으로 실행되므로:
- EC2 재부팅 시 자동으로 컨테이너가 시작됩니다
- 컨테이너 크래시 시 자동으로 재시작됩니다

---

### 유용한 Docker 명령어

```bash
# 실행 중인 컨테이너 확인
sudo docker ps

# 모든 컨테이너 확인 (중지된 것 포함)
sudo docker ps -a

# 컨테이너 로그 확인
sudo docker logs [컨테이너명]

# 실시간 로그 확인
sudo docker logs -f [컨테이너명]

# 컨테이너 내부 접속
sudo docker exec -it [컨테이너명] /bin/bash

# 컨테이너 중지
sudo docker stop [컨테이너명]

# 컨테이너 삭제
sudo docker rm [컨테이너명]

# 이미지 삭제
sudo docker rmi [이미지명]

# 사용하지 않는 이미지 정리
sudo docker image prune -a
```

---

## 재배포 프로세스

코드 변경 후 재배포하는 경우:

### 백엔드 재배포

```bash
# 로컬에서
cd backend
docker build -t trivia-backend .
docker tag trivia-backend:latest [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest

# EC2에서
sudo docker pull [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
sudo docker stop trivia-backend
sudo docker rm trivia-backend
sudo docker run -d --name trivia-backend -p 3000:3000 --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e FRONTEND_URL=http://[EC2_PUBLIC_IP] \
  -e FIREBASE_PROJECT_ID="trivia-multiplayer-quiz" \
  -e FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@trivia-multiplayer-quiz.iam.gserviceaccount.com" \
  -e FIREBASE_PRIVATE_KEY=$'[전체 Private Key]' \
  -e FIREBASE_DATABASE_URL="https://trivia-multiplayer-quiz-default-rtdb.asia-southeast1.firebasedatabase.app" \
  [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:latest
```

### 프론트엔드 재배포

```bash
# 로컬에서
cd frontend
docker build \
  --build-arg REACT_APP_API_URL=http://[EC2_PUBLIC_IP]:3000 \
  --build-arg REACT_APP_SOCKET_URL=http://[EC2_PUBLIC_IP]:3000 \
  -t trivia-frontend . \
  --no-cache
docker tag trivia-frontend:latest [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest

# EC2에서
sudo docker pull [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
sudo docker stop trivia-frontend
sudo docker rm trivia-frontend
sudo docker run -d --name trivia-frontend -p 80:80 --restart unless-stopped \
  [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-frontend:latest
```

---

## 참고 사항

### 비용 고려사항
- ECR: 이미지 저장 용량에 따라 과금
- EC2: 인스턴스 실행 시간에 따라 과금
- 데이터 전송: 아웃바운드 트래픽에 대해 과금

### 보안 권장사항
1. EC2 보안그룹을 최소 권한으로 설정
2. IAM 역할 사용 (액세스 키 대신)
3. Firebase Private Key를 환경 변수로만 관리
4. 정기적인 보안 업데이트 적용

### 모니터링
- CloudWatch를 통한 EC2 모니터링
- Docker 로그를 통한 애플리케이션 모니터링
- Firebase Console을 통한 데이터베이스 모니터링

---

## 다음 단계

자동 배포를 설정하려면 `AUTO_DEPLOYMENT.md`를 참고하세요.
