# Holdem Trainer — Product Knowledge Base

> 이 문서는 사람이 읽는 공략집이 아니라, **제품을 설계하고 구현할 때 Claude가 참고하는 원천 데이터**다.
> 듀오링고 스타일의 체계적 학습 제품을 만들기 위한 모든 규칙, 데이터, 설계 원칙이 여기에 있다.

---

## 1. 제품 철학

### 1.1 듀오링고에서 가져오는 핵심 원리

| 듀오링고 원리 | 홀덤 트레이너 적용 |
|-------------|------------------|
| **스킬 트리** — 선형 진행 + 잠금 해제 | 유닛별 순서대로 진행. 이전 유닛 완료해야 다음 잠금 해제 |
| **짧은 레슨** — 5분 내 완료 | 레슨당 10~15핸드. 3~5분 소요 |
| **즉각적 피드백** — 맞으면 초록, 틀리면 빨강 | 정답/오답 즉시 표시 + 왜 틀렸는지 설명 |
| **스페이스드 레피티션** — 잊을 때쯤 복습 | 틀린 핸드를 간격 두고 재출제 |
| **스트릭** — 매일 접속 동기 | 일일 목표 + 연속 학습일 |
| **크라운/숙련도** — 같은 레슨 반복으로 마스터 | 레슨별 5단계 숙련도 (정답률 기반) |
| **하트** — 실수 제한 | 레슨 내 오답 5회 시 레슨 실패 → 재시도 |
| **XP** — 통합 성장 지표 | 정답 +10XP, 퍼펙트 레슨 보너스 +30XP |
| **리그/랭킹** — 사회적 동기 | (Phase 3) 주간 리더보드 |
| **팁/가이드** — 레슨 전 개념 설명 | 각 레슨 시작 전 30초 가이드 카드 |

### 1.2 학습 설계 원칙

1. **한 번에 한 가지만 가르친다** — 레슨 하나는 하나의 개념만 다룬다
2. **쉬운 것부터** — 가장 명확한 케이스(AA를 UTG에서 레이즈)부터 시작해서 경계선 케이스(A9s를 HJ에서)로 진행
3. **실수에서 배운다** — 오답 시 설명이 핵심 학습 순간. 설명의 질이 제품의 질
4. **체감 가능한 성장** — XP, 레벨, 정확도 차트로 "나 늘고 있다"를 느끼게
5. **중독 루프** — 레슨 완료 → 보상 → 다음 레슨 호기심 → 반복

---

## 2. 스킬 트리

### 2.1 전체 구조

```
[Unit 1] 핸드의 세계          ← 완전 입문. 핸드 읽기부터
[Unit 2] 자리가 돈이다        ← 포지션 개념
[Unit 3] 첫 번째 공격 (RFI)   ← EP 오픈 레인지
[Unit 4] 넓혀가기 (RFI 확장)  ← MP/LP 오픈 레인지
[Unit 5] 특수 작전 (SB/BB)    ← 블라인드 전략
[Unit 6] 반격 (Facing RFI)    ← 3벳/콜/폴드
[Unit 7] 재반격 (vs 3bet)     ← 4벳/콜/폴드
[Unit 8] 숫자의 힘 (팟 오즈)   ← 기본 수학
[Unit 9] 전장 읽기 (보드 텍스쳐) ← 플랍 분석
[Unit 10] 공격 유지 (C-bet)    ← IP C벳 전략
[Unit 11] 핸드 강도 판관       ← 포스트플랍 핸드 평가
[Unit 12] 돈의 언어 (벳 사이징) ← 사이즈 선택
[Unit 13] 적을 알자 (상대 읽기) ← 플레이어 유형별 전략
[Unit 14] 종합 실전           ← 믹스 드릴
```

### 2.2 유닛 상세 설계

각 유닛은 4~6개의 레슨으로 구성된다. 레슨은 다음 속성을 가진다:

```
Lesson {
  id: string,              // "1-1", "3-4" 등
  unit: number,            // 소속 유닛
  title: string,           // 레슨 이름
  subtitle: string,        // 한 줄 설명
  guideTip: string,        // 레슨 시작 전 보여줄 가이드 (2-3문장)
  quizType: string,        // 퀴즈 유형 (아래 참조)
  handCount: number,       // 레슨 당 출제 핸드 수
  maxErrors: number,       // 최대 허용 오답 수 (초과 시 레슨 실패)
  scenarios: Scenario[],   // 출제 시나리오 풀
  unlockCondition: string, // 잠금 해제 조건
  masteryLevels: 5,        // 숙련도 단계
}
```

#### 퀴즈 유형 (quizType)

| 유형 | 설명 | 예시 |
|------|------|------|
| `binary` | 2지선다 | 레이즈 or 폴드 |
| `ternary` | 3지선다 | 3벳 / 콜 / 폴드 |
| `quaternary` | 4지선다 | 4벳 / 콜 / 폴드 / (컨텍스트 의존) |
| `sizing` | 사이즈 선택 | 1/3팟 / 1/2팟 / 3/4팟 / 체크 |
| `identify` | 식별형 | "이 핸드는 어떤 카테고리?" (프리미엄/브로드웨이/수티드커넥터/폴드) |
| `board_read` | 보드 판독 | "이 보드는?" (드라이/웻/모노톤/페어드) |
| `strength` | 강도 평가 | "이 핸드+보드 조합의 강도는?" (강/중/약/에어) |
| `position` | 포지션 문제 | "이 포지션에서 오픈 비율은 대략?" (10%/20%/30%/50%) |

---

## 3. 유닛별 레슨 상세

### Unit 1: 핸드의 세계

**학습 목표**: 핸드 표기법을 읽고, 핸드의 상대적 강도를 직관적으로 판단할 수 있다.

#### Lesson 1-1: 카드 읽기
```yaml
title: "카드 읽기"
subtitle: "홀덤의 알파벳을 배우자"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  홀덤에서 카드를 표기하는 방법이 있어요.
  A=에이스, K=킹, Q=퀸, J=잭, T=10.
  s=같은 무늬(수티드), o=다른 무늬(오프수트).
  AA, KK처럼 같은 숫자 두 장은 포켓 페어라고 해요.
scenarios:
  - show: "A♠ K♠"
    question: "이 핸드의 표기법은?"
    options: ["AKs", "AKo", "AK", "KAs"]
    answer: "AKs"
    explanation: "같은 스페이드(♠)이므로 수티드. AKs로 표기."
  - show: "Q♥ J♦"
    question: "이 핸드의 표기법은?"
    options: ["QJs", "QJo", "JQo", "QJ"]
    answer: "QJo"
    explanation: "하트(♥)와 다이아(♦)로 다른 무늬. 오프수트 QJo."
  - show: "9♣ 9♦"
    question: "이 핸드의 표기법은?"
    options: ["99", "99s", "99o", "9"]
    answer: "99"
    explanation: "같은 숫자 두 장은 포켓 페어. 그냥 99로 표기."
  - show: "T♠ 9♠"
    question: "이 핸드의 표기법은?"
    options: ["T9s", "T9o", "9Ts", "T9"]
    answer: "T9s"
    explanation: "같은 스페이드. 높은 카드를 먼저 써서 T9s."
```

