# Trivia Quiz - 자동 배포 가이드 (GitHub Actions)

이 문서는 GitHub Actions를 사용하여 Trivia Quiz 애플리케이션을 자동으로 배포하는 방법을 설명합니다.

## 목차
1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [GitHub Secrets 설정](#github-secrets-설정)
4. [Workflow 파일 설명](#workflow-파일-설명)
5. [배포 테스트](#배포-테스트)
6. [문제 해결](#문제-해결)

---

## 개요

### 자동 배포 동작 방식

1. **트리거**: `main` 또는 `master` 브랜치에 코드 푸시 시 자동 실행
2. **파일 변경 감지**:
   - `backend/**` 파일 변경 시 → 백엔드만 배포
   - `frontend/**` 파일 변경 시 → 프론트엔드만 배포
3. **배포 과정**:
   - GitHub Actions에서 Docker 이미지 빌드
   - AWS ECR에 이미지 푸시
   - EC2에 SSH 접속하여 컨테이너 재시작

### Workflow 파일 위치

```
.github/
└── workflows/
    ├── deploy-backend.yml    # 백엔드 자동 배포
    └── deploy-frontend.yml   # 프론트엔드 자동 배포
```

---

## 사전 요구사항

자동 배포를 설정하기 전에 다음 작업이 완료되어야 합니다:

### 1. 수동 배포 성공

먼저 `MANUAL_DEPLOYMENT.md`를 따라 수동 배포가 정상적으로 작동하는지 확인해야 합니다:
- ECR 리포지토리 생성 완료
- EC2 인스턴스 설정 완료 (Docker, AWS CLI 설치)
- IAM 역할 설정 완료
- 수동 배포 테스트 성공

### 2. GitHub 리포지토리

프로젝트가 GitHub 리포지토리에 푸시되어 있어야 합니다.

### 3. EC2 SSH 키

EC2 인스턴스에 접속할 수 있는 SSH 프라이빗 키가 필요합니다.

---

## GitHub Secrets 설정

GitHub 리포지토리의 Settings → Secrets and variables → Actions에서 다음 Secrets를 추가합니다.

### 필수 Secrets 목록

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM 사용자 액세스 키 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 사용자 시크릿 키 | `wJalrXUtnFEMI/K7MDENG/...` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `EC2_HOST` | EC2 퍼블릭 IP 주소 | `3.37.187.170` |
| `EC2_USER` | EC2 SSH 사용자명 | `ubuntu` 또는 `edu08` |
| `EC2_SSH_KEY` | EC2 SSH 프라이빗 키 전체 내용 | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `FRONTEND_URL` | 프론트엔드 URL | `http://3.37.187.170` |
| `REACT_APP_API_URL` | 백엔드 API URL | `http://3.37.187.170:3000` |
| `REACT_APP_SOCKET_URL` | Socket.io 서버 URL | `http://3.37.187.170:3000` |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | `trivia-multiplayer-quiz` |
| `FIREBASE_CLIENT_EMAIL` | Firebase 클라이언트 이메일 | `firebase-adminsdk-...` |
| `FIREBASE_PRIVATE_KEY` | Firebase 프라이빗 키 | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_DATABASE_URL` | Firebase DB URL | `https://trivia-....firebasedatabase.app` |

### Secrets 설정 방법

#### 1. AWS 관련 Secrets

**AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY:**

IAM 사용자를 생성하고 액세스 키를 발급받습니다.

```
필요한 권한:
- AmazonEC2ContainerRegistryPowerUser (ECR 푸시 권한)
```

IAM 콘솔에서:
1. IAM → Users → Add user
2. 프로그래밍 방식 액세스 선택
3. 권한 정책 연결: `AmazonEC2ContainerRegistryPowerUser`
4. 생성된 Access Key ID와 Secret Access Key를 복사

**AWS_REGION:**
```
ap-northeast-2
```

#### 2. EC2 관련 Secrets

**EC2_HOST:**
```
3.37.187.170
```
EC2 퍼블릭 IP 주소를 입력합니다.

**EC2_USER:**
```
ubuntu
```
또는 사용 중인 EC2 사용자명 (예: `edu08`)

**EC2_SSH_KEY:**

EC2 인스턴스 생성 시 다운로드한 `.pem` 파일의 전체 내용을 복사합니다.

Windows에서:
```bash
notepad your-key.pem
```

Linux/Mac에서:
```bash
cat your-key.pem
```

전체 내용을 복사하여 붙여넣습니다:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(여러 줄)
...
-----END RSA PRIVATE KEY-----
```

**중요**: 키의 시작과 끝 줄(`-----BEGIN...`, `-----END...`)을 포함하여 전체를 복사해야 합니다.

#### 3. 애플리케이션 관련 Secrets

**FRONTEND_URL:**
```
http://3.37.187.170
```

**REACT_APP_API_URL:**
```
http://3.37.187.170:3000
```

**REACT_APP_SOCKET_URL:**
```
http://3.37.187.170:3000
```

#### 4. Firebase 관련 Secrets

Firebase Console에서 서비스 계정 키를 다운로드한 JSON 파일의 내용을 사용합니다.

**FIREBASE_PROJECT_ID:**
```json
"project_id": "trivia-multiplayer-quiz"
```

**FIREBASE_CLIENT_EMAIL:**
```json
"client_email": "firebase-adminsdk-fbsvc@trivia-multiplayer-quiz.iam.gserviceaccount.com"
```

**FIREBASE_PRIVATE_KEY:**

JSON 파일의 `private_key` 값을 복사합니다. 줄바꿈(`\n`)이 포함된 전체 키를 그대로 복사해야 합니다.

```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhk...\n-----END PRIVATE KEY-----\n"
```

**중요**: `\n` 문자가 실제 줄바꿈으로 변환되지 않도록 주의해야 합니다. 문자열 그대로 복사합니다.

**FIREBASE_DATABASE_URL:**
```json
"https://trivia-multiplayer-quiz-default-rtdb.asia-southeast1.firebasedatabase.app"
```

---

## Workflow 파일 설명

### 백엔드 Workflow (deploy-backend.yml)

```yaml
name: Deploy Backend to EC2

on:
  push:
    branches: [main, master]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # 1. 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v3

      # 2. AWS 인증 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      # 3. ECR 로그인
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      # 4. Docker 이미지 빌드 및 푸시
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: trivia-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # 5. EC2에 배포
      - name: Deploy to EC2
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
          # ... 기타 환경 변수
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          envs: ECR_REGISTRY,AWS_REGION,...
          script: |
            # ECR 로그인
            aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

            # 최신 이미지 풀
            sudo docker pull $ECR_REGISTRY/trivia-backend:latest

            # 기존 컨테이너 중지 및 삭제
            sudo docker stop trivia-backend || true
            sudo docker rm trivia-backend || true

            # 새 컨테이너 실행
            sudo docker run -d \
              --name trivia-backend \
              -p 3000:3000 \
              -e NODE_ENV=production \
              -e FIREBASE_PRIVATE_KEY=$'$FIREBASE_PRIVATE_KEY' \
              # ... 기타 환경 변수
              --restart unless-stopped \
              $ECR_REGISTRY/trivia-backend:latest

            # 사용하지 않는 이미지 정리
            sudo docker image prune -f
```

**주요 특징:**
- `backend/**` 경로의 파일이 변경될 때만 실행
- Commit SHA를 이미지 태그로 사용 (버전 관리)
- `latest` 태그도 함께 생성
- Firebase Private Key는 `$'...'` 구문으로 처리

### 프론트엔드 Workflow (deploy-frontend.yml)

```yaml
name: Deploy Frontend to EC2

on:
  push:
    branches: [main, master]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # 1-3. 백엔드와 동일

      # 4. Docker 이미지 빌드 및 푸시 (환경 변수 포함)
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: trivia-frontend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd frontend
          docker build \
            --build-arg REACT_APP_API_URL=${{ secrets.REACT_APP_API_URL }} \
            --build-arg REACT_APP_SOCKET_URL=${{ secrets.REACT_APP_SOCKET_URL }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build \
            --build-arg REACT_APP_API_URL=${{ secrets.REACT_APP_API_URL }} \
            --build-arg REACT_APP_SOCKET_URL=${{ secrets.REACT_APP_SOCKET_URL }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # 5. EC2에 배포 (환경 변수 없음)
      - name: Deploy to EC2
        # ... 백엔드와 유사하지만 환경 변수 설정 불필요
```

**주요 특징:**
- `frontend/**` 경로의 파일이 변경될 때만 실행
- 빌드 시 React 환경 변수(`--build-arg`) 주입
- 런타임 환경 변수는 불필요 (빌드 시점에 포함됨)

---

## 배포 테스트

### 1. 초기 설정 검증

GitHub Secrets가 모두 올바르게 설정되었는지 확인합니다.

리포지토리 Settings → Secrets and variables → Actions에서 14개의 Secret이 모두 등록되어 있어야 합니다.

### 2. 백엔드 배포 테스트

백엔드 코드를 수정하고 푸시합니다:

```bash
# 백엔드 코드 수정 (예: README 추가)
echo "# Backend" > backend/README.md

# Git 커밋 및 푸시
git add backend/README.md
git commit -m "test: backend deployment"
git push origin main
```

### 3. Actions 로그 확인

1. GitHub 리포지토리 → Actions 탭 이동
2. "Deploy Backend to EC2" workflow 실행 확인
3. 각 단계의 로그 확인:
   - ✅ Checkout code
   - ✅ Configure AWS credentials
   - ✅ Login to Amazon ECR
   - ✅ Build, tag, and push image
   - ✅ Deploy to EC2

### 4. 배포 결과 확인

브라우저에서 접속하여 정상 작동 확인:
```
http://[EC2_IP]:3000/api/rooms
```

### 5. 프론트엔드 배포 테스트

프론트엔드 코드를 수정하고 푸시합니다:

```bash
# 프론트엔드 코드 수정
echo "# Frontend" > frontend/README.md

# Git 커밋 및 푸시
git add frontend/README.md
git commit -m "test: frontend deployment"
git push origin main
```

Actions에서 "Deploy Frontend to EC2" workflow 실행 확인 후, 브라우저에서 접속:
```
http://[EC2_IP]
```

---

## 문제 해결

### Workflow가 실행되지 않음

**원인:**
- Workflow 파일에 문법 오류가 있음
- 트리거 조건이 맞지 않음 (브랜치, 경로)

**해결:**
1. YAML 문법 검증: https://www.yamllint.com/
2. 브랜치 이름 확인: `main` 또는 `master`
3. 변경된 파일 경로 확인: `backend/**` 또는 `frontend/**`

### AWS 인증 실패

**증상:**
```
Error: Could not load credentials from any providers
```

**해결:**
1. GitHub Secrets에 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 확인
2. IAM 사용자 권한 확인: `AmazonEC2ContainerRegistryPowerUser`
3. 리전 확인: `AWS_REGION=ap-northeast-2`

### ECR 로그인 실패

**증상:**
```
Error: Cannot perform an interactive login from a non TTY device
```

**해결:**
`aws-actions/amazon-ecr-login@v1` 액션이 올바르게 설정되었는지 확인

### EC2 SSH 연결 실패

**증상:**
```
ssh: connect to host XX.XX.XX.XX port 22: Connection timed out
```

**해결:**
1. EC2 보안그룹에 포트 22 (SSH)가 열려있는지 확인
2. EC2 퍼블릭 IP가 변경되지 않았는지 확인
3. `EC2_SSH_KEY` Secret이 올바른 프라이빗 키인지 확인
4. `EC2_USER` 확인 (Ubuntu AMI는 `ubuntu`, Amazon Linux는 `ec2-user`)

### Docker pull/run 실패 (EC2)

**증상:**
```
Error response from daemon: pull access denied
```

**해결:**
1. EC2에 IAM 역할이 연결되어 있는지 확인
2. IAM 역할에 `AmazonEC2ContainerRegistryReadOnly` 권한 확인
3. ECR 리포지토리 이름 확인: `trivia-backend`, `trivia-frontend`

### Firebase 연결 실패

**증상:**
- 백엔드 로그: "Failed to initialize Firebase"
- 백엔드 로그: "Failed to parse private key"

**해결:**
1. `FIREBASE_PRIVATE_KEY` Secret 확인:
   - `\n` 문자가 포함된 전체 문자열
   - 시작: `-----BEGIN PRIVATE KEY-----\n`
   - 종료: `\n-----END PRIVATE KEY-----\n`
2. Workflow에서 `$'$FIREBASE_PRIVATE_KEY'` 구문 사용 확인
3. 다른 Firebase Secrets도 올바른지 확인

### 프론트엔드 API 호출 실패

**증상:**
- 브라우저 콘솔: "Failed to fetch"
- 네트워크 탭: 404 또는 CORS 에러

**해결:**
1. `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL` Secret 확인
2. 프론트엔드 빌드 시 `--build-arg` 로 환경 변수가 주입되는지 확인
3. EC2 보안그룹에 포트 3000이 열려있는지 확인

---

## Actions 로그 확인 방법

### 1. 로그 접근

GitHub 리포지토리 → Actions → 실행된 Workflow 클릭

### 2. 각 단계 로그 보기

- 단계 이름 클릭하여 상세 로그 확인
- 에러가 발생한 단계의 로그를 자세히 읽기

### 3. 유용한 로그 정보

**빌드 단계:**
```
Step 5/10 : RUN npm install
 ---> Running in abc123def456
added 500 packages in 30s
```

**푸시 단계:**
```
latest: digest: sha256:abc123... size: 2000
```

**SSH 배포 단계:**
```
Login Succeeded
latest: Pulling from trivia-backend
Digest: sha256:abc123...
Status: Downloaded newer image
```

---

## 배포 프로세스 최적화

### 1. 캐시 활용

Docker 빌드 캐시를 활용하여 빌드 속도 향상:

```yaml
- name: Build and push
  run: |
    docker build --cache-from $ECR_REGISTRY/$ECR_REPOSITORY:latest \
                 -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
```

### 2. 병렬 배포

백엔드와 프론트엔드를 동시에 수정한 경우 두 Workflow가 병렬로 실행됩니다.

### 3. 배포 알림

Slack이나 Discord로 배포 알림을 받을 수 있습니다 (선택사항):

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 롤백 방법

배포 후 문제가 발생한 경우 이전 버전으로 롤백할 수 있습니다.

### 1. 이미지 태그 확인

ECR에서 이전 이미지 태그 확인:

```bash
aws ecr describe-images --repository-name trivia-backend --region ap-northeast-2
```

### 2. EC2에서 이전 버전 실행

```bash
# SSH로 EC2 접속
ssh -i your-key.pem ubuntu@[EC2_IP]

# 이전 이미지 풀
sudo docker pull [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:[이전_SHA]

# 현재 컨테이너 중지
sudo docker stop trivia-backend
sudo docker rm trivia-backend

# 이전 버전 실행
sudo docker run -d \
  --name trivia-backend \
  -p 3000:3000 \
  -e ... \
  [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/trivia-backend:[이전_SHA]
```

### 3. Git 롤백 (선택사항)

코드 레벨에서 롤백:

```bash
git revert [커밋_SHA]
git push origin main
```

새로운 Workflow가 자동으로 실행되어 이전 코드로 재배포됩니다.

---

## 보안 고려사항

### 1. Secrets 관리

- **절대 Secrets를 코드에 포함하지 마세요**
- GitHub Secrets는 암호화되어 저장됩니다
- Actions 로그에 Secrets가 노출되면 자동으로 마스킹됩니다

### 2. IAM 최소 권한

IAM 사용자에게 필요한 최소한의 권한만 부여:
```
- AmazonEC2ContainerRegistryPowerUser (ECR 푸시)
```

EC2 IAM 역할:
```
- AmazonEC2ContainerRegistryReadOnly (ECR 풀)
```

### 3. SSH 키 보호

- EC2 SSH 프라이빗 키는 GitHub Secrets에만 저장
- 절대 공개 리포지토리에 업로드하지 마세요
- 정기적으로 키 로테이션 수행

### 4. 환경 분리

프로덕션과 개발 환경을 분리하려면:

1. 브랜치별 배포 설정:
   ```yaml
   on:
     push:
       branches: [main]  # 프로덕션
   ```

   ```yaml
   on:
     push:
       branches: [develop]  # 개발
   ```

2. 환경별 Secrets 설정:
   - `PROD_EC2_HOST`
   - `DEV_EC2_HOST`

---

## 모니터링 및 알림

### 1. GitHub Actions 상태 뱃지

README에 배포 상태 뱃지 추가:

```markdown
![Backend Deploy](https://github.com/your-username/trivia-quiz/workflows/Deploy%20Backend%20to%20EC2/badge.svg)
![Frontend Deploy](https://github.com/your-username/trivia-quiz/workflows/Deploy%20Frontend%20to%20EC2/badge.svg)
```

### 2. 배포 이력 확인

GitHub Actions 탭에서 모든 배포 이력을 확인할 수 있습니다:
- 언제 배포했는지
- 누가 배포했는지
- 어떤 커밋이 배포되었는지
- 성공/실패 여부

### 3. EC2 모니터링

CloudWatch를 통해 EC2 리소스 모니터링:
- CPU 사용률
- 메모리 사용률
- 네트워크 트래픽

---

## 비용 최적화

### GitHub Actions 무료 사용량

- Public 리포지토리: 무제한 무료
- Private 리포지토리: 월 2,000분 무료

### ECR 스토리지

- 이미지 보관 용량에 따라 과금
- 오래된 이미지 정기 삭제 권장:
  ```bash
  # 30일 이상 된 이미지 삭제
  aws ecr batch-delete-image \
    --repository-name trivia-backend \
    --image-ids imageDigest=[다이제스트]
  ```

---

## 다음 단계

자동 배포가 설정되었다면:

1. **테스트 자동화**: GitHub Actions에 테스트 단계 추가
2. **Blue-Green 배포**: 무중단 배포 설정
3. **도메인 연결**: Route 53으로 도메인 설정
4. **HTTPS 설정**: ACM 인증서 및 ALB 구성
5. **모니터링 강화**: CloudWatch 대시보드 및 알람 설정

---

## 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS ECR 문서](https://docs.aws.amazon.com/ecr/)
- [Docker 문서](https://docs.docker.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 문의 및 지원

배포 과정에서 문제가 발생하면:
1. Actions 로그 확인
2. EC2 컨테이너 로그 확인: `sudo docker logs trivia-backend`
3. 수동 배포 가이드 참조: `MANUAL_DEPLOYMENT.md`
