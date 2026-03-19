# Startup Meeting Room

AI 캐릭터들과 함께하는 화상회의 스타일 의사결정 시뮬레이터.

주제를 던지면 AI가 회의를 세팅하고, 다양한 역할의 캐릭터들이 각자 관점에서 토론합니다.
유저는 원하는 역할을 선택해서 회의에 참여하고, 회의 후에는 다관점 평가 리포트를 받습니다.

## Quick Start

### 필요한 것

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Claude Code** CLI (`npm install -g @anthropic-ai/claude-code` → `claude login`)

### 설치 & 실행

```bash
git clone https://github.com/hiyong7759/startup-meeting.git
cd startup-meeting
pnpm install
pnpm dev:all
```

브라우저에서 `http://localhost:5173` 접속.

`pnpm dev:all`은 두 서버를 동시에 띄웁니다:
- `:5173` — React 웹앱 (Vite)
- `:3001` — LLM 프록시 서버 (Claude CLI 연동)

> 따로 띄우고 싶으면: `pnpm server` (프록시) + `pnpm dev` (웹앱)

### Claude Code가 없는 경우 (BYOK 모드)

Claude CLI 없이도 Anthropic API 키로 사용 가능합니다.

1. `pnpm dev:all` 실행
2. 브라우저에서 Settings 페이지 진입
3. API Key에 `sk-ant-...` 입력 + Save
4. Server URL은 `http://localhost:3001` 그대로

## 사용법

### 1. 새 회의 시작

메인 화면에서 "새 회의 시작" 클릭.

### 2. 주제 선택

세 가지 방법:
- **직접 입력**: "마케팅 예산을 50% 줄여야 할 것 같아" 같은 자유 주제
- **등급 선택**: 일상 / 전략 / 위기 중 택 1 → AI가 랜덤 생성
- **가챠**: 랜덤 등급 + 히든 보너스 (티켓 1장 소모)

### 3. 맥락 질문

AI가 주제에 맞는 2~3개 질문을 합니다. 답변하면 회의가 구성됩니다.

### 4. 역할 선택

AI가 5~7명의 참석자를 선별합니다. 그 중 하나를 클릭해서 내 역할로 선택.

역할에 따라 경험이 달라집니다:
- **CEO**: 최종 결정권, 모든 지표 열람
- **실무자**: 전문성 기반 제안, 상위자가 결정
- **인턴**: 무시당할 수 있지만 가끔 인정받는 쾌감

### 5. 회의 진행

- 왼쪽: 대화 스트림 (실시간 스트리밍)
- 오른쪽: 참석자 카드 (발언자 하이라이트)
- 하단: 발언 입력 + 이모지 반응 (+1, -1, ..., !?) + 넘기기

AI 캐릭터들이 순서대로 발언하고, 내 차례에 텍스트를 입력하면 됩니다.

### 6. 회의 종료 → 결과

"End Meeting" 버튼 클릭 시:
- **회의록**: 안건, 참석자, 주요 발언 요약, 결정사항, 액션 아이템
- **평가 리포트**: 내가 본 관점 / 놓친 관점, 역할별 점수, 예상 결과, "다른 역할이었다면?"
- **보상**: XP, 레벨업, 캐릭터 카드 드롭, 업적 해금

### 7. PLAN Export

결과 화면에서 "Copy PLAN" 또는 "Download PLAN" 클릭.
회의 결과가 구조화된 Markdown으로 출력됩니다.

이걸 Claude Code에 붙여넣으면 회의 결과 기반으로 PRD/코드/테스트를 자동 생성할 수 있습니다.

## 프로젝트 구조

```
startup-meeting/
├── packages/
│   ├── types/          — 공유 타입 정의
│   ├── engine/         — 게임 로직 (역할, 가챠, XP, 이벤트)
│   └── composer/       — LLM 호출 (세팅, 회의 대화, 평가, export)
├── adapters/
│   ├── web/            — React 웹앱 (프론트엔드)
│   ├── server/         — 로컬 LLM 프록시 (CLI/API 듀얼)
│   ├── worker/         — Cloudflare Worker (배포용 프록시)
│   └── kakao/          — 카카오톡 어댑터 (레거시, 후순위)
└── scripts/
```

### 엔진/어댑터 분리

`packages/`는 UI에 의존하지 않습니다. 엔진과 컴포저만 가져다 쓰면 어떤 UI든 붙일 수 있습니다.

```typescript
import { getAllRoles, pullGacha } from '@startup-meeting/engine';
import { generateMeetingSetup, streamCharacterUtterance } from '@startup-meeting/composer';
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19, Vite, TailwindCSS v4, Framer Motion, Zustand |
| LLM | Claude (Haiku: 회의 대화, Sonnet: 세팅/평가) |
| Proxy (로컬) | Node.js + Hono + Claude CLI subprocess |
| Proxy (배포) | Cloudflare Workers |
| Storage | localStorage (MVP) |

## 배포 (Cloudflare Worker + Vercel)

### 1. Worker 배포

```bash
cd adapters/worker
npx wrangler login
npx wrangler deploy
```

배포 후 `wrangler.toml`의 `ALLOWED_ORIGINS`에 Vercel URL 추가.

### 2. Vercel 배포

```bash
cd adapters/web
npx vercel
```

### 3. 접속

배포된 URL 접속 → Settings → Server URL에 Worker URL 입력 + API Key 입력.

## LLM 비용

1회 회의 기준 약 $0.09 (약 120원):
- 세팅 맥락질문 (Haiku): ~$0.005
- 회의 구성 (Sonnet): ~$0.02
- 회의 대화 5명x4턴 (Haiku): ~$0.04
- 평가 리포트 (Sonnet): ~$0.03

CLI 모드(Claude Code 구독)에서는 별도 API 비용 없음.

## 데이터

| 데이터 | 수량 |
|--------|------|
| 역할 프로필 | 30개 (경영진 6, 관리자 6, 실무 12, 주니어 6) |
| 가챠 주제 | 44개 (일상 20, 전략 12, 위기 7, 레전더리 5) |
| 업적 | 14개 |
| 이벤트 | 20개 |

## License

MIT