#### Lesson 1-2: 핸드 계급
```yaml
title: "핸드 계급"
subtitle: "어떤 패가 강할까?"
quizType: identify
handCount: 12
maxErrors: 3
guideTip: |
  모든 핸드는 평등하지 않아요.
  AA > KK > QQ > ... > 32o 순서예요.
  높은 페어 > 높은 수티드 > 높은 오프수트 > 낮은 페어 순이에요.
scenarios:
  - question: "다음 중 가장 강한 시작 핸드는?"
    options: ["AA", "AKs", "KK", "QQ"]
    answer: "AA"
    explanation: "AA는 프리플랍 최강 핸드. 모든 핸드를 상대로 유리."
  - question: "AKs와 QQ 중 프리플랍에서 더 강한 것은?"
    options: ["QQ", "AKs", "비슷하다"]
    answer: "QQ"
    explanation: "QQ는 이미 페어. AKs는 맞아야 페어가 되므로 QQ가 약간 유리."
  - question: "다음 중 가장 약한 핸드는?"
    options: ["72o", "32s", "J3o", "95o"]
    answer: "72o"
    explanation: "72o는 홀덤에서 가장 약한 핸드로 유명. 연결도 없고 높은 카드도 없다."
  - question: "AKs와 AKo의 차이는?"
    options: ["AKs가 더 강하다", "AKo가 더 강하다", "완전히 같다"]
    answer: "AKs가 더 강하다"
    explanation: "수티드는 플러시 가능성이 있어서 약 3% 더 자주 이긴다."
  - question: "99와 AQo 중 올인하면 누가 유리?"
    options: ["99가 약간 유리", "AQo가 약간 유리", "완전 동등"]
    answer: "99가 약간 유리"
    explanation: "포켓 페어는 이미 페어가 완성된 상태. 오버카드 둘과의 매치업에서 약 55:45로 유리."
```

#### Lesson 1-3: 핸드 카테고리
```yaml
title: "핸드 카테고리"
subtitle: "핸드를 그룹으로 나누자"
quizType: identify
handCount: 12
maxErrors: 3
guideTip: |
  핸드를 카테고리로 나누면 판단이 빨라져요.
  프리미엄(AA-JJ, AKs) / 브로드웨이(AQ, KQ 등 T이상 조합) /
  포켓페어(TT-22) / 수티드 커넥터(98s, 87s) / 수티드 에이스(A5s-A2s)
scenarios:
  - show: "AKs"
    question: "이 핸드의 카테고리는?"
    options: ["프리미엄", "브로드웨이", "수티드 커넥터"]
    answer: "프리미엄"
    explanation: "AKs는 상위 5개 핸드에 포함. 프리미엄 핸드."
  - show: "KJo"
    question: "이 핸드의 카테고리는?"
    options: ["프리미엄", "브로드웨이", "수티드 에이스"]
    answer: "브로드웨이"
    explanation: "K과 J 모두 T 이상. 브로드웨이 핸드."
  - show: "87s"
    question: "이 핸드의 카테고리는?"
    options: ["수티드 커넥터", "브로드웨이", "프리미엄"]
    answer: "수티드 커넥터"
    explanation: "같은 무늬 + 연속된 숫자. 스트레이트+플러시를 동시에 노리는 투기적 핸드."
  - show: "A4s"
    question: "이 핸드의 카테고리는?"
    options: ["수티드 에이스", "프리미엄", "브로드웨이"]
    answer: "수티드 에이스"
    explanation: "에이스 + 낮은 카드 + 수티드. 넛 플러시 가능성이 핵심 가치. 블러프 3벳 후보."
  - show: "55"
    question: "이 핸드의 카테고리는?"
    options: ["스몰 포켓페어", "프리미엄", "브로드웨이"]
    answer: "스몰 포켓페어"
    explanation: "낮은 포켓페어. 셋(555)을 맞히면 대박, 안 맞으면 어려운 핸드."
```

#### Lesson 1-4: 수티드의 힘
```yaml
title: "수티드의 힘"
subtitle: "같은 무늬가 왜 중요할까?"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  같은 무늬(수티드)는 다른 무늬(오프수트)보다 약 3-4% 더 이길 확률이 높아요.
  플러시를 만들 수 있는 가능성이 이 차이를 만들어요.
  이 작은 차이가 "플레이 가능"과 "폴드"의 경계를 가릅니다.
scenarios:
  - question: "KTs는 플레이하지만 KTo는 접는 포지션이 있다. 왜?"
    options: ["수티드는 플러시 가능성이 있어서", "수티드가 멋있어서", "차이 없다"]
    answer: "수티드는 플러시 가능성이 있어서"
    explanation: "수티드의 플러시 가능성이 EV(기대값)를 높여 경계선 핸드의 플레이 여부를 바꾼다."
  - question: "J9s와 QTo 중 더 플레이어빌리티가 좋은 핸드는?"
    options: ["J9s", "QTo", "비슷하다"]
    answer: "J9s"
    explanation: "J9s는 수티드+커넥터로 스트레이트와 플러시 모두 가능. QTo는 한쪽(스트레이트)만."
```

### Unit 2: 자리가 돈이다

**학습 목표**: 9인 테이블에서 각 포지션의 이름과 상대적 유불리를 안다.

#### Lesson 2-1: 포지션 이름
```yaml
title: "포지션 이름"
subtitle: "9개의 자리를 외우자"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  9인 테이블은 UTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN → SB → BB 순이에요.
  먼저 행동할수록 불리하고, 나중에 행동할수록 유리해요.
scenarios:
  - question: "가장 먼저 행동하는 포지션은?"
    options: ["UTG", "SB", "BB", "BTN"]
    answer: "UTG"
    explanation: "Under The Gun. 프리플랍에서 가장 먼저 행동한다."
  - question: "포스트플랍에서 항상 마지막에 행동하는 포지션은?"
    options: ["BTN", "BB", "CO", "SB"]
    answer: "BTN"
    explanation: "버튼은 딜러 위치로, 포스트플랍에서 항상 마지막에 행동. 정보 우위."
  - question: "SB과 BB의 공통 단점은?"
    options: ["포스트플랍에서 먼저 행동(OOP)", "핸드를 못 본다", "블라인드가 없다"]
    answer: "포스트플랍에서 먼저 행동(OOP)"
    explanation: "블라인드는 강제 베팅도 내야 하고, 포스트플랍에서 먼저 행동해야 해서 불리."
  - question: "LJ는 어떤 포지션 그룹에 속하나?"
    options: ["미들 포지션(MP)", "얼리 포지션(EP)", "레이트 포지션(LP)"]
    answer: "미들 포지션(MP)"
    explanation: "Lojack은 미들 포지션의 시작. EP보다 넓지만 LP보다 좁게 플레이."
```

#### Lesson 2-2: 포지션과 레인지의 관계
```yaml
title: "포지션과 레인지"
subtitle: "자리에 따라 핸드 수가 달라진다"
quizType: position
handCount: 10
maxErrors: 3
guideTip: |
  앞자리일수록 적은 핸드를, 뒷자리일수록 많은 핸드를 플레이해요.
  UTG는 약 10%, BTN은 약 51%.
  이유는 간단해요: 뒤에 남은 사람 수가 다르니까.
scenarios:
  - question: "UTG의 오픈 레인지는 대략 몇 %?"
    options: ["10%", "20%", "30%", "50%"]
    answer: "10%"
    explanation: "뒤에 8명이 남아있어서 매우 타이트하게. 상위 10%만 오픈."
  - question: "BTN의 오픈 레인지는 대략 몇 %?"
    options: ["51%", "30%", "20%", "10%"]
    answer: "51%"
    explanation: "뒤에 블라인드 2명만 남아서 거의 절반의 핸드를 오픈할 수 있다."
  - question: "CO의 오픈 레인지는 대략 몇 %?"
    options: ["30%", "10%", "51%", "22%"]
    answer: "30%"
    explanation: "BTN 앞 자리. 레이트 포지션이라 꽤 넓게 플레이 가능."
  - question: "KJo를 UTG에서 오픈하는 것은?"
    options: ["폴드가 맞다", "오픈해야 한다", "상관없다"]
    answer: "폴드가 맞다"
    explanation: "KJo는 UTG 10% 레인지에 포함되지 않는다. BTN이면 오픈."
```

