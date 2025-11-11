# EC2 배포 가이드

## 사전 준비사항

### 1. AWS 설정

#### ECR Repository 생성
```bash
# Backend repository
aws ecr create-repository --repository-name trivia-backend --region ap-northeast-2

# Frontend repository
aws ecr create-repository --repository-name trivia-frontend --region ap-northeast-2
```

#### EC2 인스턴스 요구사항
- **인스턴스 타입**: t2.small 이상 (메모리 2GB+)
- **OS**: Amazon Linux 2 또는 Ubuntu 20.04+
- **보안 그룹**:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 3000 (Backend API)
- **IAM Role**: ECR 접근 권한 필요

#### EC2에 Docker 설치
```bash
# Amazon Linux 2
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Ubuntu
sudo apt-get update
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

#### EC2에 AWS CLI 설치 (ECR 로그인용)
```bash
# Amazon Linux 2 (보통 기본 설치됨)
sudo yum install -y aws-cli

# Ubuntu
sudo apt-get install -y awscli
```

### 2. GitHub Secrets 설정

GitHub 저장소 > Settings > Secrets and variables > Actions 에서 다음 secrets 추가:

#### AWS 관련
- `AWS_ACCESS_KEY_ID`: AWS IAM 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 시크릿 키
- `AWS_REGION`: 리전 (예: `ap-northeast-2`)

#### EC2 관련
- `EC2_HOST`: EC2 인스턴스 Public IP 또는 도메인
- `EC2_USER`: SSH 사용자명 (Amazon Linux: `ec2-user`, Ubuntu: `ubuntu`)
- `EC2_SSH_KEY`: EC2 SSH private key 전체 내용 (PEM 파일)

#### Firebase 관련
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_PRIVATE_KEY`: Firebase private key (따옴표 포함)
- `FIREBASE_CLIENT_EMAIL`: Firebase client email
- `FIREBASE_DATABASE_URL`: Firebase Realtime Database URL

#### 애플리케이션 관련
- `FRONTEND_URL`: 프론트엔드 URL (예: `http://your-ec2-ip`)
- `REACT_APP_API_URL`: 백엔드 API URL (예: `http://your-ec2-ip:3000`)
- `REACT_APP_SOCKET_URL`: Socket.io URL (예: `http://your-ec2-ip:3000`)

## 배포 방법

### 자동 배포 (GitHub Actions)

1. **코드 푸시**
   ```bash
   git add .
   git commit -m "Deploy to EC2"
   git push origin main
   ```

2. **배포 확인**
   - GitHub > Actions 탭에서 워크플로우 진행 상황 확인
   - 성공 시 EC2에 자동 배포됨

3. **배포된 앱 확인**
   - Frontend: `http://your-ec2-ip`
   - Backend: `http://your-ec2-ip:3000/health`

### 수동 배포

#### Backend
```bash
# 1. ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

# 2. 이미지 빌드 및 푸시
cd backend
docker build -t trivia-backend .
docker tag trivia-backend:latest YOUR_ECR_URI/trivia-backend:latest
docker push YOUR_ECR_URI/trivia-backend:latest

# 3. EC2에서 실행
ssh -i your-key.pem ec2-user@your-ec2-ip

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

# 컨테이너 실행
docker pull YOUR_ECR_URI/trivia-backend:latest
docker stop trivia-backend || true
docker rm trivia-backend || true
docker run -d \
  --name trivia-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e FRONTEND_URL=http://your-ec2-ip \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -e FIREBASE_PRIVATE_KEY="your-private-key" \
  -e FIREBASE_CLIENT_EMAIL=your-client-email \
  -e FIREBASE_DATABASE_URL=your-database-url \
  --restart unless-stopped \
  YOUR_ECR_URI/trivia-backend:latest
```

#### Frontend
```bash
# 1. 이미지 빌드 및 푸시
cd frontend
docker build \
  --build-arg REACT_APP_API_URL=http://your-ec2-ip:3000 \
  --build-arg REACT_APP_SOCKET_URL=http://your-ec2-ip:3000 \
  -t trivia-frontend .
docker tag trivia-frontend:latest YOUR_ECR_URI/trivia-frontend:latest
docker push YOUR_ECR_URI/trivia-frontend:latest

# 2. EC2에서 실행
docker pull YOUR_ECR_URI/trivia-frontend:latest
docker stop trivia-frontend || true
docker rm trivia-frontend || true
docker run -d \
  --name trivia-frontend \
  -p 80:80 \
  --restart unless-stopped \
  YOUR_ECR_URI/trivia-frontend:latest
```

## 로그 확인

```bash
# Backend 로그
docker logs -f trivia-backend

# Frontend 로그
docker logs -f trivia-frontend

# 실시간 로그 스트리밍
docker logs --tail 100 -f trivia-backend
```

## 컨테이너 관리

```bash
# 컨테이너 상태 확인
docker ps

# 컨테이너 중지
docker stop trivia-backend trivia-frontend

# 컨테이너 재시작
docker restart trivia-backend trivia-frontend

# 컨테이너 삭제
docker rm -f trivia-backend trivia-frontend

# 이미지 정리
docker image prune -f
```

## 트러블슈팅

### 문제 1: ECR 로그인 실패
```bash
# IAM 권한 확인
aws sts get-caller-identity

# ECR 권한 확인
aws ecr describe-repositories
```

### 문제 2: 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker logs trivia-backend

# 환경 변수 확인
docker inspect trivia-backend | grep Env
```

### 문제 3: Firebase 연결 실패
- `FIREBASE_PRIVATE_KEY`에 따옴표가 제대로 있는지 확인
- `\n` 문자가 올바르게 이스케이프되었는지 확인

### 문제 4: CORS 에러
- `FRONTEND_URL` 환경 변수가 올바른지 확인
- EC2 보안 그룹에서 포트가 열려있는지 확인

## 도메인 연결 (선택사항)

### 1. Route 53 설정
```bash
# A 레코드 추가
your-domain.com -> EC2 Public IP
```

### 2. HTTPS 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo amazon-linux-extras install epel -y
sudo yum install -y certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com

# Nginx 설정 업데이트 (frontend/nginx.conf)
# SSL 인증서 경로 추가
```

## 모니터링

### CloudWatch 설정
```bash
# CloudWatch Agent 설치
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

### 헬스 체크
```bash
# Backend health
curl http://your-ec2-ip:3000/health

# Frontend health
curl http://your-ec2-ip
```

## 비용 최적화

- **t2.small**: 월 약 $15-20 (메모리 2GB)
- **ECR**: 500MB까지 무료, 이후 GB당 $0.10/월
- **데이터 전송**: 100GB까지 무료

## 다음 단계

- [ ] Load Balancer 설정 (고가용성)
- [ ] Auto Scaling 그룹 설정
- [ ] CloudFront CDN 연결 (글로벌 배포)
- [ ] RDS 또는 DynamoDB 연결 (현재는 Firebase 사용)
- [ ] ElastiCache 추가 (캐싱)
