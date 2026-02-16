# QA 체크리스트 — 피드백 반영 (2026-02-16)

## 빌드 상태
- [x] `npm run build` 성공 (TypeScript 에러 없음, 12페이지 생성)

## 브라우저 자동 테스트 결과

| 시나리오 | 결과 | 스크린샷 | 비고 |
|---------|------|---------|------|
| 로그인 페이지 로드 | PASS | `docs/screenshots/01-login.png` | 200 OK, 정상 렌더링 |
| 온보딩 퀴즈 시작 | PASS | `docs/screenshots/03-onboarding-quiz.png` | 정상 진입 |
| 정답 피드백 톤 확인 | PASS | `docs/screenshots/05-correct-answer-feedback.png` | "좋은 판단이에요" 표시 |
| 자동 넘김 제거 확인 | PASS | `docs/screenshots/06-no-auto-advance.png` | 4초 후에도 같은 화면 유지 |
| 오답 피드백 톤 확인 | PASS | `docs/screenshots/07-wrong-answer-feedback.png` | "이번엔 아쉽네요" 표시 |

- 콘솔 에러: **0개**
- 총 **5개** 시나리오 중 **5개** 통과

> 자유연습, 스킬트리, 봇 대전은 로그인 필요 → 코드 정적 검증으로 대체

## 핵심 플로우 체크리스트 (코드 레벨 검증)

### Step 1: UX 버그/불편 수정

- [x] **1-1. 해설 자동 넘김 제거** (LessonQuiz.tsx)
  - `autoAdvanceRef`, `countdownRef`, `countdown` state 모두 삭제됨
  - 카운트다운 UI 텍스트 (`{countdown}초 후 자동 넘김`) 삭제됨
  - 정답/오답 모두 동일하게 "다음"/"계속" 버튼으로만 진행
  - 키보드 단축키(Space/Enter) 그대로 동작

- [x] **1-2. 자유연습 스크롤 문제 해결** (PracticeTab.tsx)
  - `resultRef` + `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` 추가
  - RangeChart → "레인지 보기 ▼" 토글 버튼으로 변경 (기본 접힘)
  - `showRange` state + `setShowRange(false)` 새 핸드 시 초기화

- [x] **1-3. 승단시험 버튼 버그 수정** (SkillTree.tsx)
  - `animate-slide-in` + `animationDelay` 제거 (opacity:0 상태에서 클릭 불가 원인)
  - 버튼 스타일 강화: amber 테두리/배경 + 더 큰 터치 타겟 (py-3, text-sm font-bold)
  - `e.stopPropagation()` 유지 (부모 아코디언과 충돌 방지)

### Step 2: 톤/콘텐츠 개선

- [x] **2-1. 퀴즈 피드백 톤 성인화**
  - LessonQuiz.tsx: "나이스!" → "좋은 판단이에요", "On Fire!" → "완벽한 흐름!", "좋은 흐름!" → "연속 정답!", "아쉬운 판단!" → "이번엔 아쉽네요"
  - DailyHand.tsx: "나이스!" → "정답!", "아쉬운 판단" → "아쉽네요"
  - Combo streak: "On Fire! N Streak!" → "N연속 정답!"

- [x] **2-2. 워딩 다듬기**
  - scenario.ts: "이길 확률이 높은 패" → "상위권 핸드", "약하지만" → "부족하지만", "불리해요" → "부족해요"
  - constants.ts: POSITION_INFO "좋은 패만 플레이" → "상위 핸드만 플레이", "절반 이상의 패로 공격" → "절반 이상의 핸드로 플레이"

- [x] **2-3. 약어 인라인 설명 강화**
  - skill-tree.ts guideTip: IP(In Position, 유리한 자리), OOP(Out Of Position, 불리한 자리), RFI(Raise First In, 첫 번째 레이즈), EP(Early Position, 앞자리), MP(Middle Position, 중간자리)

- [x] **2-4. 자유연습 모드별 목적 설명 추가**
  - PracticeTab.tsx: 4개 모드별 한 줄 설명 표시
  - RFI: "아무도 베팅 안 했을 때, 내 핸드로 레이즈할지 폴드할지 연습"
  - Facing RFI: "상대가 레이즈했을 때, 콜/3bet/폴드 판단 연습"
  - vs 3bet: "내가 레이즈 후 상대가 리레이즈(3bet) 했을 때 대응 연습"
  - C-bet: "플랍에서 C-bet(컨티뉴에이션 벳)할지 체크할지 연습"

### Step 3: 봇 대전 UI 다듬기

- [x] **3-1. 플레이어 구분 명확화** (GameTable.tsx)
  - "나" 영역: bg-yellow-500/10 → bg-yellow-500/20 + shadow 글로우 효과
  - "나" 라벨: text-gray-300 → text-yellow-300 (색상 차별화)

- [x] **3-2. 액션 토스트 노출 시간** (globals.css)
  - action-toast 2s → 3s, 키프레임 비율 조정 (10%/80%)

- [x] **3-3. 미세 조정** (globals.css)
  - 베팅 칩 애니메이션: 0.35s → 0.5s
  - 활성 플레이어 펄스: 투명도/글로우 강화 (0.3→0.4, 0.6→0.8, box-shadow 12px)

## Supabase 보안 (기존 이슈 — 이번 변경과 무관)

- [x] RLS 활성화: 모든 주요 테이블에 RLS 적용됨
- 기존 WARN 4건 (이번 변경과 무관, 별도 백로그):
  - `notify_feedback`, `send_daily_report`, `handle_new_user` — search_path 미설정
  - `blog_comments` INSERT — RLS always true
  - Leaked password protection 비활성화
- 성능 WARN: RLS `auth.uid()` → `(select auth.uid())` 최적화 필요 (기존 이슈, 42명 규모에서 문제 없음)

## PO 확인 항목

> 아래 항목은 로그인 후 직접 확인이 필요합니다:

- [ ] **레슨 퀴즈**: 정답 시 자동 넘김 없이 "다음" 버튼만 동작하는지
- [ ] **자유연습**: 결과 나왔을 때 자동 스크롤 + "레인지 보기" 토글 동작
- [ ] **승단시험**: 진행 중 유닛에서 승급전 버튼 정상 클릭
- [ ] **봇 대전**: "나" 영역이 더 눈에 띄는지, 토스트가 더 오래 보이는지
- [ ] **워딩**: 각 화면에서 어색한 표현 없는지 (자유연습, 레슨 해설)