#### Lesson 2-3: IP vs OOP
```yaml
title: "IP vs OOP"
subtitle: "포지션 유불리의 핵심"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  IP(In Position) = 상대보다 뒤에서 행동. 정보 이점이 있어서 유리.
  OOP(Out Of Position) = 상대보다 먼저 행동. 정보가 부족해서 불리.
  같은 핸드라도 IP이면 더 넓게 플레이할 수 있어요.
scenarios:
  - question: "BTN이 오픈하고 BB가 콜. 포스트플랍에서 IP인 쪽은?"
    options: ["BTN", "BB"]
    answer: "BTN"
    explanation: "BB가 먼저 행동하고 BTN이 나중에 행동. BTN이 IP."
  - question: "CO가 오픈하고 HJ가 콜. HJ는 IP인가 OOP인가?"
    options: ["OOP", "IP"]
    answer: "OOP"
    explanation: "HJ가 CO보다 앞에 앉아있으므로 포스트플랍에서 먼저 행동. OOP."
  - question: "IP의 가장 큰 장점은?"
    options: ["상대 행동을 보고 결정할 수 있다", "더 많은 카드를 받는다", "블라인드를 안 낸다"]
    answer: "상대 행동을 보고 결정할 수 있다"
    explanation: "상대가 체크하면 약한 신호, 베팅하면 뭔가 있다는 신호. 이 정보가 IP의 핵심 이점."
```

### Unit 3: 첫 번째 공격 (RFI 기초)

**학습 목표**: EP에서의 RFI 레인지를 80% 이상 정확도로 맞출 수 있다.

#### Lesson 3-1: RFI란 무엇인가
```yaml
title: "RFI란?"
subtitle: "첫 번째로 레이즈하기"
quizType: binary
handCount: 10
maxErrors: 3
guideTip: |
  RFI = Raise First In.
  앞 사람들이 전부 폴드했을 때, 내가 첫 번째로 레이즈하는 거예요.
  원칙: 레이즈 아니면 폴드. 콜만 하기(림프)는 하지 않아요.
scenarios:
  # UTG에서 확실한 레이즈
  - position: "UTG"
    hand: "AA"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "AA는 어떤 포지션에서든 레이즈. 최강 핸드."
    difficulty: 1
  - position: "UTG"
    hand: "KK"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "KK는 AA 다음으로 강한 핸드. UTG에서도 당연히 레이즈."
    difficulty: 1
  - position: "UTG"
    hand: "AKs"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "AKs는 프리미엄 핸드. UTG에서 오픈."
    difficulty: 1
  # UTG에서 확실한 폴드
  - position: "UTG"
    hand: "72o"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "72o는 홀덤 최약체. 어떤 포지션에서든 폴드."
    difficulty: 1
  - position: "UTG"
    hand: "J3o"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "연결도 없고, 높은 카드도 부실. UTG에서 폴드."
    difficulty: 1
  - position: "UTG"
    hand: "T5o"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG 레인지(10%)에 포함되지 않는 약한 핸드."
    difficulty: 1
```

#### Lesson 3-2: UTG 레인지
```yaml
title: "UTG 오픈 레인지"
subtitle: "가장 타이트한 포지션 마스터"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  UTG에서는 상위 10%만 오픈해요.
  페어: AA~77 / 수티드: AKs~ATs, A5s~A4s, KQs~KTs, QJs~QTs, JTs, T9s, 98s
  오프수트: AKo~AJo, KQo
  이 외에는 전부 폴드.
scenarios:
  # 경계선 핸드 (어려운 문제)
  - position: "UTG"
    hand: "66"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG 레인지는 77까지. 66은 UTG에서 접는다."
    difficulty: 3
  - position: "UTG"
    hand: "77"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "77은 UTG 레인지의 마지노선. 레이즈."
    difficulty: 3
  - position: "UTG"
    hand: "A9s"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG에서는 ATs까지만. A9s는 UTG+1부터 오픈."
    difficulty: 3
  - position: "UTG"
    hand: "ATs"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "ATs는 UTG 레인지에 포함. 탑 페어 가능성 + 넛 플러시 드로우."
    difficulty: 2
  - position: "UTG"
    hand: "KJo"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG 오프수트는 AKo, AQo, AJo, KQo까지만. KJo는 접는다."
    difficulty: 3
  - position: "UTG"
    hand: "KQo"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "KQo는 UTG 오프수트 레인지의 마지노선. 레이즈."
    difficulty: 2
  - position: "UTG"
    hand: "QJs"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "QJs는 수티드 브로드웨이. UTG 레인지에 포함."
    difficulty: 2
  - position: "UTG"
    hand: "98s"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "98s는 수티드 커넥터로 UTG에서도 오픈. 멀티웨이에서 큰 팟 잠재력."
    difficulty: 3
  - position: "UTG"
    hand: "87s"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "87s는 UTG 레인지에 포함되지 않는다. CO 이후부터 오픈."
    difficulty: 3
  - position: "UTG"
    hand: "A5s"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "A5s는 UTG에서도 오픈. 넛 플러시 가능성 + 스트레이트 가능성. 블로커 가치."
    difficulty: 3
  - position: "UTG"
    hand: "A3s"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG에서 수티드 에이스는 A5s, A4s까지만. A3s는 접는다."
    difficulty: 4
  - position: "UTG"
    hand: "AQo"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "AQo는 UTG에서 오픈. 탑 페어 + 강한 키커."
    difficulty: 2
```

#### Lesson 3-3: UTG+1, UTG+2 레인지
```yaml
title: "EP 확장"
subtitle: "한 자리씩 넓어진다"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  UTG+1은 14%, UTG+2는 16%로 조금씩 넓어져요.
  UTG 레인지 + 66, A9s, KJs 등이 추가됩니다.
  핵심: 한 자리 뒤로 갈수록 약간의 핸드가 추가된다.
scenarios:
  - position: "UTG+1"
    hand: "66"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "UTG에서는 접지만, UTG+1부터는 66 오픈. 한 자리 차이."
    difficulty: 3
  - position: "UTG+1"
    hand: "A9s"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "UTG+1부터 A9s 오픈 가능."
    difficulty: 3
  - position: "UTG+2"
    hand: "A8s"
    options: ["레이즈", "폴드"]
    answer: "레이즈"
    explanation: "UTG+2부터 A8s 오픈. 한 자리 뒤라 레인지가 넓어졌다."
    difficulty: 3
  - position: "UTG+2"
    hand: "KJo"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG+2에서도 KJo는 아직 레인지에 없다. LJ부터 가능."
    difficulty: 3
  - position: "UTG+1"
    hand: "55"
    options: ["레이즈", "폴드"]
    answer: "폴드"
    explanation: "UTG+1에서 55는 아직 접는다. LJ부터 오픈."
    difficulty: 3
```

### Unit 4: 넓혀가기 (RFI 확장)

#### Lesson 4-1: LJ/HJ 오픈 레인지
```yaml
title: "미들 포지션 오픈"
subtitle: "LJ 19%, HJ 22%"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  미들 포지션에서는 꽤 많은 핸드를 오픈할 수 있어요.
  LJ: +55, A5s-A2s, JTs, T9s, KQo 등
  HJ: +A3s-A2s, 98s, QJo 등 추가
```

