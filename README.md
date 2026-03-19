# Startup Meeting Room

AI 캐릭터들과 함께하는 화상회의 스타일 의사결정 시뮬레이터.

주제를 던지면 AI가 회의를 세팅하고, 다양한 역할의 캐릭터들이 각자 관점에서 토론합니다.
유저는 원하는 역할을 선택해서 회의에 참여하고, 회의 후에는 다관점 평가 리포트를 받습니다.

## Quick Start

### 필요한 것

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Claude Code** + Claude Pro/Max 구독

### Claude Code 설치 & 로그인

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

Claude Pro($20/월) 또는 Max($100/월) 구독 계정으로 로그인하세요.
프록시 서버가 `claude` CLI를 통해 LLM을 호출하므로 별도 API 키나 과금이 없습니다.

> `claude --version` 이 동작하면 준비 완료.

### 설치 & 실행

```bash
git clone https://github.com/hiyong7759/startup-meeting.git
cd startup-meeting
pnpm install
pnpm dev:all
```

브라우저에서 `http://localhost:5173` 접속.

`pnpm dev:all`은 두 서버를 동시에 띄웁니다:
- `:5173` — React 웹앱
- `:3001` — LLM 프록시 서버 (Claude CLI 연동)

## 사용법

### 1. 새 회의 시작

메인 화면에서 "새 회의 시작" 클릭.

### 2. 주제 선택

- **직접 입력**: "마케팅 예산을 50% 줄여야 할 것 같아" 같은 자유 주제
- **등급 선택**: 일상 / 전략 / 위기 중 택 1
- **가챠**: 랜덤 등급 + 히든 보너스

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
- 하단: 발언 입력 + 이모지 반응 + 넘기기

### 6. 회의 종료 → 결과

"End Meeting" 클릭 시:
- **회의록**: 안건, 참석자, 주요 발언, 결정사항, 액션 아이템
- **평가 리포트**: 본 관점 / 놓친 관점, 점수, 예상 결과, "다른 역할이었다면?"
- **보상**: XP, 레벨업, 캐릭터 카드 드롭, 업적

### 7. PLAN Export

결과 화면에서 "Copy PLAN" 또는 "Download PLAN" 클릭.
회의 결과를 Claude Code에 붙여넣으면 PRD/코드/테스트를 자동 생성할 수 있습니다.

## 프로젝트 구조

```
startup-meeting/
├── packages/
│   ├── types/          — 공유 타입 정의
│   ├── engine/         — 게임 로직 (역할, 가챠, XP, 이벤트)
│   └── composer/       — LLM 호출 (세팅, 회의 대화, 평가, export)
├── adapters/
│   ├── web/            — React 웹앱
│   └── server/         — LLM 프록시 (Claude CLI 연동)
└── scripts/
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19, Vite, TailwindCSS v4, Framer Motion, Zustand |
| LLM | Claude Haiku (회의 대화), Claude Sonnet (세팅/평가) |
| Proxy | Node.js + Hono + Claude CLI subprocess |
| Storage | localStorage |

## License

MIT
