# Afterwon - AI 데이터 시각화 툴

AI를 활용하여 데이터를 차트와 그래프로 시각화하는 웹 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 접속

### 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
afterwon/
├── public/
│   └── fonts/          # 폰트 파일들
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트들
│   ├── pages/         # 페이지 컴포넌트들
│   ├── styles/        # 스타일 파일들
│   ├── utils/         # 유틸리티 함수들
│   ├── hooks/         # 커스텀 React 훅들
│   ├── context/       # React Context API
│   ├── services/      # API 호출 및 외부 서비스
│   ├── types/         # TypeScript 타입 정의들
│   ├── App.tsx        # 메인 App 컴포넌트
│   ├── main.tsx       # 애플리케이션 진입점
│   └── App.css        # 메인 스타일
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 폰트 설정

프로젝트에서 사용하는 폰트:
- **HelveticaNeueHeavy.otf**: 로고 및 제목용
- **HelveticaNeueLight.otf**: 메뉴 및 본문용

폰트 파일을 `public/fonts/` 폴더에 추가해주세요.

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3
- **Fonts**: Helvetica Neue (Heavy, Light)

## 📱 반응형 디자인

모바일, 태블릿, 데스크톱 환경을 모두 지원합니다.

## 🔧 개발

### 코드 스타일
- TypeScript 사용
- 함수형 컴포넌트 및 React Hooks 활용
- CSS 모듈화

### 주요 컴포넌트
- `Topbar`: 상단 네비게이션 바
- `App`: 메인 애플리케이션 컴포넌트

## 📄 라이선스

ISC License 