#### Lesson 4-2: CO 오픈 레인지
```yaml
title: "컷오프 오픈"
subtitle: "30%로 넓어지는 세계"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  CO는 레이트 포지션. 뒤에 BTN, SB, BB 3명만 남았어요.
  44-33, K9s, Q9s, KTo 등 많은 핸드가 추가됩니다.
  "이런 핸드도 해?" 싶은 것들이 CO부터 오픈 가능해요.
```

#### Lesson 4-3: BTN 오픈 레인지
```yaml
title: "버튼 오픈"
subtitle: "51% — 거의 절반"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  BTN은 가장 넓은 오픈 레인지. 모든 페어, 대부분의 수티드,
  많은 오프수트를 오픈합니다. 22, K2s, A2o까지도 오픈해요.
  이유: 뒤에 2명(블라인드)만 남아있고, 포스트플랍에서 항상 IP.
```

#### Lesson 4-4: EP vs LP 비교 드릴
```yaml
title: "포지션 비교"
subtitle: "같은 핸드, 다른 결정"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  같은 핸드인데 포지션에 따라 행동이 달라지는 것을 연습해요.
  이 차이를 체화하면 프리플랍 실력이 확 올라갑니다.
scenarios:
  - position: "UTG"
    hand: "KTs"
    answer: "레이즈"
    difficulty: 2
  - position: "UTG"
    hand: "K9s"
    answer: "폴드"
    difficulty: 3
  - position: "BTN"
    hand: "K9s"
    answer: "레이즈"
    difficulty: 2
  - position: "UTG"
    hand: "55"
    answer: "폴드"
    difficulty: 3
  - position: "CO"
    hand: "55"
    answer: "레이즈"
    difficulty: 2
  - position: "UTG"
    hand: "QTo"
    answer: "폴드"
    difficulty: 2
  - position: "CO"
    hand: "QTo"
    answer: "레이즈"
    difficulty: 3
```

### Unit 5: 특수 작전 (SB/BB)

#### Lesson 5-1: SB 전략
```yaml
title: "스몰 블라인드 전략"
subtitle: "림프? 레이즈? 폴드?"
quizType: ternary
handCount: 15
maxErrors: 4
guideTip: |
  SB는 특수한 포지션이에요. BB 한 명만 남아서 레인지는 넓지만,
  포스트플랍에서 항상 OOP이라 불리해요.
  SB 전략: 밸류 레이즈(8.9%) / 블러프 레이즈(13%) / 림프(48.6%) / 폴드
  중간 강도 핸드는 림프하는 게 특징이에요.
```

#### Lesson 5-2: BB 디펜스
```yaml
title: "빅블라인드 디펜스"
subtitle: "이미 투자한 돈의 힘"
quizType: ternary
handCount: 15
maxErrors: 4
guideTip: |
  BB는 이미 1BB를 냈으므로 콜할 때 팟 오즈가 좋아요.
  그래서 많은 핸드로 디펜스(콜)할 수 있어요.
  상대가 어디서 오픈했느냐에 따라 디펜스 범위가 달라져요.
  UTG 오픈 vs BB → 좁게 디펜스 / BTN 오픈 vs BB → 넓게 디펜스
```

### Unit 6: 반격 (Facing RFI)

#### Lesson 6-1: 3벳 기초
```yaml
title: "3벳이란?"
subtitle: "상대 오픈에 리레이즈"
quizType: ternary
handCount: 12
maxErrors: 3
guideTip: |
  상대가 오픈(2벳)했을 때 다시 올리는 것을 3벳이라고 해요.
  3벳 하는 이유: 1) 강한 핸드로 팟을 키우기 2) 블러프로 상대를 접게 하기
  3벳 / 콜 / 폴드 중 선택해요.
scenarios:
  - myPosition: "BTN"
    vsPosition: "CO"
    hand: "AA"
    options: ["3벳", "콜", "폴드"]
    answer: "3벳"
    explanation: "AA는 항상 3벳. 최강 핸드로 팟을 키운다."
    difficulty: 1
  - myPosition: "BTN"
    vsPosition: "CO"
    hand: "72o"
    options: ["3벳", "콜", "폴드"]
    answer: "폴드"
    explanation: "72o는 어떤 상황에서든 폴드."
    difficulty: 1
  - myPosition: "BTN"
    vsPosition: "CO"
    hand: "JJ"
    options: ["3벳", "콜", "폴드"]
    answer: "3벳"
    explanation: "JJ은 CO 오픈에 대해 BTN에서 3벳. 강한 핸드."
    difficulty: 2
  - myPosition: "BTN"
    vsPosition: "CO"
    hand: "TT"
    options: ["3벳", "콜", "폴드"]
    answer: "콜"
    explanation: "TT는 3벳하기엔 미묘하고, 접기엔 강하다. 콜하고 플랍을 본다."
    difficulty: 3
  - myPosition: "BTN"
    vsPosition: "UTG"
    hand: "TT"
    options: ["3벳", "콜", "폴드"]
    answer: "콜"
    explanation: "UTG 오픈은 강하다. TT로 콜하고, 셋을 맞히거나 오버카드 안 뜨기를 기대."
    difficulty: 3
```

#### Lesson 6-2: 밸류 3벳 vs 블러프 3벳
```yaml
title: "왜 블러프 3벳을 하나?"
subtitle: "강한 척의 기술"
quizType: ternary
handCount: 12
maxErrors: 3
guideTip: |
  밸류 3벳: AA, KK, QQ, AKs 등 강한 핸드.
  블러프 3벳: A5s, A4s 등 블로커가 있는 핸드.
  블러프를 섞지 않으면 상대가 3벳에 쉽게 접어서
  강한 핸드로도 돈을 못 따요.
scenarios:
  - myPosition: "CO"
    vsPosition: "HJ"
    hand: "A5s"
    options: ["3벳", "콜", "폴드"]
    answer: "3벳"
    explanation: "A5s는 블러프 3벳 핸드. A 블로커 + 넛 플러시 가능성. 콜 받아도 플레이 가능."
    difficulty: 3
  - myPosition: "CO"
    vsPosition: "HJ"
    hand: "A9o"
    options: ["3벳", "콜", "폴드"]
    answer: "폴드"
    explanation: "A9o는 3벳하기엔 약하고, 콜하기엔 OOP. 폴드가 낫다."
    difficulty: 3
```

#### Lesson 6-3: 오프너 포지션별 대응
```yaml
title: "상대가 어디서 열었나?"
subtitle: "오프너의 자리가 내 대응을 바꾼다"
quizType: ternary
handCount: 15
maxErrors: 4
guideTip: |
  UTG 오픈 = 상대 레인지가 좁다(10%) → 나도 타이트하게 대응
  CO 오픈 = 상대 레인지가 넓다(30%) → 나도 넓게 대응 가능
  같은 핸드라도 상대의 오픈 포지션에 따라 3벳/콜/폴드가 달라져요.
```

### Unit 7: 재반격 (vs 3bet)

#### Lesson 7-1: 3벳을 받았을 때
```yaml
title: "3벳 대응"
subtitle: "겁먹지 말자"
quizType: ternary
handCount: 12
maxErrors: 3
guideTip: |
  내가 오픈한 후 3벳을 받았어요.
  4벳(다시 올리기) / 콜 / 폴드 중 선택.
  AA, KK → 4벳 (밸류)
  QQ, JJ, AQs → 콜
  약한 핸드 → 폴드
  겁먹고 무조건 접으면 상대가 계속 3벳으로 공격해요.
```

### Unit 8: 숫자의 힘 (팟 오즈)

