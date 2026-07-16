/*
# MuunganoAI - Tengeneza meza za msingi

## Maelezo
Inaunda miundombinu ya hifadhidata kwa programu ya MuunganoAI. Programu ina akaunti (sign-in) hivyo data ni ya mtumiaji binafsi.

## Meza Mpya

### quiz_results
- `id` (uuid, primary key) - Kitambulisho cha matokeo
- `user_id` (uuid, references auth.users) - Mmiliki wa matokeo
- `score` (integer) - Alama alizopata mtumiaji
- `total_questions` (integer) - Idadi ya maswali yote
- `percentage` (integer) - Asilimia ya alama
- `completed_at` (timestamptz) - Muda wa kumaliza

### chat_messages
- `id` (uuid, primary key) - Kitambulisho cha ujumbe
- `user_id` (uuid, references auth.users) - Mmiliki wa ujumbe
- `role` (text) - Nafasi ya ujumbe (user au assistant)
- `content` (text) - Maudhui ya ujumbe
- `created_at` (timestamptz) - Muda wa kutuma

## Usalama (RLS)
- RLS imewashwa kwenye meza zote
- Sera za umiliki: mtumiaji anaweza kuona/kubadilisha/kufuta data yake mwenyewe tu
- Sera 4 kwa kila meza (SELECT, INSERT, UPDATE, DELETE)
*/

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage integer NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quiz_results" ON quiz_results;
CREATE POLICY "select_own_quiz_results" ON quiz_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quiz_results" ON quiz_results;
CREATE POLICY "insert_own_quiz_results" ON quiz_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quiz_results" ON quiz_results;
CREATE POLICY "update_own_quiz_results" ON quiz_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quiz_results" ON quiz_results;
CREATE POLICY "delete_own_quiz_results" ON quiz_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
