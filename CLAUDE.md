# Holdem Trainer Web - 프로젝트 컨텍스트

## 한 줄 정의
홀덤 입문자가 듀오링고 스타일 스킬 트리로 프리플랍 의사결정을 학습하는 웹앱

## 기술 스택
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Google OAuth)
- Vercel 배포 예정

## 프로젝트 구조
```
holdem-trainer-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 전역 레이아웃 (다크 테마, Geist 폰트)
│   │   ├── page.tsx                # 메인 앱 오케스트레이터 (탭/학습/연습 전체 연결)
│   │   ├── login/page.tsx          # 구글 로그인 페이지
│   │   └── auth/callback/route.ts  # OAuth 콜백 핸들러
│   ├── middleware.ts               # 인증 미들웨어 (비로그인 → /login 리다이렉트)
│   ├── lib/
│   │   ├── supabase-browser.ts     # 브라우저 Supabase 클라이언트
│   │   └── supabase-server.ts      # 서버 Supabase 클라이언트
│   ├── hooks/
│   │   ├── useUser.ts              # 인증 상태 + signOut
│   │   ├── useProgress.ts          # 레슨 진행 CRUD (crown, accuracy, attempts)
│   │   ├── useXP.ts                # XP 읽기/쓰기 + 레벨 계산
│   │   ├── useStats.ts             # 자유연습 모드별 통계
│   │   ├── useDailyGoal.ts         # 일일 핸드 수 목표
│   │   └── useWrongNotes.ts        # 오답 노트 CRUD
│   ├── data/
│   │   ├── constants.ts            # RANKS, SUITS, POSITION_INFO, Card 타입
│   │   ├── ranges.ts               # RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES
│   │   └── skill-tree.ts           # SKILL_TREE (12유닛), XP_LEVELS, Scenario/Lesson/Unit 타입
│   ├── utils/
│   │   ├── hand.ts                 # getHandNotation, generateHand, generateHandFromNotation
│   │   ├── correct-action.ts       # getCorrectAction_RFI/Facing/Vs3bet
│   │   ├── board.ts                # generateFlop, analyzeBoardTexture, evaluateHandStrength
│   │   ├── scenario.ts             # generateRfiScenarios (경계선 핸드 가중치)
│   │   └── markdown.ts             # mdToHtml (공략집용)
│   └── components/
│       ├── TabBar.tsx              # 학습/자유연습 탭 전환
│       ├── XPBar.tsx               # XP 레벨 프로그레스 바
│       ├── DailyGoal.tsx           # 일일 목표 프로그레스
│       ├── GuideOverlay.tsx        # 공략집 풀스크린 뷰어 (초급/중급/고급)
│       ├── ui/                     # shadcn/ui 컴포넌트 (button, progress, dialog)
│       ├── learn/
│       │   ├── SkillTree.tsx       # 12유닛 스킬 트리 (그룹, 커넥터, 크라운)
│       │   ├── GuideCard.tsx       # 레슨 시작 가이드 카드
│       │   ├── LessonQuiz.tsx      # 퀴즈 (진행바+하트+시나리오+피드백)
│       │   └── LessonResult.tsx    # 결과/보상 화면 (XP, 다음레슨)
│       ├── practice/
│       │   └── PracticeTab.tsx     # 자유연습 4모드 전체
│       └── modals/
│           ├── WrongNotesModal.tsx  # 오답 노트 모달 + 복습 드릴
│           └── GlossaryModal.tsx   # 홀덤 용어사전 모달
├── public/docs/                    # 공략집 마크다운 파일 (초급/중급/고급)
├── supabase/migrations/001_initial.sql  # 6개 테이블 + RLS
├── docs/                           # 기획 문서 (PRD, 로드맵 등)
├── index.html                      # 레거시 단일 HTML 파일 (백업)
└── .env.local                      # Supabase 환경 변수
```

## Supabase 테이블
| 테이블 | 용도 | Unique Key |
|--------|------|------------|
| profiles | 유저 프로필 (auth.users 연동) | id (PK) |
| lesson_progress | 레슨 진행 (crown, accuracy) | user_id, lesson_id |
| user_xp | XP 누적 | user_id (PK) |
| practice_stats | 자유연습 모드별 통계 | user_id, mode |
| daily_hands | 일일 핸드 수 | user_id, date |
| wrong_notes | 오답 기록 (최근 20개) | - |

## 트레이닝 모드
1. **RFI** — 포지션별 오픈 레이즈 판단
2. **Facing RFI** — 상대 오픈 대응 (3bet/call/fold)
3. **vs 3bet** — 3벳 받았을 때 대응 (4bet/call/fold)
4. **C-bet** — 플랍에서 C벳/체크 판단

## 앱 구조
- **학습 탭**: 스킬 트리 → 가이드 카드 → 레슨 퀴즈 → 결과/보상
- **자유연습 탭**: 4모드 자유 연습
- **공략집**: 풀스크린 MD 뷰어 (초급/중급/고급)
- **용어사전**: 홀덤 용어 모달

## 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 주요 명령어
```bash
cd ~/Desktop/PARA/10.Project/holdem-trainer-web
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npx next build       # 빌드 검증
```

## 배포 현황
- 배포: Vercel 예정 (Supabase 프로젝트 생성 후)
- 레거시: index.html은 백업으로 유지

## 작업 이력
| 날짜 | 작업 | 상태 |
|------|------|------|
| 2025-01-25 | 프로토타입 (4모드 기본 기능, 단일 HTML) | 완료 |
| 2025-02-08 | 학습 로드맵 + PRD 문서 작성 | 완료 |
| 2025-02-08 | Phase 0: localStorage, 일일목표, 오답노트, 학습모드 | 완료 |
| 2026-02-08 | 공략집 3편 작성 + 앱 내 뷰어 | 완료 |
| 2026-02-08 | Phase 1: 스킬 트리 + 레슨 시스템 | 완료 |
| 2026-02-08 | Next.js + Supabase 마이그레이션 (전체 앱 포팅) | 완료 |