#### Lesson 8-1: 팟 오즈 계산
```yaml
title: "팟 오즈"
subtitle: "콜할지 말지의 수학"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  팟 오즈 = 콜 금액 ÷ (팟 + 상대 베팅 + 내 콜).
  내 이길 확률이 팟 오즈보다 높으면 콜이 이득이에요.
scenarios:
  - question: "팟 100, 상대 베팅 50, 내 콜 50. 팟 오즈는?"
    options: ["25%", "33%", "50%", "20%"]
    answer: "25%"
    explanation: "50 ÷ (100+50+50) = 50/200 = 25%. 이길 확률 25% 이상이면 콜."
  - question: "팟 200, 상대 베팅 200(풀팟), 내 콜 200. 팟 오즈는?"
    options: ["33%", "25%", "50%", "40%"]
    answer: "33%"
    explanation: "200 ÷ (200+200+200) = 200/600 = 33%."
  - question: "플러시 드로우(9아웃)의 턴 한 장 확률은 대략?"
    options: ["19%", "35%", "9%", "50%"]
    answer: "19%"
    explanation: "Rule of 2: 아웃 9 × 2 = 약 18-19%."
  - question: "OESD(8아웃)로 리버까지 볼 수 있을 때 완성 확률은?"
    options: ["32%", "17%", "8%", "50%"]
    answer: "32%"
    explanation: "Rule of 4: 아웃 8 × 4 = 약 32%."
```

#### Lesson 8-2: 드로우 판단
```yaml
title: "드로우를 쫓을까?"
subtitle: "아웃과 팟 오즈 비교"
quizType: binary
handCount: 10
maxErrors: 3
guideTip: |
  드로우가 있을 때: 아웃 수 × 2(한 장) 또는 × 4(두 장) = 대략적인 확률%.
  이 확률이 팟 오즈보다 높으면 콜!
  플러시 드로우(9아웃) = ~19%/~35%
  OESD(8아웃) = ~17%/~32%
  거터샷(4아웃) = ~9%/~17%
```

### Unit 9: 전장 읽기 (보드 텍스쳐)

#### Lesson 9-1: 드라이 vs 웻
```yaml
title: "드라이 vs 웻"
subtitle: "보드의 성격을 3초 안에 파악"
quizType: board_read
handCount: 12
maxErrors: 3
guideTip: |
  드라이 보드: 카드가 흩어져 있고, 드로우가 없는 보드. 예: K♠ 7♦ 2♣
  웻 보드: 카드가 연결되어 있고, 드로우가 많은 보드. 예: J♥ T♥ 9♠
  드라이 → 블러프 잘 먹힘 / 웻 → 밸류벳 위주
scenarios:
  - board: ["K♠", "7♦", "2♣"]
    question: "이 보드는?"
    options: ["드라이", "웻"]
    answer: "드라이"
    explanation: "레인보우(3색), 카드 간격 넓음, 드로우 거의 없음. 전형적인 드라이 보드."
  - board: ["J♥", "T♥", "9♠"]
    question: "이 보드는?"
    options: ["웻", "드라이"]
    answer: "웻"
    explanation: "연속 카드(스트레이트 가능성 높음) + 투톤(플러시 드로우). 매우 웻."
  - board: ["A♦", "8♣", "3♠"]
    question: "이 보드는?"
    options: ["드라이", "웻"]
    answer: "드라이"
    explanation: "레인보우, 카드 간격 넓음. 에이스 하이 드라이 보드."
  - board: ["Q♥", "J♦", "T♣"]
    question: "이 보드는?"
    options: ["웻", "드라이"]
    answer: "웻"
    explanation: "Q-J-T 연속. 이미 스트레이트 완성(AK, K9)이 가능하고 드로우도 많음."
  - board: ["7♥", "7♦", "2♣"]
    question: "이 보드는?"
    options: ["드라이", "웻"]
    answer: "드라이"
    explanation: "페어드 보드. 드로우가 없어서 드라이. 상대가 7을 가지고 있기도 어려움."
  - board: ["9♠", "8♠", "6♥"]
    question: "이 보드는?"
    options: ["웻", "드라이"]
    answer: "웻"
    explanation: "연결 카드 + 투톤(스페이드). 스트레이트 드로우 + 플러시 드로우 가능."
```

#### Lesson 9-2: 모노톤과 페어드
```yaml
title: "특수 보드"
subtitle: "모노톤과 페어드 보드 대응"
quizType: board_read
handCount: 10
maxErrors: 3
guideTip: |
  모노톤: 3장 같은 수트. 누군가 이미 플러시일 수 있다!
  페어드: 보드에 페어. 트립스/풀하우스 가능. 상대가 그 카드 가질 확률은 줄어듦.
  두 유형 모두 특별한 주의가 필요해요.
```

### Unit 10: 공격 유지 (C-bet)

#### Lesson 10-1: C벳 기초
```yaml
title: "C벳이란?"
subtitle: "프리플랍 레이저의 후속 공격"
quizType: binary
handCount: 12
maxErrors: 3
guideTip: |
  C벳 = 프리플랍에서 마지막으로 레이즈한 사람이 플랍에서 하는 첫 베팅.
  프리플랍 레이저의 레인지가 더 강하다는 것이 전제.
  항상 C벳하는 건 아녜요. 보드와 핸드 강도에 따라 체크하기도 해요.
scenarios:
  - hand: "AK"
    board: ["K♠", "7♦", "2♣"]
    question: "C벳 할까요?"
    options: ["C벳", "체크"]
    answer: "C벳"
    explanation: "TPTK(탑 페어 탑 키커) + 드라이 보드. 전형적인 밸류 C벳."
    difficulty: 1
  - hand: "AA"
    board: ["9♠", "5♦", "2♣"]
    question: "C벳 할까요?"
    options: ["C벳", "체크"]
    answer: "C벳"
    explanation: "오버페어 + 드라이 보드. 밸류를 뽑기 위해 C벳."
    difficulty: 1
  - hand: "67o"
    board: ["A♠", "K♦", "J♣"]
    question: "C벳 할까요?"
    options: ["C벳", "체크"]
    answer: "체크"
    explanation: "에어. 보드에 높은 카드 3장이라 상대가 맞았을 가능성 높음. 블러프 포기."
    difficulty: 2
  - hand: "AQ"
    board: ["K♠", "7♦", "2♣"]
    question: "C벳 할까요?"
    options: ["C벳", "체크"]
    answer: "C벳"
    explanation: "보드 미스했지만 드라이 보드에서 에이스 오버카드 + 블로커. 블러프 C벳."
    difficulty: 3
  - hand: "55"
    board: ["J♥", "T♥", "9♠"]
    question: "C벳 할까요?"
    options: ["체크", "C벳"]
    answer: "체크"
    explanation: "웻 보드에서 약한 핸드. 상대가 이미 강하거나 드로우가 있을 가능성 높음. 체크."
    difficulty: 3
```

#### Lesson 10-2: 보드별 C벳 전략
```yaml
title: "보드에 따른 C벳"
subtitle: "드라이 vs 웻에서의 전략 차이"
quizType: binary
handCount: 15
maxErrors: 4
guideTip: |
  드라이 보드 → C벳 빈도 높게 (60-80%). 상대가 맞기 어렵다.
  웻 보드 → C벳 빈도 낮게 (30-50%). 강한 핸드 위주로 베팅.
  C벳 사이즈: 드라이에서 1/3팟, 웻에서 1/2~2/3팟.
```

### Unit 11: 핸드 강도 판관

