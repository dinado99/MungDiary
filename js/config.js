// Supabase 연결 정보
// 대시보드 → Project Settings → API Keys (또는 Data API) 에서 복사해 넣으세요.
// 비워두면 로그인 없이 이 브라우저에만 저장하는 모드로 동작해요.
//
// 여기 넣는 키는 "publishable"(sb_publishable_...) 또는 "anon" 키예요.
// 웹에 공개돼도 괜찮은 키이고, 기록은 schema.sql 의 RLS 정책으로 보호돼요.
// ⚠ "secret"(sb_secret_...) 이나 "service_role" 키는 절대 넣지 마세요!
window.MUNG_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
};
