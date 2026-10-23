-- 예전 표 이름(pets, vaccines, weights, meds)을 mungdiary_ 로 바꿔요. 한 번만 실행하세요.
-- 기록·권한(RLS)·연결은 그대로 따라가요.
alter table public.pets rename to mungdiary_pets;
alter table public.vaccines rename to mungdiary_vaccines;
alter table public.weights rename to mungdiary_weights;
alter table public.meds rename to mungdiary_meds;