#### Lesson 11-1: 핸드 카테고리 분류
```yaml
title: "핸드 강도 평가"
subtitle: "플랍 후 내 핸드는 얼마나 강한가?"
quizType: strength
handCount: 12
maxErrors: 3
guideTip: |
  오버페어 > TPTK > 탑페어 약키커 > 미들페어 > 언더페어 > 드로우 > 에어
  강한 핸드 → 밸류벳 / 약한 핸드 → 체크 or 블러프 / 드로우 → 팟 오즈 보고 결정
scenarios:
  - hand: "QQ"
    board: ["J♠", "7♦", "3♣"]
    question: "이 핸드+보드 조합의 강도는?"
    options: ["오버페어(매우 강)", "탑페어(강)", "미들페어(보통)"]
    answer: "오버페어(매우 강)"
    explanation: "QQ > J. 보드의 모든 카드보다 높은 페어 = 오버페어."
  - hand: "AJ"
    board: ["J♠", "7♦", "3♣"]
    question: "이 핸드+보드 조합의 강도는?"
    options: ["탑페어 강한키커(강)", "오버페어(매우 강)", "미들페어(보통)"]
    answer: "탑페어 강한키커(강)"
    explanation: "J로 탑 페어, A가 키커. TPGK(Top Pair Good Kicker)."
  - hand: "99"
    board: ["J♠", "7♦", "3♣"]
    question: "이 핸드+보드 조합의 강도는?"
    options: ["미들페어(보통)", "오버페어(매우 강)", "탑페어(강)"]
    answer: "미들페어(보통)"
    explanation: "99는 J보다 낮고 7보다 높다. 미들 페어. 1스트릿 밸류 정도."
```

### Unit 12: 돈의 언어 (벳 사이징)

#### Lesson 12-1: 사이즈의 의미
```yaml
title: "벳 사이즈 선택"
subtitle: "1/3? 1/2? 3/4?"
quizType: sizing
handCount: 12
maxErrors: 3
guideTip: |
  1/3팟: 드라이 보드 C벳, 씬밸류. 저렴하게 정보 획득.
  1/2팟: 표준 밸류벳. 모르겠으면 이걸 써요.
  3/4팟+: 강한 밸류 or 드로우에게 비싼 가격. 보호가 필요할 때.
scenarios:
  - hand: "AK"
    board: ["K♠", "7♦", "2♣"]
    situation: "드라이 보드에서 TPTK로 C벳"
    question: "적절한 사이즈는?"
    options: ["1/3 팟", "1/2 팟", "3/4 팟", "체크"]
    answer: "1/3 팟"
    explanation: "드라이 보드에서는 작은 C벳이 효율적. 상대 약한 핸드도 콜 유도."
  - hand: "AA"
    board: ["J♥", "T♥", "8♠"]
    situation: "웻 보드에서 오버페어로 C벳"
    question: "적절한 사이즈는?"
    options: ["3/4 팟", "1/3 팟", "1/2 팟", "체크"]
    answer: "3/4 팟"
    explanation: "웻 보드에서 드로우에게 비싼 가격 부과. 보호 + 밸류."
```

### Unit 13: 적을 알자 (상대 읽기)

#### Lesson 13-1: 플레이어 유형
```yaml
title: "4가지 유형"
subtitle: "상대를 분류하고 공략하기"
quizType: identify
handCount: 10
maxErrors: 3
guideTip: |
  타이트-패시브(니트): 좋은 패만, 소극적 → 그가 베팅하면 접어라
  루즈-패시브(콜링스테이션): 많이 참여, 콜만 → 블러프X, 밸류벳 크게
  타이트-어그레시브(TAG): 선별적+공격적 → 주의해서 대결
  루즈-어그레시브(LAG): 많이+공격적 → 트랩으로 잡기
scenarios:
  - question: "상대가 거의 모든 핸드에 콜하고, 레이즈는 거의 안 한다. 유형은?"
    options: ["루즈-패시브", "루즈-어그레시브", "타이트-패시브", "타이트-어그레시브"]
    answer: "루즈-패시브"
    explanation: "많이 참여(루즈) + 콜 위주(패시브) = 콜링 스테이션. 블러프 안 먹힌다."
  - question: "루즈-패시브 상대에게 가장 좋은 전략은?"
    options: ["블러프를 줄이고 밸류벳을 크게", "많이 블러프한다", "타이트하게 접는다"]
    answer: "블러프를 줄이고 밸류벳을 크게"
    explanation: "이 유형은 안 접으므로 블러프가 안 먹힌다. 대신 강한 핸드로 큰 밸류를."
  - question: "타이트-패시브 상대가 갑자기 크게 레이즈했다. 어떻게 해야 하나?"
    options: ["거의 항상 폴드", "무조건 콜", "3벳으로 맞선다"]
    answer: "거의 항상 폴드"
    explanation: "니트가 레이즈 = 진짜 강하다. AA, KK, AK 같은 핸드. 존중하고 폴드."
```

### Unit 14: 종합 실전

#### Lesson 14-1: 믹스 드릴 (전 모드 혼합)
```yaml
title: "종합 실전"
subtitle: "모든 것을 합쳐서"
quizType: mixed
handCount: 20
maxErrors: 5
guideTip: |
  지금까지 배운 모든 것을 혼합 출제합니다.
  RFI, 3벳, C벳, 보드 읽기, 핸드 강도가 랜덤으로 나와요.
  실전에서는 이 모든 판단을 빠르게 해야 해요.
```

---

## 4. 난이도 시스템

### 4.1 핸드별 난이도 분류

모든 시나리오에는 1~5 난이도가 부여된다.

```
Level 1 (매우 쉬움): 명확한 케이스
  - AA를 UTG에서 레이즈
  - 72o를 어디서든 폴드
  - AKs를 항상 3벳

Level 2 (쉬움): 대부분의 사람이 아는 것
  - QQ를 UTG에서 레이즈
  - AQo를 UTG에서 레이즈
  - KK에 올인 콜

Level 3 (보통): 경계선 케이스
  - A9s를 UTG에서 폴드 (UTG+1이면 레이즈)
  - 77 vs 66 (UTG에서 77은 오픈, 66은 폴드)
  - TT로 3벳 받았을 때 콜
  - KJo를 UTG에서 폴드하지만 CO에서 오픈

Level 4 (어려움): 직관에 반하는 케이스
  - A5s를 블러프 3벳 (왜 A9o보다 A5s가 더 나은 블러프인가)
  - SB 림프 레인지 (레이즈도 아니고 폴드도 아닌 핸드)
  - 드라이 보드에서 에어로 C벳 (맞은 게 없는데 베팅)

Level 5 (매우 어려움): 미묘한 판단
  - 특정 Facing RFI 시나리오에서의 3벳 vs 콜 경계
  - vs 3bet에서 4벳 블러프 핸드 선택
  - 웻 보드에서 약한 탑페어로 C벳 vs 체크 결정
```

### 4.2 난이도 진행 곡선

```
레슨 내 난이도 분포:

앞쪽 5핸드:  ████░░░░░░  난이도 1-2 (워밍업)
중간 5핸드:  ░░░████░░░  난이도 2-3 (본 학습)
후반 5핸드:  ░░░░░░████  난이도 3-4 (도전)

숙련도가 올라가면:
Crown 1: 난이도 1-2 위주
Crown 2: 난이도 2-3 위주
Crown 3: 난이도 3-4 위주
Crown 4: 난이도 3-5 위주
Crown 5: 난이도 4-5 위주 (마스터)
```

### 4.3 적응형 난이도

스페이스드 레피티션과 결합:

