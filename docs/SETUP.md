# 멍다이어리 설정 & 배포 가이드

**Supabase**에 기록을 저장하고 **GitHub Pages**로 배포하는 순서예요. 처음부터 끝까지 30분 정도 걸려요.
AI 약 도우미(사진 인식·물어보기)까지 쓰려면 [8단계](#8단계-ai-약-도우미-켜기-사진-인식--물어보기)를 추가로 해요 (10분, Google Gemini 무료 사용량으로 **무료**).

```
[ 브라우저 (GitHub Pages) ]  ──로그인/기록──▶  [ Supabase ]
   index.html, js, css                        Auth (이메일 로그인)
   js/config.js 에 URL + 공개키                 Postgres (pets, vaccines, weights, meds)
                                               Storage (약 사진, 비공개)
                                               RLS: 내 기록·사진만 읽고 쓰기
                                               Edge Function med-ai ──▶ [ Claude API ]
                                                 (Claude 키는 여기에만 보관)    + 웹 검색
```

- 사이트는 정적 파일이라 GitHub Pages가 그냥 파일을 보여주기만 해요.
- 로그인과 데이터 저장은 브라우저가 Supabase와 직접 주고받아요.
- 공개 키는 웹에 노출돼도 괜찮아요. 누가 어떤 기록을 볼 수 있는지는 DB의 **RLS(행 단위 보안)** 규칙이 정해요.

---

## 1단계. Supabase 프로젝트 만들기

1. <https://supabase.com> 에 들어가서 **Start your project** → GitHub 계정으로 가입해요.
2. **New project**를 눌러요.
   - **Name**: `mungdiary` (아무거나 괜찮아요)
   - **Database Password**: **Generate a password**로 만들고 따로 적어두세요. 이 앱에서는 안 쓰지만, 나중에 DB에 직접 접속할 때 필요해요.
   - **Region**: `Northeast Asia (Seoul)` — 한국에서 제일 빨라요.
   - Plan: **Free**
3. **Create new project**를 누르고 1~2분 기다려요.

> 💡 무료 플랜은 **7일 동안 아무도 접속하지 않으면 프로젝트가 일시정지(Paused)** 돼요. 데이터는 지워지지 않아요. 대시보드에서 **Restore project**를 누르면 다시 살아나요.

## 2단계. 테이블 만들기 (SQL 실행)

1. 왼쪽 메뉴에서 **SQL Editor**를 열어요.
2. **New query**를 누르고, 이 저장소의 [`supabase/schema.sql`](../supabase/schema.sql) 내용을 **전부** 복사해서 붙여넣어요.
3. 오른쪽 아래 **Run** (또는 `Ctrl/Cmd + Enter`)을 눌러요.
   - `Success. No rows returned`가 나오면 성공이에요.
   - RLS 관련 확인 창이 뜨면 그대로 실행하면 돼요. 이 SQL이 RLS를 켜는 내용이에요.
4. 왼쪽 **Table Editor**에서 `pets`, `vaccines`, `weights`, `meds` 4개 테이블이 보이면 끝이에요.

| 테이블 | 내용 |
| --- | --- |
| `pets` | 강아지 프로필 (이름, 견종, 생일, 털 색, 특이사항…) |
| `vaccines` | 접종 기록 (항목, 접종일, 다음 예정일, 병원) |
| `weights` | 몸무게 (날짜, kg) |
| `meds` | 약상자 (용도, 복용법, 유통기한, 개봉일, 개봉 후 사용일수, 보관법, 주의사항…) |

모든 테이블에는 `user_id`가 있어요. 기록을 넣을 때 자동으로 **로그인한 사람의 id**가 들어가고, RLS 정책이 **자기 `user_id`인 행만** 읽고 쓰고 지울 수 있게 막아요. 강아지를 지우면 그 강아지의 접종·몸무게·약 기록도 같이 지워져요 (`on delete cascade`).

> SQL은 여러 번 실행해도 안전해요. 나중에 스키마가 바뀌면 다시 붙여넣고 Run 하면 돼요.
>
> **이미 예전 버전 SQL을 실행했다면**: 최신 `schema.sql`을 한 번 더 실행하세요. 기존 기록은 그대로 두고 강아지 생김새(`look`), 약 사진(`photo_path`) 칸과 사진 보관함(`med-photos` 버킷)만 추가돼요. **Storage**에서 `med-photos` 버킷이 보이면 OK.

## 3단계. 로그인 설정

### 3-1. 이메일 로그인 켜기
**Authentication → Sign In / Providers**에서 **Email**이 켜져 있는지 확인해요 (기본으로 켜져 있어요).

- **Confirm email** 켜짐 (기본값): 회원가입하면 인증 메일이 와요. 메일 안의 링크를 눌러야 로그인할 수 있어요.
- 혼자나 가족끼리만 쓸 거라면 **꺼도 돼요**. 그러면 가입하자마자 바로 로그인돼요.

> ⚠ Supabase 기본 메일 서버는 **시간당 몇 통**밖에 못 보내요. 테스트하다가 메일이 안 오면 잠시 기다리거나, 위처럼 Confirm email을 꺼두세요.

### 3-2. 사이트 주소 등록 (중요!)
**Authentication → URL Configuration**:

- **Site URL**: `https://dinado99.github.io/MungDiary/`
- **Redirect URLs**에 **Add URL**로 추가:
  - `https://dinado99.github.io/MungDiary/`
  - `http://localhost:3000/` (내 컴퓨터에서 테스트할 때)

이걸 안 하면 인증 메일의 링크를 눌렀을 때 `localhost:3000`처럼 엉뚱한 곳으로 가요.

### 3-3. (추천) 다 가입한 뒤에는 회원가입 막기
나와 가족 계정을 다 만들고 나면, 모르는 사람이 가입하지 못하게 막아두면 좋아요.
**Authentication → Sign In / Providers → User Signups**에서 **Allow new users to sign up**을 꺼요.
(꺼두지 않아도 남의 기록은 RLS 때문에 볼 수 없어요. 그래도 무료 용량을 쓰지 못하게 하려면 끄는 게 좋아요.)

> 가족이 **같은 기록을 같이 보려면** 한 계정을 같이 쓰면 돼요. 기록은 계정 단위로 저장돼요.

## 4단계. 사이트에 Supabase 연결하기

1. Supabase 대시보드 위쪽의 **Connect** 버튼을 누르거나, **Project Settings → API Keys**로 가요.
2. 두 가지 값을 복사해요.
   - **Project URL**: `https://abcdefghijkl.supabase.co` 형태
   - **Publishable key**: `sb_publishable_...` 형태
     (예전 프로젝트라면 **Legacy API Keys** 탭의 `anon` `public` 키(`eyJ...`)를 써도 돼요.)
3. 이 저장소의 [`js/config.js`](../js/config.js)에 붙여넣어요.

```js
window.MUNG_CONFIG = {
  supabaseUrl: 'https://abcdefghijkl.supabase.co',
  supabaseKey: 'sb_publishable_xxxxxxxxxxxxxxxx',
};
```

> 🔒 **절대 넣으면 안 되는 키**: `sb_secret_...` 또는 `service_role` 키. 이 키는 RLS를 무시하고 모든 데이터에 접근할 수 있어요. GitHub에 올라가면 누구나 볼 수 있으니 **publishable / anon 키만** 넣으세요.

`config.js`를 비워두면 예전처럼 **로그인 없이 이 브라우저에만 저장**하는 모드로 동작해요.

## 5단계. 내 컴퓨터에서 먼저 확인하기 (선택)

```sh
git clone https://github.com/dinado99/MungDiary.git
cd MungDiary
git checkout claude/mung-diary-site   # main 에 합치기 전이라면
npx serve -l 3000 .                   # Node가 없으면: python3 -m http.server 3000
```

1. 브라우저에서 <http://localhost:3000> 을 열어요.
2. 로그인 화면이 나오면 **처음이에요 (회원가입)**을 눌러요. 3-1에서 Confirm email을 켜뒀다면 메일 인증까지 해요.
3. **로그인** → 강아지를 등록하고 몸무게도 하나 넣어봐요.
4. Supabase **Table Editor → pets / weights**에 행이 생겼으면 성공이에요 🎉

## 6단계. GitHub Pages로 배포하기

### 6-1. 코드를 main 브랜치에 합치기
지금 코드는 `claude/mung-diary-site` 브랜치에 있어요. GitHub에서 **Pull request**를 만들어 `main`에 **Merge** 해요.
`js/config.js`를 수정했다면 그것도 커밋해서 같이 올려요.

```sh
git add js/config.js
git commit -m "Supabase 연결 정보 추가"
git push
```

### 6-2. Pages 켜기
1. GitHub 저장소 → **Settings** → 왼쪽 **Pages**.
2. **Build and deployment → Source**: `Deploy from a branch`
3. **Branch**: `main` / `/ (root)` → **Save**.
4. 1~2분 기다리면 위쪽에 **Your site is live at `https://dinado99.github.io/MungDiary/`** 가 떠요.
   진행 상황은 저장소의 **Actions** 탭에 있는 `pages-build-deployment`에서 볼 수 있어요.

> - 저장소가 **Private**이면 GitHub 무료 플랜에서는 Pages를 쓸 수 없어요. 저장소를 Public으로 바꾸거나 유료 플랜이 필요해요. Public이어도 기록은 Supabase에 있어서 코드만 공개돼요.
> - 저장소에 있는 `.nojekyll` 파일은 GitHub의 Jekyll 변환을 끄는 파일이에요. 지우지 마세요.

### 6-3. 배포 후 확인
1. `https://dinado99.github.io/MungDiary/` 접속 → 로그인.
2. 폰에서도 같은 주소로 들어가서 같은 계정으로 로그인 → 같은 기록이 보이면 완료!
3. 폰 홈 화면에 추가하면 앱처럼 쓸 수 있어요 (iPhone Safari: 공유 → **홈 화면에 추가** / Android Chrome: ⋮ → **홈 화면에 추가**).

### 6-4. 이후 수정 반영
`main`에 push하면 자동으로 다시 배포돼요. 바뀐 게 안 보이면 강력 새로고침(`Ctrl+Shift+R` / `Cmd+Shift+R`)을 해보세요.

## 7단계. 로그인 전에 쓰던 기록 옮기기

로그인 없이 이 브라우저에 쓴 기록이 있다면:
로그인 → **가방** 탭 → **이 기기 기록을 계정으로 옮기기**를 누르면 계정에 추가돼요.

백업 JSON 파일이 있다면 **가방 → 백업 불러오기**를 써요. 로그인 상태에서는 계정의 기록이 백업 내용으로 **바뀌어요** (기존 기록은 지워져요).

---

## 8단계. AI 약 도우미 켜기 (사진 인식 + 물어보기)

약봉투·약병 사진을 올리면 AI가 글자를 읽고, 인터넷에서 약 정보를 찾아 **용도·먹이는 법·주의사항·보관법·유통기한**을 정리해요. 결과는 **약상자에 바로 저장**할 수 있고 사진도 같이 저장돼요. **물어보기** 탭에서는 우리 강아지 정보와 약상자를 참고해서 질문에 답해요.

```
브라우저 ──(로그인 토큰 + 사진)──▶ Supabase Edge Function "med-ai" ──(AI 키)──▶ Google Gemini (무료)
                                                                         또는 Claude (유료)
```

AI 키는 **비밀값**이라 웹페이지(`config.js`)에 넣으면 안 돼요. 그래서 Supabase Edge Function이 키를 들고 대신 호출해요. 함수는 **로그인한 사람만** 쓸 수 있어요.

이 단계를 건너뛰어도 나머지 기능은 다 돼요. 물어보기 탭에서 "AI 키가 아직 설정되지 않았어요"라고만 나와요.

### 8-1. 무료 Gemini API 키 만들기 (카드 등록 없음)
1. <https://aistudio.google.com> 에 구글 계정으로 로그인해요.
2. 왼쪽 메뉴 **Get API key → Create API key**를 눌러요. 프로젝트를 고르라고 하면 새로 만들면 돼요.
3. 만들어진 키를 복사해요. 요즘 새로 만든 키는 **`AQ.`** 으로 시작해요(예전 키는 `AIza...`). 둘 다 그대로 넣으면 돼요.
4. **결제(Billing)는 연결하지 마세요.** 연결하지 않으면 무료 사용량 안에서만 동작하고, 돈이 나갈 일이 없어요.

> ℹ️ 무료 사용량은 하루·분당 횟수 제한이 있어요. 혼자 쓰기엔 보통 충분하고, 넘으면 "오늘 무료 AI 사용량을 다 썼어요"라는 안내가 떠요. 정확한 한도는 AI Studio의 사용량(Usage / Rate limit) 화면에서 볼 수 있어요.
>
> 🔒 무료 요금제에서는 보낸 내용(사진, 질문)이 Google 서비스 개선에 쓰일 수 있어요. 키를 만들 때 약관을 한번 확인해주세요.

### 8-2. 방법 A — 대시보드에서 배포 (설치 없이)
1. Supabase 대시보드 → **Edge Functions** → **Secrets**(또는 Project Settings → Edge Functions)에서 **Add new secret**:
   - Name: `GEMINI_API_KEY` / Value: 복사한 키 (`AQ....` 또는 `AIza...`) — 앞뒤 공백 없이
2. **Edge Functions → Deploy a new function → Via Editor**를 눌러요.
3. 함수 이름을 **`med-ai`** 로 정해요. 이름이 정확히 같아야 앱이 찾을 수 있어요.
4. 에디터 내용을 지우고 이 저장소의 [`supabase/functions/med-ai/index.ts`](../supabase/functions/med-ai/index.ts) 내용을 전부 붙여넣은 뒤 **Deploy function**을 눌러요.
   복사가 어려우면 GitHub 파일 화면 위쪽의 **Copy raw file** 아이콘을 쓰면 돼요.
5. 배포가 끝나면 함수의 **Details / Settings**에서 **Enforce JWT verification**(Verify JWT)을 **끄고** 저장해요.
   로그인 확인은 함수 코드가 직접 해요. 이 옵션이 켜져 있으면 401 오류가 날 수 있어요.

### 8-2. 방법 B — Supabase CLI로 배포
```sh
npx supabase login                                   # 브라우저로 로그인
npx supabase link --project-ref <프로젝트-ref>         # URL의 https://<ref>.supabase.co 부분
npx supabase secrets set GEMINI_API_KEY=AQ.여기에키
npx supabase functions deploy med-ai --no-verify-jwt
```

### 8-3. 확인
1. 사이트에 로그인 → **약상자 → 사진으로 등록** (또는 **물어보기** 탭의 📷 버튼).
2. 잠시 뒤 약 정보 카드가 뜨면 **약상자에 저장** 또는 **고쳐서 저장**을 눌러요.
3. **물어보기**에서 "지금 먹는 약들 같이 먹여도 괜찮아?" 같은 질문도 해봐요.
4. 잘 안 되면 대시보드 **Edge Functions → med-ai → Logs**에서 오류를 볼 수 있어요.

### (선택) 설정 바꾸기 — 모두 Secret으로, 함수 재배포 필요 없음
| Secret | 설명 |
| --- | --- |
| `GEMINI_MODEL` | 기본값 `gemini-flash-latest`(최신 Flash 모델). "모델을 찾을 수 없어요"가 뜨면 AI Studio의 모델 목록에 있는 이름(예: `gemini-…-flash`)으로 바꿔요 |
| `ANTHROPIC_API_KEY` + `AI_PROVIDER=claude` | 나중에 유료 Claude로 바꾸고 싶을 때 (console.anthropic.com에서 크레딧 충전 + 월 한도 설정) |
| `CLAUDE_MODEL` | Claude를 쓸 때 모델 (기본 `claude-opus-5-5`) |

> ⚠ AI 답변은 참고용이에요. 무료 AI는 약 이름을 잘못 읽을 수 있으니 저장 전에 **고쳐서 저장**으로 확인해주세요. 약봉투·라벨에 적힌 **수의사 지시가 항상 먼저**이고, 응급 상황이면 바로 동물병원에 연락하세요.

## 문제 해결

| 증상 | 원인 / 해결 |
| --- | --- |
| 로그인 화면이 안 나오고 "이 브라우저에만 저장" 문구가 보여요 | `js/config.js`가 비어 있거나 배포에 반영이 안 됐어요. 저장소 파일을 확인하고 강력 새로고침해보세요. |
| "DB 테이블이 없어요" | 2단계 SQL을 실행하지 않았거나, 다른 프로젝트에 실행했어요. |
| "이메일이나 비밀번호가 맞지 않아요" | 가입하지 않은 이메일이거나 비밀번호가 틀렸어요. **Authentication → Users**에서 계정을 확인할 수 있어요. |
| "메일함에서 인증 링크를 먼저 눌러주세요" | Confirm email이 켜져 있어요. 스팸함도 확인해보세요. 혼자 쓸 거면 3-1에서 꺼도 돼요. |
| 인증 메일 링크를 누르면 localhost로 가요 | 3-2 **Site URL / Redirect URLs** 설정을 확인해주세요. |
| "요청이 너무 많아요" | 메일 발송 한도에 걸렸어요. 1시간쯤 뒤에 다시 하거나 Confirm email을 꺼주세요. |
| 갑자기 아무것도 안 불러와져요 | 무료 프로젝트가 일시정지됐을 수 있어요. 대시보드에서 **Restore project**를 눌러주세요. |
| "AI 함수가 아직 배포되지 않았어요" | 8-2 단계를 안 했거나 함수 이름이 `med-ai`가 아니에요. |
| AI가 "로그인이 필요해요"라고 해요 / 401 | 8-2의 **Verify JWT를 끄기**를 확인해주세요. 로그아웃 후 다시 로그인해도 돼요. |
| "AI 키가 아직 설정되지 않았어요" | Secret 이름이 정확히 `GEMINI_API_KEY`인지 확인해주세요. |
| "GEMINI_API_KEY 설정을 확인해주세요" | 키를 다시 복사해서 넣어주세요. AI Studio에서 키가 지워지지 않았는지도 확인해요. |
| "Gemini가 API 키를 거부했어요" (401) | 새 형식(`AQ.`) 키가 일부 계정에서 거부된다는 제보가 있어요. ① 키를 공백 없이 다시 붙여넣기 ② AI Studio에서 새 키 만들기 ③ 그래도 안 되면 [Google Cloud 콘솔](https://console.cloud.google.com/apis/credentials)에서 같은 프로젝트로 **API 키 만들기** → Generative Language API로 제한해서 그 키를 넣어보세요. |
| "오늘 무료 AI 사용량을 다 썼어요" | 무료 한도를 넘었어요. 잠시 뒤나 다음 날 다시 쓰면 돼요. |
| "Gemini 모델을 찾을 수 없어요" | `GEMINI_MODEL` Secret을 AI Studio 모델 목록에 있는 이름으로 넣어주세요. |
| 사진은 저장 안 되고 약 정보만 저장돼요 | `schema.sql`을 다시 실행해서 `med-photos` 버킷을 만들어주세요. |
| "DB가 예전 버전이에요" | 최신 `schema.sql`을 다시 실행해주세요 (기존 기록은 지워지지 않아요). |
| 기록을 엑셀처럼 보고 싶어요 | Supabase **Table Editor**에서 바로 보고 고칠 수 있어요. 오른쪽 위 **Export → CSV**도 돼요. |

## 파일 구조

```
index.html            페이지 뼈대
css/style.css         픽셀 UI
js/config.js          ← Supabase URL / 공개 키 (여기만 고치면 돼요)
js/sprites.js         픽셀 그림 + 조립식 강아지 얼굴
js/looks.js           견종별 생김새 프리셋, 꾸미기 선택지
js/app.js             화면, 로그인, 저장, AI 물어보기
supabase/schema.sql   ← SQL Editor 에 붙여넣을 스키마 + RLS + 사진 보관함
supabase/functions/med-ai/index.ts  ← AI 약 도우미 Edge Function
supabase/config.toml  CLI 배포 설정
docs/SETUP.md         이 문서
```
