-- Daily challenges: 매일 하나의 시나리오가 전체 유저에게 출제
CREATE TABLE daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  quiz_type TEXT NOT NULL,
  position TEXT NOT NULL,
  vs_position TEXT,
  hand TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily responses: 유저별 응답 (하루 1회)
CREATE TABLE daily_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_daily_responses_challenge ON daily_responses(challenge_id);
CREATE INDEX idx_daily_responses_user ON daily_responses(user_id);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily challenges"
  ON daily_challenges FOR SELECT USING (true);

CREATE POLICY "Users can read own daily responses"
  ON daily_responses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily responses"
  ON daily_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_daily_distribution(p_challenge_id UUID)
RETURNS TABLE(selected_answer TEXT, count BIGINT)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT selected_answer, COUNT(*) as count
  FROM daily_responses
  WHERE challenge_id = p_challenge_id
  GROUP BY selected_answer;
$$;