```
맞춘 핸드:
  - 다음 출현까지 간격 2배 증가
  - 난이도 1단계 올린 변형 문제 출제 가능

틀린 핸드:
  - 다음 출현까지 간격 1/2로 감소
  - 같은 난이도에서 반복
  - 3번 연속 틀리면 해당 개념 가이드 팁 다시 표시
```

---

## 5. 게이미피케이션 상세 설계

### 5.1 XP (경험치)

```
정답: +10 XP
오답: +0 XP (감점 없음)
레슨 완료: +20 XP 보너스
퍼펙트 레슨 (오답 0): +50 XP 보너스
일일 목표 달성: +30 XP 보너스
새 유닛 잠금 해제: +100 XP 보너스
```

### 5.2 레벨 시스템

```
XP → 레벨 변환 (누적)

Level 1:  0 XP      "루키"
Level 2:  200 XP    "비기너"
Level 3:  500 XP    "러너"
Level 4:  1,000 XP  "플레이어"
Level 5:  2,000 XP  "레귤러"
Level 6:  4,000 XP  "그라인더"
Level 7:  7,000 XP  "솔리드"
Level 8:  12,000 XP "프로피셔너"
Level 9:  20,000 XP "샤크"
Level 10: 35,000 XP "위저드"
```

### 5.3 숙련도 (크라운)

각 레슨은 5단계 숙련도를 가진다:

```
Crown 0 (잠김):  아직 시작 안 함
Crown 1 (시작):  레슨 1회 완료 (정답률 50%+)
Crown 2 (익힘):  레슨 2회 완료 + 정답률 65%+
Crown 3 (능숙):  레슨 3회 완료 + 정답률 75%+
Crown 4 (숙련):  레슨 4회 완료 + 정답률 85%+
Crown 5 (마스터): 레슨 5회 완료 + 정답률 90%+ (연속 2회)
```

크라운이 올라갈수록 같은 레슨이라도 난이도 분포가 어려워진다.

**숙련도 감소**: 일정 기간(7일) 복습하지 않으면 크라운 1단계 하락 → 복습 유도

### 5.4 스트릭

```
연속 학습일 카운트:
- 하루 1레슨 이상 완료 → 스트릭 유지
- 건너뛰면 → 스트릭 리셋
- 스트릭 방어권: 주 1회, 하루 건너뛸 수 있음 (프리미엄)

스트릭 보너스:
- 7일 연속: 뱃지 "일주일 전사" + 50 XP
- 30일 연속: 뱃지 "한 달 그라인더" + 200 XP
- 100일 연속: 뱃지 "백일 장인" + 500 XP
```

### 5.5 하트 (실수 허용)

```
하트 5개로 시작
오답 1회 → 하트 -1
하트 0 → 레슨 실패, 재시도 필요
하트 회복: 4시간마다 1개 (최대 5개)
즉시 회복: 광고 시청 or 프리미엄

무료 유저: 하트 5개, 느린 회복
프리미엄: 무제한 하트
```

### 5.6 일일 퀘스트

```
매일 3개의 퀘스트 생성:

Easy (30 XP):
  - "RFI 모드에서 10핸드 연습하기"
  - "레슨 1개 완료하기"

Medium (50 XP):
  - "Facing RFI에서 정답률 70% 이상 달성"
  - "포지션 드릴 완료하기"

Hard (100 XP):
  - "퍼펙트 레슨 달성하기 (오답 0)"
  - "오답 복습 드릴 완료하기"
```

---

## 6. 핵심 데이터 테이블

### 6.1 RFI 레인지 (완전판)

포지션별 오픈 레인지. 트레이너의 모든 RFI 문제의 정답 근거.

```
UTG (10.1%):
  Raise: AA KK QQ JJ TT 99 88 77
         AKs AQs AJs ATs A5s A4s
         KQs KJs KTs QJs QTs JTs T9s 98s
         AKo AQo AJo KQo

UTG+1 (14.3%):
  위 + 66 A9s A3s KJs QTs JTs T9s 98s 87s
  AQo AJo KQo KJo

UTG+2 (16.1%):
  위 + A8s QJs T9s 98s 87s
  AQo KQo KJo

LJ (19.0%):
  위 + 55 A7s A5s-A2s KTs QJs JTs T9s 98s 87s 76s
  AQo AJo KQo QJo

HJ (22.1%):
  위 + A6s-A2s K9s Q9s J9s T8s 97s 86s 75s 65s
  AJo KJo QJo JTo

CO (30.3%):
  위 + 44 33 K8s Q8s J8s T7s 96s 85s 74s 64s 54s
  ATo KTo QTo JTo T9o

BTN (51.1%):
  위 + 22 K7s-K2s Q7s-Q5s J7s T6s 95s 84s 73s 63s 53s 43s 32s
  A9o-A2o K9o-K7o Q9o J9o T9o 98o 87o 76o 65o

SB (special):
  Value Raise (8.9%): AA KK QQ JJ TT AKs AQs AJs A5s KQs AKo AQo
  Bluff Raise (13.0%): 99 88 77 ATs A4s A3s KJs KTs QJs QTs JTs T9s AJo KQo KJo
  Limp (48.6%): 66-22 A9s-A6s A2s K9s-K2s Q9s-Q5s J9s-J7s T8s-T6s 98s-95s 87s-84s 76s-73s 65s-63s 54s-53s 43s
               ATo-A2o KTo-K4o QTo-Q7o JTo-J8o T9o-T8o 98o-97o 87o-86o 76o 65o
```

### 6.2 Facing RFI 레인지

상대가 오픈한 포지션 vs 내 포지션별 3벳/콜/폴드 레인지.

```
Key 시나리오:

BTN vs CO (가장 빈번):
  3bet Value: AA KK QQ AKs
  3bet Bluff: A5s A4s AKo
  Call: JJ TT 99 88 77 AQs AJs ATs KQs KJs QJs JTs T9s 98s AQo AJo KQo

BB vs BTN (가장 빈번):
  3bet Value: AA KK QQ AKs AQs
  3bet Bluff: A5s A4s A3s A2s K9s T8s 97s 86s 75s
  Call: JJ-22 AJs-A6s KQs-K6s QJs-Q8s J9s-J8s T9s-T8s 98s-97s 87s-86s 76s-75s 65s-64s 54s
        AKo-ATo KQo-K9o QJo-QTo JTo T9o 98o

BB vs UTG (타이트):
  3bet Value: AA KK QQ AKs
  3bet Bluff: A5s A4s
  Call: JJ TT 99 AQs AJs ATs KQs KJs QJs AKo AQo
```

### 6.3 vs 3bet 레인지

```
Key 시나리오:

UTG vs 3bet:
  4bet Value: AA KK
  4bet Bluff: AKo A5s
  Call: QQ JJ AKs AQs AJs
  Fold: 나머지

CO vs 3bet:
  4bet Value: AA KK QQ
  4bet Bluff: AKo A5s A4s
  Call: JJ TT AKs AQs AJs KQs
  Fold: 나머지

BTN vs 3bet:
  4bet Value: AA KK QQ
  4bet Bluff: AKo A5s A4s
  Call: JJ TT 99 AKs AQs AJs ATs KQs KJs QJs
  Fold: 나머지
```

### 6.4 C벳 판단 로직

```
shouldCbet = f(handStrength, boardTexture, position)

Rules:
1. 오버페어 → 항상 C벳
2. TPTK → 항상 C벳
3. 탑페어 약키커 + 드라이보드 → C벳
4. 탑페어 약키커 + 웻보드 → 체크 경향
5. 미들페어 + 드라이보드 → 상황에 따라 (50/50)
6. 미들페어 + 웻보드 → 체크
7. 에어 + 드라이보드 → C벳 (블러프)
8. 에어 + 웻보드 → 체크
9. 에어 + 드로우 → C벳 (세미블러프)
10. 에어 + 오버카드 블로커 + 드라이보드 → C벳 (블러프)

C벳 사이즈:
  드라이 보드: 1/3 팟
  미디엄 보드: 1/2 팟
  웻 보드: 2/3 ~ 3/4 팟
```

### 6.5 보드 텍스쳐 분류

```
Board Texture Score (0-100):
  0-30: 매우 드라이 (K72 레인보우)
  30-50: 드라이 (A83 레인보우)
  50-70: 미디엄 (QJ5 투톤)
  70-85: 웻 (JT9 투톤)
  85-100: 매우 웻 (JT9 모노톤)

Factors:
  +20: 모노톤 (3 같은 수트)
  +15: 투톤 (2 같은 수트)
  +15: 3 연결 카드 (J-T-9, 8-7-6)
  +10: 2 연결 카드 (K-Q, 9-8)
  +5: 높은 카드 3장 (A-K-Q)
  -10: 레인보우 (3 다른 수트)
  -10: 카드 간격 넓음 (K-7-2)
  -5: 페어드 보드 (K-K-5)
```

---

## 7. 오답 설명 템플릿

### 7.1 RFI 오답

```
템플릿 A (레이즈해야 하는데 폴드한 경우):
  "{hand}은(는) {position}의 RFI 레인지({percent})에 포함됩니다.
   {category_reason}.
   기억하세요: {position}에서는 상위 {percent}의 핸드를 오픈합니다."

  예: "A5s은(는) UTG의 RFI 레인지(10.1%)에 포함됩니다.
      수티드 에이스로 넛 플러시 가능성과 블로커 가치가 있습니다.
      기억하세요: UTG에서는 상위 10.1%의 핸드를 오픈합니다."

템플릿 B (폴드해야 하는데 레이즈한 경우):
  "{hand}은(는) {position}의 RFI 레인지에 포함되지 않습니다.
   {weakness_reason}.
   {position}에서는 {similar_but_stronger}까지만 오픈합니다."

  예: "KJo은(는) UTG의 RFI 레인지에 포함되지 않습니다.
      오프수트 브로드웨이이지만 UTG에서는 너무 약합니다.
      UTG에서는 KQo까지만 오픈합니다."
```

### 7.2 카테고리별 설명 이유 (category_reason)

```
프리미엄 (AA-JJ, AKs):
  "프리미엄 핸드로 어떤 포지션에서든 오픈합니다."

높은 페어 (TT-77):
  "미들 포켓페어로 셋을 맞히면 큰 팟을 딸 수 있습니다."

수티드 에이스 (A5s-A2s):
  "수티드 에이스로 넛 플러시 가능성과 블로커 가치가 있습니다."

수티드 브로드웨이 (KQs, KJs, QJs 등):
  "수티드 브로드웨이로 탑 페어 + 플러시/스트레이트 가능성이 있습니다."

수티드 커넥터 (T9s, 98s, 87s 등):
  "수티드 커넥터로 스트레이트와 플러시를 동시에 노릴 수 있습니다."

오프수트 브로드웨이 (AKo, AQo 등):
  "높은 오프수트로 탑 페어 가능성이 있지만, 수티드보다 제한적으로 플레이합니다."
```

### 7.3 Facing RFI 오답

```
3벳해야 하는데 콜/폴드한 경우:
  밸류: "{hand}은(는) 밸류로 3벳합니다. 강한 핸드로 팟을 키우세요."
  블러프: "{hand}은(는) 블러프로 3벳합니다. {blocker_reason}."

콜해야 하는데 3벳/폴드한 경우:
  "3벳하기엔 약하지만, {pot_odds_reason}으로 콜이 적절합니다."

폴드해야 하는데 3벳/콜한 경우:
  "{hand}은(는) {vsPosition}의 오픈 레인지를 상대로 너무 약합니다.
   {vsPosition}은 {open_percent}로 오픈하므로, 이 레인지를 상대할 수 있는
   핸드가 필요합니다."
```

---

## 8. 프리미엄 모델 상세

### 8.1 무료 vs 프리미엄 기능 분류

```
무료:
  - Unit 1-5 (프리플랍 기초): 전체 잠금 해제
  - Unit 6-14: 각 유닛의 첫 레슨만 무료
  - 하트 5개 (4시간당 1개 회복)
  - 일일 퀘스트 2개
  - 기본 통계 (정답률, 총 핸드 수)
  - 오답 노트 최근 5개

프리미엄 (월 9,900원):
  - 모든 유닛/레슨 잠금 해제
  - 무제한 하트
  - 일일 퀘스트 3개 + 보너스 XP
  - 정확도 히트맵
  - 전체 오답 노트 (20개)
  - 세션 분석
  - 스페이스드 레피티션
  - 스트릭 방어권 (주 1회)
  - 포지션 드릴
  - 광고 없음
```

---

## 9. 구현 우선순위

이 knowledge base의 내용을 Phase별로 구현하는 순서:

```
Phase 0 (완료):
  ✅ localStorage 저장
  ✅ 일일 목표
  ✅ 오답 노트
  ✅ 학습 모드

Phase 1 (다음):
  - 정확도 히트맵
  - 스페이스드 레피티션
  - 세션 요약
  - 포지션 드릴

Phase 2 (마이그레이션):
  - Next.js + Supabase
  - 스킬 트리 UI (유닛/레슨 구조)
  - 크라운 숙련도 시스템
  - 가이드 팁 카드

Phase 3 (게이미피케이션):
  - XP + 레벨
  - 하트 시스템
  - 일일 퀘스트
  - 스트릭 보상
  - 프리미엄 모델

Phase 4 (콘텐츠 확장):
  - Unit 8-14 시나리오 데이터 완성
  - 적응형 난이도
  - 턴/리버 시나리오
  - 핸드히스토리 리뷰
```

---

## 10. 데이터 스키마 (Phase 2+ Supabase)

```sql
-- 유저
users (
  id uuid PK,
  email text,
  display_name text,
  level int DEFAULT 1,
  total_xp int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  hearts int DEFAULT 5,
  hearts_refreshed_at timestamp,
  is_premium boolean DEFAULT false,
  created_at timestamp
)

-- 유닛/레슨 진행도
lesson_progress (
  id uuid PK,
  user_id uuid FK → users,
  lesson_id text, -- "3-2"
  crown_level int DEFAULT 0, -- 0-5
  attempts int DEFAULT 0,
  best_accuracy float,
  last_attempted_at timestamp
)

-- 개별 핸드 기록
hand_history (
  id uuid PK,
  user_id uuid FK → users,
  lesson_id text,
  mode text, -- rfi, facing, vs3bet, cbet
  hand text, -- "AKs"
  position text,
  vs_position text,
  user_action text,
  correct_action text,
  is_correct boolean,
  difficulty int,
  created_at timestamp
)

-- 스페이스드 레피티션
spaced_repetition (
  id uuid PK,
  user_id uuid FK → users,
  hand text,
  mode text,
  position text,
  ease_factor float DEFAULT 2.5, -- SM-2 알고리즘
  interval_days int DEFAULT 1,
  next_review_at timestamp,
  consecutive_correct int DEFAULT 0
)

-- 일일 기록
daily_stats (
  id uuid PK,
  user_id uuid FK → users,
  date date,
  hands_played int DEFAULT 0,
  correct int DEFAULT 0,
  wrong int DEFAULT 0,
  xp_earned int DEFAULT 0,
  goal_completed boolean DEFAULT false,
  quests_completed jsonb DEFAULT '[]'
)
```
