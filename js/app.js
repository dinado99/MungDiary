(() => {
  'use strict';

  const KEY = 'mungdiary.v1';
  const SOON_DAYS = 30;
  const { sprite, dog } = window.Pixel;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    }));

  // ---------- 날짜 ----------
  const pad = n => String(n).padStart(2, '0');
  const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toStr(new Date());
  const daysUntil = s => Math.round((parse(s) - parse(today())) / 86400000);
  const fmt = s => (s ? s.replaceAll('-', '.') : '-');

  function addDays(s, n) {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return toStr(d);
  }

  function addMonths(s, n) {
    const d = parse(s);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return toStr(d);
  }

  function ageText(birthday) {
    if (!birthday) return '';
    const b = parse(birthday), t = new Date();
    let m = (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth();
    if (t.getDate() < b.getDate()) m--;
    if (m < 0) return '';
    const y = Math.floor(m / 12), r = m % 12;
    return y ? `${y}살${r ? ` ${r}개월` : ''}` : `${r}개월`;
  }

  function seasonDate() {
    const d = new Date();
    const season = ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'][d.getMonth()];
    const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return { season, day: d.getDate(), wd };
  }

  function ddayBadge(dateStr, overLabel = '지남') {
    if (!dateStr) return '';
    const n = daysUntil(dateStr);
    if (n < 0) return `<span class="badge bad">D+${-n} ${overLabel}</span>`;
    if (n === 0) return '<span class="badge bad">D-DAY</span>';
    return `<span class="badge ${n <= SOON_DAYS ? 'warn' : 'ok'}">D-${n}</span>`;
  }

  // ---------- 저장 ----------
  // mode: 'local'(이 브라우저에만) | 'cloud'(Supabase 계정) | 'login'(로그인 화면) | 'loading'
  const LISTS = ['pets', 'vaccines', 'weights', 'meds'];
  // Supabase 표 이름: 다른 앱과 한 프로젝트를 같이 써도 안 겹치게 앞에 mungdiary_ 를 붙여요
  const table = list => `mungdiary_${list}`;
  const blank = () => ({ pets: [], activePetId: null, vaccines: [], weights: [], meds: [] });

  const pref = {
    get(k) { try { return localStorage.getItem(`${KEY}.${k}`); } catch (e) { return null; } },
    set(k, v) {
      try { v == null ? localStorage.removeItem(`${KEY}.${k}`) : localStorage.setItem(`${KEY}.${k}`, v); } catch (e) { /* 무시 */ }
    },
  };

  function loadLocal() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.pets)) return Object.assign(blank(), s);
    } catch (e) { /* 빈 상태로 시작 */ }
    return blank();
  }

  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      toast('저장에 실패했어요. 백업을 먼저 받아두세요!', 'bad');
    }
  }

  const cfg = window.MUNG_CONFIG || {};
  const sb = cfg.supabaseUrl && cfg.supabaseKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey)
    : null;

  // 앱(camelCase) ↔ DB(snake_case) 컬럼 매핑
  const COLUMNS = {
    pets: { name: 'name', breed: 'breed', birthday: 'birthday', sex: 'sex', fur: 'fur', look: 'look', regNo: 'reg_no', note: 'note' },
    vaccines: { petId: 'pet_id', name: 'name', date: 'date', nextDate: 'next_date', hospital: 'hospital', memo: 'memo' },
    weights: { petId: 'pet_id', date: 'date', kg: 'kg', memo: 'memo' },
    meds: {
      petId: 'pet_id', name: 'name', kind: 'kind', purpose: 'purpose', dosage: 'dosage',
      prescribedDate: 'prescribed_date', hospital: 'hospital', expiryDate: 'expiry_date', storage: 'storage',
      openedDate: 'opened_date', openDays: 'open_days', status: 'status', caution: 'caution', memo: 'memo',
      photoPath: 'photo_path',
    },
  };

  function toRow(list, obj) {
    const row = { id: obj.id };
    for (const [k, col] of Object.entries(COLUMNS[list])) {
      if (k in obj) row[col] = obj[k] === '' || obj[k] == null ? null : obj[k];
    }
    return row;
  }

  function fromRow(list, row) {
    const obj = { id: row.id };
    for (const [k, col] of Object.entries(COLUMNS[list])) {
      const v = row[col];
      obj[k] = v == null ? '' : typeof v === 'object' ? v : String(v);
    }
    return obj;
  }

  function check({ error }) {
    if (error) throw error;
  }

  const cloudStore = {
    async loadAll() {
      const results = await Promise.all(LISTS.map(t => sb.from(table(t)).select('*').order('created_at')));
      const s = blank();
      results.forEach((r, i) => {
        check(r);
        s[LISTS[i]] = r.data.map(row => fromRow(LISTS[i], row));
      });
      return s;
    },
    async put(list, obj) { check(await sb.from(table(list)).upsert(toRow(list, obj))); },
    async del(list, id) { check(await sb.from(table(list)).delete().eq('id', id)); },
    // 백업/이 기기 기록을 계정에 올리기. id 는 새로 만들어서 겹치지 않게 해요.
    async upload(src, { replace = false } = {}) {
      if (replace) check(await sb.from(table('pets')).delete().not('id', 'is', null));
      const petIds = new Map();
      const pets = (src.pets || []).map(p => {
        const id = uid();
        petIds.set(p.id, id);
        return toRow('pets', Object.assign({}, p, { id }));
      });
      if (pets.length) check(await sb.from(table('pets')).insert(pets));
      for (const list of ['vaccines', 'weights', 'meds']) {
        const rows = (src[list] || [])
          .filter(x => petIds.has(x.petId))
          .map(x => toRow(list, Object.assign({}, x, { id: uid(), petId: petIds.get(x.petId) })));
        if (rows.length) check(await sb.from(table(list)).insert(rows));
      }
      return petIds;
    },
  };

  const localStore = {
    async put() { /* state 를 통째로 saveLocal() */ },
    async del() { /* 위와 같음 */ },
  };

  let mode = sb ? 'loading' : 'local';
  let user = null;
  let lastFetch = 0;
  const store = () => (mode === 'cloud' ? cloudStore : localStore);
  const persist = () => {
    pref.set('pet', state.activePetId);
    if (mode === 'local') saveLocal();
  };

  let state = mode === 'local' ? loadLocal() : blank();
  let tab = pref.get('tab') || 'home';
  let medFilter = '전체';
  let medQuery = '';

  async function refresh({ quiet = false } = {}) {
    try {
      const s = await cloudStore.loadAll();
      s.activePetId = pref.get('pet');
      state = s;
      lastFetch = Date.now();
    } catch (e) {
      if (!quiet) toast(errText(e), 'bad');
    }
    render();
  }

  function errText(e) {
    const msg = (e && (e.message || e.error_description)) || String(e);
    if (/[가-힣]/.test(msg)) return msg;
    if (/Invalid login credentials/i.test(msg)) return '이메일이나 비밀번호가 맞지 않아요';
    if (/Email not confirmed/i.test(msg)) return '메일함에서 인증 링크를 먼저 눌러주세요';
    if (/already registered/i.test(msg)) return '이미 가입된 이메일이에요. 로그인해주세요';
    if (/Password should be/i.test(msg)) return '비밀번호는 6자 이상이어야 해요';
    if (/rate limit/i.test(msg)) return '요청이 너무 많아요. 잠시 후 다시 해주세요';
    if (/Failed to fetch|NetworkError/i.test(msg)) return '인터넷 연결을 확인해주세요';
    if (/Requested function was not found|Function not found/i.test(msg)) return 'AI 함수가 아직 배포되지 않았어요 (docs/SETUP.md 8단계)';
    if (/Failed to send a request to the Edge Function/i.test(msg)) return 'AI 답이 너무 오래 걸렸거나 연결이 끊겼어요. 다시 해주세요';
    if (/column .* does not exist|Could not find the '.*' column/i.test(msg)) return 'DB가 예전 버전이에요. schema.sql 을 다시 실행해주세요';
    if (/relation .* does not exist|Could not find the table/i.test(msg)) return 'DB 테이블이 없어요. schema.sql 을 실행했는지 확인해주세요';
    return `문제가 생겼어요: ${msg}`;
  }

  const pet = () => state.pets.find(p => p.id === state.activePetId) || state.pets[0];
  const mine = list => { const p = pet(); return p ? list.filter(x => x.petId === p.id) : []; };
  const sortedWeights = () => mine(state.weights).sort((a, b) => a.date.localeCompare(b.date));

  // ---------- 폼 정의 ----------
  const VACCINE_NAMES = [
    '종합백신 (DHPPL)', '코로나 장염', '켄넬코프', '인플루엔자', '광견병',
    '심장사상충 예방약', '외부기생충 예방약', '내부구충제', '항체가 검사',
  ];

  const PET_FIELDS = [
    { name: 'look', label: '생김새', type: 'look', wide: true },
    { name: 'name', label: '이름', required: true, placeholder: '예) 개복치' },
    { name: 'breed', label: '견종 (선택)', placeholder: '몰라도 괜찮아요' },
    { name: 'birthday', label: '생일', type: 'date' },
    { name: 'sex', label: '성별', type: 'select', options: ['남아', '여아', '남아 (중성화)', '여아 (중성화)'] },
    { name: 'regNo', label: '동물등록번호', placeholder: '15자리' },
    { name: 'note', label: '특이사항 (알러지, 지병 등)', type: 'textarea', wide: true, placeholder: '병원에서 꼭 말해야 하는 것' },
  ];

  const VACCINE_FIELDS = [
    { name: 'name', label: '접종 / 예방 항목', required: true, list: VACCINE_NAMES, placeholder: '목록에서 고르거나 직접 입력' },
    { name: 'date', label: '접종일', type: 'date', required: true, default: today },
    { name: 'nextDate', label: '다음 접종 예정일', type: 'date',
      quick: [['+1달', 1], ['+3달', 3], ['+1년', 12]], quickFrom: 'date' },
    { name: 'hospital', label: '병원' },
    { name: 'memo', label: '메모', type: 'textarea', wide: true, placeholder: '차수, 반응, 비용 등' },
  ];

  const WEIGHT_FIELDS = [
    { name: 'date', label: '날짜', type: 'date', required: true, default: today },
    { name: 'kg', label: '몸무게 (kg)', type: 'number', step: '0.01', min: '0', required: true, placeholder: '예) 7.4' },
    { name: 'memo', label: '메모', type: 'textarea', wide: true, placeholder: '병원에서 잼, 사료 바꿈 등' },
  ];

  const MED_STATUS = ['먹는 중', '보관 중', '다 씀'];
  const MED_FIELDS = [
    { name: 'name', label: '약 이름', required: true, placeholder: '예) 아포퀠 5.4mg' },
    { name: 'kind', label: '종류', type: 'select', options: ['먹는 약', '바르는 약', '눈·귀 약', '주사', '영양제', '기타'] },
    { name: 'purpose', label: '어디에 쓰는 약인가요?', wide: true, placeholder: '예) 피부 가려움, 귀 염증' },
    { name: 'dosage', label: '먹이는 / 쓰는 방법', wide: true, placeholder: '예) 하루 2번, 1알씩, 밥 먹고 나서' },
    { name: 'prescribedDate', label: '처방일', type: 'date', default: today },
    { name: 'hospital', label: '처방 병원' },
    { name: 'expiryDate', label: '유통기한', type: 'date' },
    { name: 'storage', label: '보관 방법', type: 'select', options: ['실온', '냉장', '냉동', '직사광선 피하기'] },
    { name: 'openedDate', label: '개봉일', type: 'date', hint: '안약·물약처럼 개봉 후 기한이 있는 약' },
    { name: 'openDays', label: '개봉 후 사용 가능 (일)', type: 'number', min: '0', step: '1', placeholder: '예) 28' },
    { name: 'status', label: '상태', type: 'select', options: MED_STATUS },
    { name: 'caution', label: '주의사항', type: 'textarea', wide: true, placeholder: '예) 공복에 주면 안 됨, 다른 강아지에게 쓰지 않기' },
    { name: 'memo', label: '메모', type: 'textarea', wide: true },
  ];

  function medDeadline(m) {
    let d = m.expiryDate || '';
    if (m.openedDate && Number(m.openDays) > 0) {
      const o = addDays(m.openedDate, Number(m.openDays));
      if (!d || o < d) d = o;
    }
    return d;
  }

  // ---------- 공용 UI ----------
  let toastTimer;
  function toast(msg, kind = '') {
    const el = $('#toast');
    el.className = `toast show ${kind}`;
    el.innerHTML = `${sprite(kind === 'bad' ? 'heart' : 'sparkle', 2)}<span>${esc(msg)}</span>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2200);
  }

  function fieldHTML(f, values) {
    const id = `f_${f.name}`;
    const raw = values[f.name] ?? (typeof f.default === 'function' ? f.default() : f.default) ?? '';
    const req = f.required ? 'required' : '';
    let input;
    if (f.type === 'look') {
      return `<div class="field wide"><label>${esc(f.label)}</label>
        <input type="hidden" name="${f.name}" value="${esc(JSON.stringify(petLook(values)))}">
        <div class="look-picker">${lookPickerHTML(petLook(values))}</div></div>`;
    }
    if (f.type === 'textarea') {
      input = `<textarea id="${id}" name="${f.name}" rows="2" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(raw)}</textarea>`;
    } else if (f.type === 'select') {
      input = `<select id="${id}" name="${f.name}">${f.options.map(o =>
        `<option ${o === raw ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    } else {
      const attrs = [
        f.step && `step="${f.step}"`, f.min && `min="${f.min}"`,
        f.list && `list="dl_${f.name}"`, f.type === 'number' && 'inputmode="decimal"',
      ].filter(Boolean).join(' ');
      input = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(raw)}" placeholder="${esc(f.placeholder || '')}" autocomplete="off" ${attrs} ${req}>`;
      if (f.list) input += `<datalist id="dl_${f.name}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
    }
    const quick = f.quick ? `<div class="quick">${f.quick.map(([label, months]) =>
      `<button type="button" class="chip" data-quick="${f.name}" data-from="${f.quickFrom}" data-months="${months}">${label}</button>`).join('')}</div>` : '';
    return `<div class="field ${f.wide ? 'wide' : ''}">
      <label for="${id}">${esc(f.label)}${f.required ? ' <b>*</b>' : ''}</label>
      ${input}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}${quick}
    </div>`;
  }

  function openForm({ title, icon, fields, values = {}, submitText = '저장', onSubmit }) {
    const dlg = $('#dialog');
    dlg.innerHTML = `<form class="panel dialog-panel" novalidate>
      <h2 class="dlg-title">${icon ? sprite(icon, 3) : ''}<span>${esc(title)}</span></h2>
      <div class="form-grid">${fields.map(f => fieldHTML(f, values)).join('')}</div>
      <div class="dlg-actions">
        <button type="button" class="btn" data-close>취소</button>
        <button type="submit" class="btn btn-ok">${esc(submitText)}</button>
      </div>
    </form>`;
    const form = $('form', dlg);
    form.addEventListener('click', e => {
      const q = e.target.closest('[data-quick]');
      if (q) {
        const from = form.elements[q.dataset.from].value || today();
        form.elements[q.dataset.quick].value = addMonths(from, Number(q.dataset.months));
      }
      if (e.target.closest('[data-close]')) dlg.close();
      const lk = e.target.closest('[data-look-key], [data-preset], [data-look-random]');
      if (lk) {
        const input = form.elements.look;
        let look = JSON.parse(input.value);
        if (lk.dataset.preset != null) look = Object.assign({}, window.Looks.PRESETS[Number(lk.dataset.preset)]);
        else if (lk.dataset.lookRandom != null) look = window.Looks.random();
        else look[lk.dataset.lookKey] = lk.dataset.lookValue;
        input.value = JSON.stringify(look);
        const scroller = $('.presets', form);
        const left = scroller ? scroller.scrollLeft : 0;
        $('.look-picker', form).innerHTML = lookPickerHTML(look);
        $('.presets', form).scrollLeft = left;
      }
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      for (const k in data) data[k] = String(data[k]).trim();
      const btn = $('[type=submit]', form);
      btn.disabled = true;
      btn.textContent = '저장 중...';
      try {
        await onSubmit(data);
        dlg.close();
      } catch (err) {
        toast(errText(err), 'bad');
        btn.disabled = false;
        btn.textContent = submitText;
      }
    });
    dlg.showModal();
    const first = $('input, select, textarea', form);
    if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
  }

  async function upsert(listName, data, id) {
    const list = state[listName];
    const prev = id && list.find(x => x.id === id);
    const obj = prev ? Object.assign({}, prev, data) : Object.assign({ id: uid(), petId: pet().id }, data);
    await store().put(listName, obj);
    if (prev) list[list.indexOf(prev)] = obj;
    else list.push(obj);
    persist();
    render();
  }

  async function remove(listName, id, label) {
    if (!confirm(`'${label}' 기록을 지울까요?`)) return false;
    try {
      await store().del(listName, id);
    } catch (e) {
      toast(errText(e), 'bad');
      return false;
    }
    state[listName] = state[listName].filter(x => x.id !== id);
    persist();
    render();
    toast('지웠어요');
    return true;
  }

  // ---------- 펫 ----------
  // 예전 기록은 털 색(fur)만 있어서 기본 생김새에 덮어써요
  function petLook(p) {
    const look = p && typeof p.look === 'object' && p.look ? p.look : {};
    return window.Pixel.normalizeLook(Object.assign(p && p.fur ? { fur: p.fur } : {}, look));
  }

  // 이름 없이 그림만 보고 고르는 생김새 선택기
  function lookPickerHTML(look) {
    look = window.Pixel.normalizeLook(look);
    const { PARTS, PRESETS } = window.Looks;
    const still = (l, k = 3) => window.Pixel.dogStill(k, l);
    const row = ([key, title, values]) => `<div class="opt-row"><span class="opt-label">${title}</span><div class="opts">${
      values.map(v => `<button type="button" class="opt ${look[key] === v ? 'on' : ''}" data-look-key="${key}" data-look-value="${v}" aria-label="${title}">${
        still(Object.assign({}, look, { [key]: v }))}</button>`).join('')}</div></div>`;
    const colors = (key, title) => `<div class="opt-row"><span class="opt-label">${title}</span><div class="opts">${
      Object.entries(window.Pixel.FUR).map(([name, c]) => `<button type="button" class="swatch ${look[key] === name ? 'on' : ''}" data-look-key="${key}" data-look-value="${name}" title="${name}" aria-label="${name}" style="--c:${c.W};--d:${c.G}"></button>`).join('')}</div></div>`;
    const face = PARTS.slice(0, 5), more = PARTS.slice(5);
    return `<div class="look-top">
        <div class="look-preview">${dog(6, look)}</div>
        <div class="look-quick">
          <button type="button" class="btn small" data-look-random>🎲 랜덤</button>
          <div class="opts scroll presets">${PRESETS.map((l, i) => `<button type="button" class="opt" data-preset="${i}" aria-label="모습 ${i + 1}">${still(l, 3)}</button>`).join('')}</div>
        </div>
      </div>
      <details class="look-custom" open><summary>하나씩 바꾸기</summary>
        ${colors('fur', '털 색')}
        ${face.map(row).join('')}
        ${row(more[0])}
        ${colors('fur2', '무늬 색')}
        ${more.slice(1).map(row).join('')}
      </details>`;
  }

  function editPet(id) {
    const p = id ? state.pets.find(x => x.id === id) : null;
    openForm({
      title: p ? `${p.name} 정보 수정` : '새 친구 등록',
      icon: 'paw',
      fields: PET_FIELDS,
      values: p || {},
      submitText: p ? '저장' : '등록하기',
      onSubmit: async data => {
        data.look = JSON.parse(data.look);
        data.fur = data.look.fur;
        const obj = Object.assign({ id: uid() }, p, data);
        await store().put('pets', obj);
        if (p) {
          Object.assign(p, data);
          toast('정보를 고쳤어요');
        } else {
          state.pets.push(obj);
          state.activePetId = obj.id;
          toast(`${obj.name}, 반가워!`);
        }
        persist();
        render();
      },
    });
  }

  async function deletePet(id) {
    const p = state.pets.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`${p.name}의 모든 기록(접종, 몸무게, 약)을 지울까요? 되돌릴 수 없어요.`)) return;
    try {
      await store().del('pets', id); // DB 에서는 on delete cascade 로 하위 기록도 같이 지워져요
    } catch (e) {
      return toast(errText(e), 'bad');
    }
    state.pets = state.pets.filter(x => x.id !== id);
    for (const k of ['vaccines', 'weights', 'meds']) state[k] = state[k].filter(x => x.petId !== id);
    if (state.activePetId === id) state.activePetId = state.pets[0]?.id ?? null;
    persist();
    render();
  }

  // ---------- 헤더 ----------
  function renderHeader() {
    const p = pet();
    const { season, day, wd } = seasonDate();
    $('#clock').innerHTML = `<div class="clock-day">${wd}. ${day}</div><div class="clock-season">${sprite('sun', 2)}${season} ${day}일</div>`;
    $('#buddy').innerHTML = dog(5, p && petLook(p)) + '<span class="shadow"></span>';
    $('#signSub').textContent = p ? `${p.name}의 건강 수첩` : '우리 강아지 건강 수첩';
    const sw = $('#petSwitch');
    if (state.pets.length > 1) {
      sw.innerHTML = `<label class="sr" for="petSelect">강아지 선택</label><select id="petSelect">${state.pets.map(x =>
        `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
    } else {
      sw.innerHTML = '';
    }
    $$('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
      t.disabled = !p && t.dataset.tab !== 'settings' && t.dataset.tab !== 'home';
    });
  }

  // ---------- 홈 ----------
  function latestPerVaccine() {
    const byName = new Map();
    for (const v of mine(state.vaccines)) {
      const cur = byName.get(v.name);
      if (!cur || v.date > cur.date) byName.set(v.name, v);
    }
    return [...byName.values()];
  }

  function quests() {
    const q = [];
    for (const v of latestPerVaccine()) {
      if (v.nextDate && daysUntil(v.nextDate) <= SOON_DAYS) {
        q.push({ icon: 'syringe', date: v.nextDate, text: `${v.name} 접종하기`, tab: 'vaccines' });
      }
    }
    for (const m of mine(state.meds)) {
      const d = medDeadline(m);
      if (m.status !== '다 씀' && d && daysUntil(d) <= SOON_DAYS) {
        q.push({ icon: 'pill', date: d, text: `${m.name} 기한 확인`, tab: 'meds', over: '기한 지남' });
      }
    }
    const ws = sortedWeights();
    const last = ws[ws.length - 1];
    if (!last || daysUntil(last.date) < -SOON_DAYS) {
      q.push({ icon: 'scale', date: '', text: last ? `몸무게 잰 지 ${-daysUntil(last.date)}일 됐어요` : '첫 몸무게 재기', tab: 'weights' });
    }
    return q.sort((a, b) => (a.date || '0').localeCompare(b.date || '0'));
  }

  function renderHome() {
    const p = pet();
    if (!p) {
      return `<section class="panel welcome">
        ${dog(8)}
        <h2>멍다이어리에 오신 걸 환영해요!</h2>
        <p>접종 기록, 몸무게 변화, 처방받은 약까지<br>병원 갈 때마다 헷갈리던 것들을 여기 모아둬요.</p>
        <button class="btn btn-ok big" data-action="add-pet">${sprite('paw', 2)} 첫 친구 등록하기</button>
      </section>`;
    }
    const ws = sortedWeights();
    const last = ws[ws.length - 1];
    const prev = ws[ws.length - 2];
    const diff = last && prev ? Number(last.kg) - Number(prev.kg) : null;
    const activeMeds = mine(state.meds).filter(m => m.status === '먹는 중');
    const q = quests();

    return `<div class="grid-2">
      <section class="panel pet-card">
        <div class="pet-portrait">${dog(6, petLook(p))}</div>
        <div class="pet-info">
          <h2>${esc(p.name)} ${sprite('heart', 2)}</h2>
          <dl class="kv">
            ${p.breed ? `<dt>견종</dt><dd>${esc(p.breed)}</dd>` : ''}
            ${p.birthday ? `<dt>나이</dt><dd>${ageText(p.birthday)} <small>(${fmt(p.birthday)})</small></dd>` : ''}
            ${p.sex ? `<dt>성별</dt><dd>${esc(p.sex)}</dd>` : ''}
            <dt>몸무게</dt><dd>${last ? `${Number(last.kg)}kg ${diffTag(diff)}` : '<span class="muted">아직 없어요</span>'}</dd>
            ${p.regNo ? `<dt>등록번호</dt><dd>${esc(p.regNo)}</dd>` : ''}
          </dl>
          ${p.note ? `<p class="note">${sprite('sparkle', 2)} ${esc(p.note)}</p>` : ''}
          <button class="btn small" data-action="edit-pet" data-id="${p.id}">정보 수정</button>
        </div>
      </section>

      <section class="panel board">
        <h2 class="title">${sprite('scroll', 3)} 할 일 게시판</h2>
        ${q.length ? `<ul class="quests">${q.map(x => `
          <li><button class="quest" data-goto="${x.tab}">${sprite(x.icon, 2)}<span>${esc(x.text)}</span>${x.date ? ddayBadge(x.date, x.over) : ''}</button></li>`).join('')}</ul>`
          : `<div class="empty">${sprite('bone', 3)}<p>지금은 할 일이 없어요!<br>오늘은 산책이나 가요</p></div>`}
      </section>
    </div>

    <section class="panel">
      <h2 class="title">${sprite('pill', 3)} 지금 먹는 약</h2>
      ${activeMeds.length ? `<div class="mini-meds">${activeMeds.map(m => `
        <button class="mini-med" data-goto="meds">
          <strong>${esc(m.name)}</strong>
          <span>${esc(m.purpose || '용도 미입력')}</span>
          <small>${esc(m.dosage || '')}</small>
        </button>`).join('')}</div>`
        : '<p class="muted">먹는 중인 약이 없어요.</p>'}
    </section>

    <div class="stats">
      <button class="stat panel" data-goto="vaccines">${sprite('syringe', 3)}<b>${mine(state.vaccines).length}</b><span>접종 기록</span></button>
      <button class="stat panel" data-goto="weights">${sprite('scale', 3)}<b>${ws.length}</b><span>몸무게 기록</span></button>
      <button class="stat panel" data-goto="meds">${sprite('pill', 3)}<b>${mine(state.meds).length}</b><span>약상자</span></button>
    </div>`;
  }

  function diffTag(diff) {
    if (diff === null || Math.abs(diff) < 0.005) return diff === null ? '' : '<span class="diff">-</span>';
    const up = diff > 0;
    return `<span class="diff ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(diff).toFixed(2).replace(/\.?0+$/, '')}</span>`;
  }

  // ---------- 접종 ----------
  function renderVaccines() {
    const list = mine(state.vaccines).sort((a, b) => b.date.localeCompare(a.date));
    const upcoming = latestPerVaccine().filter(v => v.nextDate).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    return `<section class="panel">
      <div class="head-row">
        <h2 class="title">${sprite('syringe', 3)} 접종 기록</h2>
        <button class="btn btn-ok" data-action="add-vaccine">+ 기록하기</button>
      </div>
      ${upcoming.length ? `<h3 class="sub">다음 접종 일정</h3>
      <ul class="chips-row">${upcoming.map(v => `<li class="sched">${esc(v.name)} <small>${fmt(v.nextDate)}</small> ${ddayBadge(v.nextDate)}</li>`).join('')}</ul>` : ''}
      ${list.length ? `<ul class="records">${list.map(v => `
        <li class="record">
          <div class="rec-date">${fmt(v.date)}</div>
          <div class="rec-main">
            <strong>${esc(v.name)}</strong>
            <div class="rec-meta">${v.hospital ? `${esc(v.hospital)}` : ''}${v.nextDate ? `<span>다음: ${fmt(v.nextDate)}</span>` : ''}</div>
            ${v.memo ? `<p class="memo">${esc(v.memo)}</p>` : ''}
          </div>
          <div class="rec-actions">
            <button class="icon-btn" data-action="edit-vaccine" data-id="${v.id}" aria-label="수정">✎</button>
            <button class="icon-btn" data-action="del-vaccine" data-id="${v.id}" aria-label="삭제">✕</button>
          </div>
        </li>`).join('')}</ul>`
        : `<div class="empty">${sprite('syringe', 4)}<p>아직 접종 기록이 없어요.<br>수첩에 적힌 것부터 옮겨볼까요?</p></div>`}
    </section>`;
  }

  function editVaccine(id) {
    const v = id && state.vaccines.find(x => x.id === id);
    openForm({
      title: v ? '접종 기록 수정' : '접종 기록하기',
      icon: 'syringe',
      fields: VACCINE_FIELDS,
      values: v || {},
      onSubmit: async data => { await upsert('vaccines', data, v?.id); toast('접종 기록 완료!'); },
    });
  }

  // ---------- 몸무게 ----------
  function weightChart(all) {
    const pts = all.slice(-24);
    if (pts.length < 2) {
      return `<div class="empty">${sprite('scale', 4)}<p>몸무게를 2번 이상 기록하면<br>그래프가 그려져요</p></div>`;
    }
    const W = 640, H = 240, pl = 48, pr = 20, pt = 18, pb = 36;
    const kgs = pts.map(w => Number(w.kg));
    let min = Math.min(...kgs), max = Math.max(...kgs);
    const padKg = Math.max(0.2, (max - min) * 0.2);
    min = Math.max(0, min - padKg); max += padKg;
    const x = i => Math.round(pl + i * (W - pl - pr) / (pts.length - 1));
    const y = k => Math.round(pt + (max - k) / (max - min) * (H - pt - pb));
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const k = min + (max - min) * i / 4;
      const yy = y(k);
      grid += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/>
        <text x="${pl - 8}" y="${yy + 4}" text-anchor="end" class="axis">${k.toFixed(1)}</text>`;
    }
    const every = Math.ceil(pts.length / 6);
    const labels = pts.map((w, i) => (i % every === 0 || i === pts.length - 1)
      ? `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" class="axis">${w.date.slice(5).replace('-', '.')}</text>` : '').join('');
    const line = pts.map((w, i) => `${x(i)},${y(Number(w.kg))}`).join(' ');
    const dots = pts.map((w, i) => `<rect x="${x(i) - 5}" y="${y(Number(w.kg)) - 5}" width="10" height="10" class="dot"><title>${fmt(w.date)} · ${Number(w.kg)}kg</title></rect>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="몸무게 변화 그래프" shape-rendering="crispEdges">
      ${grid}<polyline points="${line}" class="line-shadow" transform="translate(3,3)"/><polyline points="${line}" class="line"/>${dots}${labels}
    </svg>`;
  }

  function renderWeights() {
    const ws = sortedWeights();
    const kgs = ws.map(w => Number(w.kg));
    const last = ws[ws.length - 1];
    const first = ws[0];
    return `<section class="panel">
      <div class="head-row">
        <h2 class="title">${sprite('scale', 3)} 몸무게 변화</h2>
        <button class="btn btn-ok" data-action="add-weight">+ 기록하기</button>
      </div>
      ${ws.length ? `<div class="weight-stats">
        <div><span>지금</span><b>${Number(last.kg)}kg</b>${diffTag(ws.length > 1 ? kgs[kgs.length - 1] - kgs[kgs.length - 2] : null)}</div>
        <div><span>처음 대비</span><b>${ws.length > 1 ? diffTag(Number(last.kg) - Number(first.kg)) || '-' : '-'}</b><small>${fmt(first.date)}~</small></div>
        <div><span>최저 / 최고</span><b>${Math.min(...kgs)} / ${Math.max(...kgs)}</b></div>
      </div>` : ''}
      <div class="chart-wrap">${weightChart(ws)}</div>
    </section>
    ${ws.length ? `<section class="panel">
      <h3 class="sub">기록 목록</h3>
      <ul class="records">${ws.slice().reverse().map((w, i, arr) => {
        const older = arr[i + 1];
        return `<li class="record">
          <div class="rec-date">${fmt(w.date)}</div>
          <div class="rec-main"><strong>${Number(w.kg)}kg</strong> ${older ? diffTag(Number(w.kg) - Number(older.kg)) : ''}
            ${w.memo ? `<p class="memo">${esc(w.memo)}</p>` : ''}</div>
          <div class="rec-actions">
            <button class="icon-btn" data-action="edit-weight" data-id="${w.id}" aria-label="수정">✎</button>
            <button class="icon-btn" data-action="del-weight" data-id="${w.id}" aria-label="삭제">✕</button>
          </div>
        </li>`;
      }).join('')}</ul>
    </section>` : ''}`;
  }

  function editWeight(id) {
    const w = id && state.weights.find(x => x.id === id);
    openForm({
      title: w ? '몸무게 수정' : '몸무게 기록하기',
      icon: 'scale',
      fields: WEIGHT_FIELDS,
      values: w || {},
      onSubmit: async data => {
        if (!(Number(data.kg) > 0)) throw new Error('몸무게를 숫자로 적어주세요');
        await upsert('weights', data, w?.id);
        toast('몸무게 기록 완료!');
      },
    });
  }

  // ---------- 약상자 ----------
  function renderMeds() {
    const q = medQuery.toLowerCase();
    const all = mine(state.meds);
    const list = all
      .filter(m => {
        const d = medDeadline(m);
        if (medFilter === '기한 지남') return d && daysUntil(d) < 0;
        if (medFilter !== '전체') return m.status === medFilter;
        return true;
      })
      .filter(m => !q || [m.name, m.purpose, m.hospital, m.memo, m.caution, m.kind].some(s => (s || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        const sa = MED_STATUS.indexOf(a.status), sb = MED_STATUS.indexOf(b.status);
        if (sa !== sb) return sa - sb;
        return (medDeadline(a) || '9999').localeCompare(medDeadline(b) || '9999');
      });

    const row = (k, v) => (v ? `<div class="kv-row"><dt>${k}</dt><dd>${v}</dd></div>` : '');

    return `<section class="panel">
      <div class="head-row">
        <h2 class="title">${sprite('pill', 3)} 약상자</h2>
        <div class="btn-row">
          <label class="btn btn-ok">${sprite('camera', 2)} 사진으로 등록<input type="file" class="photo-input" accept="image/*" hidden></label>
          <button class="btn" data-action="add-med">+ 직접 등록</button>
        </div>
      </div>
      <p class="muted">"이 약 뭐였지? 아직 먹여도 되나?" 약봉투나 약병을 찍어 올리면 AI가 찾아서 정리해줘요.</p>
      <div class="toolbar">
        <input type="search" id="medSearch" placeholder="약 이름, 증상으로 찾기" value="${esc(medQuery)}" aria-label="약 검색">
        <div class="chips-row">${['전체', ...MED_STATUS, '기한 지남'].map(f =>
          `<button class="chip ${f === medFilter ? 'on' : ''}" data-medfilter="${f}">${f}</button>`).join('')}</div>
      </div>
    </section>
    ${list.length ? `<div class="med-grid">${list.map(m => {
      const d = medDeadline(m);
      const openNote = m.openedDate && Number(m.openDays) > 0
        ? `${fmt(m.openedDate)} 개봉 · 개봉 후 ${Number(m.openDays)}일` : (m.openedDate ? `${fmt(m.openedDate)} 개봉` : '');
      return `<article class="panel med ${m.status === '다 씀' ? 'done' : ''}">
        <header class="med-head">
          ${sprite('pill', 3)}
          <div>
            <h3>${esc(m.name)}</h3>
            <div class="tags"><span class="tag">${esc(m.kind || '약')}</span><span class="tag status-${MED_STATUS.indexOf(m.status)}">${esc(m.status || '')}</span></div>
          </div>
          ${m.status !== '다 씀' ? ddayBadge(d, '기한 지남') : ''}
        </header>
        ${m.photoPath ? `<button class="med-photo" data-photo="${esc(m.photoPath)}" aria-label="약 사진 크게 보기"><img alt="" data-photo-src="${esc(m.photoPath)}"></button>` : ''}
        <dl class="kv med-kv">
          ${row('어디에 써요?', esc(m.purpose) || '<span class="muted">미입력</span>')}
          ${row('먹이는 법', esc(m.dosage))}
          ${row('사용 기한', d ? `<b>${fmt(d)}</b>까지` : '<span class="muted">미입력</span>')}
          ${row('유통기한', m.expiryDate && d !== m.expiryDate ? fmt(m.expiryDate) : '')}
          ${row('개봉', esc(openNote))}
          ${row('보관', esc(m.storage))}
          ${row('처방', [m.prescribedDate && fmt(m.prescribedDate), esc(m.hospital)].filter(Boolean).join(' · '))}
        </dl>
        ${m.caution ? `<p class="caution">⚠ ${esc(m.caution)}</p>` : ''}
        ${m.memo ? `<p class="memo">${esc(m.memo)}</p>` : ''}
        <div class="med-actions">
          ${searchLinks(m.name)}
          <button class="btn small" data-action="ask-med" data-id="${m.id}">${sprite('bubble', 1)} 물어보기</button>
          <button class="btn small" data-action="edit-med" data-id="${m.id}">수정</button>
          <button class="btn small" data-action="del-med" data-id="${m.id}">삭제</button>
        </div>
      </article>`;
    }).join('')}</div>`
      : `<section class="panel"><div class="empty">${sprite('pill', 4)}<p>${all.length ? '찾는 약이 없어요' : '약상자가 비어있어요.<br>처방받은 약을 넣어볼까요?'}</p></div></section>`}`;
  }

  function editMed(id, prefill, onSaved) {
    const m = id && state.meds.find(x => x.id === id);
    const values = m || prefill || {};
    openForm({
      title: m ? '약 정보 수정' : '약 등록하기',
      icon: 'pill',
      fields: MED_FIELDS,
      values,
      onSubmit: async data => {
        if (values.photoPath) data.photoPath = values.photoPath;
        await upsert('meds', data, m?.id);
        toast('약상자에 넣었어요!');
        if (onSaved) onSaved();
      },
    });
  }

  // ---------- 약 사진 ----------
  const photoUrls = new Map(); // path → { url, until }

  async function hydratePhotos() {
    if (mode !== 'cloud') return;
    for (const img of $$('img[data-photo-src]')) {
      const path = img.dataset.photoSrc;
      try {
        img.src = await photoUrl(path);
      } catch (e) {
        img.closest('.med-photo')?.remove();
      }
    }
  }

  async function photoUrl(path) {
    const hit = photoUrls.get(path);
    if (hit && hit.until > Date.now()) return hit.url;
    const { data, error } = await sb.storage.from('med-photos').createSignedUrl(path, 3600);
    if (error) throw error;
    photoUrls.set(path, { url: data.signedUrl, until: Date.now() + 3000 * 1000 });
    return data.signedUrl;
  }

  // 큰 사진은 줄여서 AI 와 저장소에 보내요 (긴 변 1568px, JPEG)
  async function prepImage(file) {
    let bmp;
    try {
      bmp = await createImageBitmap(file);
    } catch (e) {
      throw new Error('이 사진 형식은 읽을 수 없어요. JPG나 PNG로 다시 올려주세요');
    }
    const k = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
    const b64 = await new Promise(r => {
      const fr = new FileReader();
      fr.onload = () => r(String(fr.result).split(',')[1]);
      fr.readAsDataURL(blob);
    });
    return { blob, b64, url: URL.createObjectURL(blob) };
  }

  // ---------- AI 물어보기 ----------
  let chat = [];
  let chatBusy = false;
  let chatDraft = '';

  const SUGGESTIONS = [
    '지금 먹는 약들 같이 먹여도 괜찮아?',
    '유통기한 지난 약 먹여도 돼?',
    '사람 진통제 먹여도 돼?',
    '약을 안 먹으려고 할 때 먹이는 요령',
  ];

  function aiContext() {
    const p = pet();
    if (!p) return {};
    const ws = sortedWeights();
    return {
      pet: { name: p.name, breed: p.breed, age: ageText(p.birthday), sex: p.sex, weight: ws.length ? String(ws[ws.length - 1].kg) : '', note: p.note },
      meds: mine(state.meds).map(m => ({ name: m.name, purpose: m.purpose, dosage: m.dosage, status: m.status, deadline: medDeadline(m) })),
    };
  }

  async function callAI(body) {
    const { data, error } = await sb.functions.invoke('med-ai', { body });
    if (error) {
      let msg = error.message;
      try {
        const j = await error.context.json();
        msg = j.error || j.message || msg;
      } catch (e) { /* 본문 없음 */ }
      throw new Error(msg);
    }
    return data;
  }

  const fmtAI = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  function scanAsText(r) {
    if (!r.found) return `사진 인식 결과: ${r.summary}`;
    return '사진 인식 결과:\n' + r.medicines.map(m =>
      `- ${m.name}: ${m.purpose} / 복용: ${m.dosage} / 주의: ${m.cautions}`).join('\n');
  }

  function chatHistory() {
    const out = [];
    for (const m of chat) {
      let role, text;
      if (m.role === 'user') { role = 'user'; text = m.text; }
      else if (m.role === 'assistant') { role = 'assistant'; text = m.text; }
      else if (m.role === 'scan') { role = 'assistant'; text = scanAsText(m.result); }
      else continue;
      const last = out[out.length - 1];
      if (last && last.role === role) last.text += '\n\n' + text;
      else out.push({ role, text });
    }
    return out;
  }

  async function sendAsk(text) {
    text = text.trim();
    if (!text || chatBusy) return;
    chat.push({ role: 'user', text });
    chat.push({ role: 'pending', text: '생각하고 있어요...' });
    chatBusy = true;
    chatDraft = '';
    render();
    try {
      const r = await callAI({ mode: 'ask', messages: chatHistory(), context: aiContext() });
      chat.splice(chat.length - 1, 1, { role: 'assistant', text: r.text, sources: r.sources || [] });
    } catch (e) {
      chat.splice(chat.length - 1, 1, { role: 'error', text: errText(e) });
    }
    chatBusy = false;
    render();
  }

  async function startScan(file) {
    if (mode !== 'cloud') {
      toast('사진 인식은 로그인해야 쓸 수 있어요', 'bad');
      return go('ask');
    }
    if (chatBusy) return toast('앞의 질문에 답하는 중이에요');
    let photo;
    try {
      photo = await prepImage(file);
    } catch (e) {
      return toast(errText(e), 'bad');
    }
    tab = 'ask';
    pref.set('tab', tab);
    chat.push({ role: 'user', text: '이 약 뭐예요?', img: photo.url });
    chat.push({ role: 'pending', text: '사진을 읽고 약 정보를 찾는 중이에요... (30초~1분)' });
    chatBusy = true;
    render();
    try {
      const r = await callAI({ mode: 'scan', image: photo.b64, mediaType: 'image/jpeg', context: aiContext() });
      chat.splice(chat.length - 1, 1, { role: 'scan', result: r, photo, saved: [] });
    } catch (e) {
      chat.splice(chat.length - 1, 1, { role: 'error', text: errText(e) });
    }
    chatBusy = false;
    render();
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function scanToMed(r) {
    const kinds = MED_FIELDS.find(f => f.name === 'kind').options;
    const storages = MED_FIELDS.find(f => f.name === 'storage').options;
    return {
      name: r.name || '이름 모를 약',
      kind: kinds.includes(r.kind) ? r.kind : '기타',
      purpose: r.purpose,
      dosage: r.dosage,
      caution: r.cautions,
      storage: storages.includes(r.storage) ? r.storage : '실온',
      expiryDate: DATE_RE.test(r.expiry_date) ? r.expiry_date : '',
      prescribedDate: DATE_RE.test(r.prescribed_date) ? r.prescribed_date : '',
      hospital: r.hospital,
      openedDate: '',
      openDays: r.open_days > 0 ? String(r.open_days) : '',
      status: '먹는 중',
      memo: [r.notes, 'AI가 사진에서 정리한 정보예요. 처방 지시가 우선이에요.'].filter(Boolean).join('\n'),
    };
  }

  // 사진은 한 번만 올리고, 같은 사진에서 나온 약들이 같이 써요
  async function uploadScanPhoto(msg) {
    if (msg.photoPath || !msg.photo) return msg.photoPath || '';
    const path = `${user.id}/${uid()}.jpg`;
    const { error } = await sb.storage.from('med-photos').upload(path, msg.photo.blob, { contentType: 'image/jpeg' });
    if (error) {
      toast('사진은 저장하지 못했어요 (약 정보는 저장돼요)', 'bad');
      return '';
    }
    msg.photoPath = path;
    return path;
  }

  async function saveScanMed(mi, i, edit) {
    const msg = chat[mi];
    const med = scanToMed(msg.result.medicines[i]);
    const markSaved = () => { msg.saved.push(i); render(); };
    try {
      med.photoPath = await uploadScanPhoto(msg);
      if (edit) return editMed(null, med, markSaved);
      await upsert('meds', med);
      markSaved();
      toast(`${med.name} 약상자에 넣었어요!`);
    } catch (e) {
      toast(errText(e), 'bad');
    }
  }

  function renderScan(m, mi) {
    const r = m.result;
    const row = (k, v) => (v ? `<div class="kv-row"><dt>${k}</dt><dd>${fmtAI(v)}</dd></div>` : '');
    const conf = { high: '확실해요', medium: '아마도', low: '잘 모르겠어요' };
    return `<div class="msg ai wide">
      <div class="who">${sprite('bubble', 2)} 약 도우미</div>
      <p>${fmtAI(r.summary || '')}</p>
      ${(r.medicines || []).map((x, i) => `<div class="scan-med">
        <div class="scan-head"><b>${esc(x.name)}</b><span class="tag">${esc(x.kind)}</span><span class="tag conf-${esc(x.confidence)}">${conf[x.confidence] || ''}</span></div>
        ${searchLinks(x.name)}
        <dl class="kv med-kv">
          ${row('어디에 써요?', x.purpose)}${row('먹이는 법', x.dosage)}${row('주의사항', x.cautions)}
          ${row('보관', x.storage)}${row('유통기한', DATE_RE.test(x.expiry_date) ? x.expiry_date : '')}${row('개봉 후', x.open_days > 0 ? `${x.open_days}일` : '')}
          ${row('처방', [DATE_RE.test(x.prescribed_date) && x.prescribed_date, x.hospital].filter(Boolean).join(' · '))}${row('참고', x.notes)}
        </dl>
        <div class="med-actions">${m.saved.includes(i)
          ? `<span class="saved">${sprite('sparkle', 2)} 약상자에 저장했어요</span>`
          : `<button class="btn small" data-scan-save="${mi}:${i}:edit">고쳐서 저장</button>
             <button class="btn small btn-ok" data-scan-save="${mi}:${i}">약상자에 저장</button>`}</div>
      </div>`).join('')}
      ${sourcesHTML(r.sources)}
    </div>`;
  }

  // 인터넷 검색은 무료 AI 에서 막힌 경우가 많아서, 바로 찾아볼 수 있는 버튼을 달아요
  function searchLinks(name) {
    const q = encodeURIComponent(`${String(name || '').split('(')[0].trim()} 강아지 약`);
    if (!name) return '';
    return `<div class="search-links">
      <a class="chip" href="https://search.naver.com/search.naver?query=${q}" target="_blank" rel="noopener">네이버에서 찾기</a>
      <a class="chip" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">구글에서 찾기</a></div>`;
  }

  const sourcesHTML = list => (list && list.length ? `<details class="sources"><summary>참고한 곳 ${list.length}개</summary><ul>${
    list.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title || x.url)}</a></li>`).join('')}</ul></details>` : '');

  function renderAsk() {
    const head = `<h2 class="title">${sprite('bubble', 3)} 약 물어보기</h2>`;
    if (mode !== 'cloud') {
      return `<section class="panel welcome">${head}
        <p>AI 약 도우미는 로그인해야 쓸 수 있어요.<br>사진 한 장으로 약 이름, 먹이는 법, 주의사항을 찾아줘요.</p>
        ${sb ? '<button class="btn btn-ok" data-action="go-login">로그인하러 가기</button>'
        : '<p class="muted">Supabase 연결이 필요해요 (docs/SETUP.md).</p>'}
      </section>`;
    }
    const msgs = chat.map((m, i) => {
      if (m.role === 'user') return `<div class="msg me">${m.img ? `<img src="${m.img}" alt="올린 약 사진">` : ''}<p>${esc(m.text)}</p></div>`;
      if (m.role === 'scan') return renderScan(m, i);
      if (m.role === 'pending') return `<div class="msg ai pending"><div class="who">${dog(2, petLook(pet()))} </div><p>${esc(m.text)}</p></div>`;
      if (m.role === 'error') return `<div class="msg ai error"><p>${esc(m.text)}</p></div>`;
      return `<div class="msg ai"><div class="who">${sprite('bubble', 2)} 약 도우미</div><p>${fmtAI(m.text)}</p>${sourcesHTML(m.sources)}</div>`;
    }).join('');
    return `<section class="panel ask">
      <div class="head-row">${head}
        ${chat.length ? '<button class="btn small" data-action="chat-clear">새 대화</button>' : ''}</div>
      <div class="msgs" id="msgs">${msgs || `<div class="empty">${sprite('pill', 4)}
        <p>약봉투·약병 사진을 올리거나 궁금한 걸 물어보세요.<br>${esc(pet()?.name || '우리 강아지')} 정보와 약상자를 참고해서 답해요.</p>
        <div class="chips-row center">${SUGGESTIONS.map(q => `<button class="chip" data-suggest="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`}</div>
      <form id="askForm" class="ask-form">
        <label class="btn" title="약 사진 올리기">${sprite('camera', 2)}<span class="sr">사진</span><input type="file" class="photo-input" accept="image/*" hidden></label>
        <input id="askInput" name="q" placeholder="예) 이 약 밥 먹기 전에 줘도 돼?" autocomplete="off" value="${esc(chatDraft)}" ${chatBusy ? 'disabled' : ''}>
        <button class="btn btn-ok" type="submit" ${chatBusy ? 'disabled' : ''}>보내기</button>
      </form>
      <p class="disclaimer">AI 답변은 참고용이에요. 수의사 처방과 지시가 항상 먼저예요.</p>
    </section>`;
  }

  // ---------- 가방(설정) ----------
  function renderSettings() {
    return `<section class="panel">
      <div class="head-row">
        <h2 class="title">${sprite('paw', 3)} 우리 강아지들</h2>
        <button class="btn btn-ok" data-action="add-pet">+ 새 친구</button>
      </div>
      ${state.pets.length ? `<ul class="pet-list">${state.pets.map(p => `
        <li class="${p.id === pet().id ? 'current' : ''}">
          <button class="pet-pick" data-pick="${p.id}">${window.Pixel.dogStill(3, petLook(p))}<span><b>${esc(p.name)}</b><small>${esc([p.breed, ageText(p.birthday)].filter(Boolean).join(' · '))}</small></span></button>
          <button class="btn small" data-action="edit-pet" data-id="${p.id}">수정</button>
          <button class="btn small" data-action="del-pet" data-id="${p.id}">삭제</button>
        </li>`).join('')}</ul>` : '<p class="muted">아직 등록된 친구가 없어요.</p>'}
    </section>
    ${renderAccount()}
    <section class="panel">
      <h2 class="title">${sprite('chest', 3)} 백업 상자</h2>
      <p>${mode === 'cloud'
        ? '기록은 계정(Supabase)에 저장돼요. 혹시 모를 때를 위해 가끔 백업 파일을 받아두면 좋아요.'
        : '기록은 이 브라우저 안에만 저장돼요. 브라우저 데이터를 지우거나 다른 기기에서 보려면 백업 파일을 받아두세요.'}</p>
      <div class="btn-row">
        <button class="btn btn-ok" data-action="export">백업 파일 받기</button>
        <label class="btn">백업 불러오기<input type="file" id="importFile" accept="application/json,.json" hidden></label>
      </div>
    </section>`;
  }

  function renderAccount() {
    if (!sb) return '';
    if (mode === 'local') {
      return `<section class="panel">
        <h2 class="title">${sprite('heart', 3)} 계정</h2>
        <p>지금은 로그인 없이 이 브라우저에만 저장하고 있어요. 로그인하면 폰·컴퓨터 어디서든 같은 기록을 볼 수 있어요.</p>
        <button class="btn btn-ok" data-action="go-login">로그인하러 가기</button>
      </section>`;
    }
    const local = loadLocal();
    return `<section class="panel">
      <h2 class="title">${sprite('heart', 3)} 계정</h2>
      <p><b>${esc(user?.email)}</b> 으로 로그인했어요. 기록이 자동으로 저장돼요.</p>
      ${local.pets.length ? `<p class="note">${sprite('sparkle', 2)} 이 브라우저에 로그인 전에 쓴 기록이 있어요 (${local.pets.map(p => esc(p.name)).join(', ')}).</p>` : ''}
      <div class="btn-row">
        ${local.pets.length ? '<button class="btn btn-ok" data-action="migrate">이 기기 기록을 계정으로 옮기기</button>' : ''}
        <button class="btn" data-action="reload">새로고침</button>
        <button class="btn" data-action="logout">로그아웃</button>
      </div>
    </section>`;
  }

  async function migrateLocal() {
    const local = loadLocal();
    if (!confirm(`이 브라우저에 있던 ${local.pets.length}마리의 기록을 계정에 추가할까요?`)) return;
    try {
      await cloudStore.upload(local);
      try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
      toast('계정으로 옮겼어요!');
    } catch (e) {
      toast(errText(e), 'bad');
    }
    refresh();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mungdiary-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('백업 파일을 저장했어요');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      let s;
      try {
        s = JSON.parse(reader.result);
        if (!s || !Array.isArray(s.pets)) throw new Error('format');
      } catch (e) {
        return toast('멍다이어리 백업 파일이 아니에요', 'bad');
      }
      if (!confirm('지금 기록을 백업 파일 내용으로 바꿀까요? 지금 기록은 지워져요.')) return;
      if (mode === 'cloud') {
        try {
          await cloudStore.upload(s, { replace: true });
          toast('백업을 불러왔어요!');
        } catch (e) {
          toast(errText(e), 'bad');
        }
        return refresh();
      }
      state = Object.assign(blank(), s);
      persist();
      render();
      toast('백업을 불러왔어요!');
    };
    reader.readAsText(file);
  }

  // ---------- 렌더 ----------
  const VIEWS = { home: renderHome, vaccines: renderVaccines, weights: renderWeights, meds: renderMeds, ask: renderAsk, settings: renderSettings };

  function renderLogin() {
    return `<section class="panel welcome login">
      ${dog(8)}
      <h2>멍다이어리에 로그인</h2>
      <p>로그인하면 폰·컴퓨터 어디서든 같은 기록을 볼 수 있어요.</p>
      <form id="loginForm" class="login-form">
        <div class="field"><label for="loginEmail">이메일</label>
          <input id="loginEmail" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="loginPw">비밀번호 (6자 이상)</label>
          <input id="loginPw" name="password" type="password" autocomplete="current-password" minlength="6" required></div>
        <div class="btn-row">
          <button class="btn btn-ok" type="submit" data-auth="in">로그인</button>
          <button class="btn" type="submit" data-auth="up">처음이에요 (회원가입)</button>
        </div>
      </form>
      <button class="link" data-action="go-local">로그인 없이 이 기기에만 저장하기</button>
    </section>`;
  }

  async function handleAuth(form, kind) {
    if (!form.reportValidity()) return;
    const email = form.email.value.trim();
    const password = form.password.value;
    $$('button', form).forEach(b => { b.disabled = true; });
    try {
      if (kind === 'up') {
        const { data, error } = await sb.auth.signUp({
          email, password, options: { emailRedirectTo: location.origin + location.pathname },
        });
        if (error) throw error;
        if (!data.session) toast('메일함에서 인증 링크를 눌러주세요!');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      toast(errText(e), 'bad');
    }
    $$('button', form).forEach(b => { b.disabled = false; });
  }

  function renderFoot() {
    $('#foot').textContent = mode === 'cloud'
      ? `${user?.email} 계정에 저장 중`
      : mode === 'local' ? '기록은 이 브라우저에만 저장돼요 · 가방 탭에서 백업할 수 있어요' : '';
  }

  function render() {
    renderFoot();
    if (mode === 'login' || mode === 'loading') {
      state = blank();
      renderHeader();
      $$('.tab').forEach(t => { t.disabled = true; });
      $('#main').innerHTML = mode === 'login' ? renderLogin()
        : `<section class="panel welcome">${dog(8)}<p>기록을 불러오는 중...</p></section>`;
      return;
    }
    if (!pet() && tab !== 'settings') tab = 'home';
    if (pet() && state.activePetId !== pet().id) state.activePetId = pet().id;
    renderHeader();
    $('#main').innerHTML = (VIEWS[tab] || renderHome)();
    if (tab === 'meds') hydratePhotos();
    // 새 답은 첫 줄부터 읽을 수 있게 마지막 말풍선의 위쪽으로 스크롤해요
    const msgs = $('#msgs');
    if (msgs && msgs.lastElementChild) msgs.scrollTop = msgs.lastElementChild.offsetTop - 8;
  }

  function go(t) {
    tab = t;
    pref.set('tab', t);
    render();
    window.scrollTo({ top: $('#tabs').offsetTop - 8, behavior: 'smooth' });
  }

  const ACTIONS = {
    'add-pet': () => editPet(),
    'edit-pet': id => editPet(id),
    'del-pet': id => deletePet(id),
    'add-vaccine': () => editVaccine(),
    'edit-vaccine': id => editVaccine(id),
    'del-vaccine': id => remove('vaccines', id, state.vaccines.find(x => x.id === id)?.name),
    'add-weight': () => editWeight(),
    'edit-weight': id => editWeight(id),
    'del-weight': id => { const w = state.weights.find(x => x.id === id); remove('weights', id, `${fmt(w?.date)} ${w?.kg}kg`); },
    'add-med': () => editMed(),
    'edit-med': id => editMed(id),
    'del-med': async id => {
      const m = state.meds.find(x => x.id === id);
      if (!(await remove('meds', id, m?.name))) return;
      // 같은 사진을 쓰는 약이 더 없으면 사진도 지워요
      if (mode === 'cloud' && m?.photoPath && !state.meds.some(x => x.photoPath === m.photoPath)) {
        sb.storage.from('med-photos').remove([m.photoPath]);
      }
    },
    'ask-med': id => {
      const m = state.meds.find(x => x.id === id);
      chatDraft = `${m.name} 에 대해 더 알려줘. 먹일 때 주의할 점은?`;
      go('ask');
      $('#askInput')?.focus();
    },
    'chat-clear': () => { chat = []; render(); },
    'export': () => exportData(),
    'migrate': () => migrateLocal(),
    'reload': () => refresh(),
    'logout': async () => {
      if (!confirm('로그아웃할까요?')) return;
      await sb.auth.signOut();
    },
    'go-login': () => { pref.set('localOnly', null); mode = 'login'; render(); },
    'go-local': () => {
      pref.set('localOnly', '1');
      mode = 'local';
      state = loadLocal();
      render();
    },
  };

  // 로그인 상태가 바뀔 때마다 (처음 열 때 포함) 호출돼요
  function watchAuth() {
    sb.auth.onAuthStateChange((event, session) => {
      // 콜백 안에서 바로 supabase 를 호출하면 멈출 수 있어서 한 박자 늦춰요
      setTimeout(() => {
        if (session?.user) {
          if (mode === 'cloud' && user?.id === session.user.id) return;
          user = session.user;
          mode = 'cloud';
          pref.set('localOnly', null);
          render();
          refresh();
        } else if (mode !== 'local') {
          user = null;
          if (pref.get('localOnly')) {
            mode = 'local';
            state = loadLocal();
          } else {
            mode = 'login';
          }
          render();
        }
      }, 0);
    });
    // 다른 기기에서 고친 내용을 탭으로 돌아올 때 다시 불러와요
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && mode === 'cloud' && Date.now() - lastFetch > 30000) {
        refresh({ quiet: true });
      }
    });
  }

  // ---------- 이벤트 ----------
  function init() {
    window.Pixel.installCSSVars();
    $$('[data-sprite]').forEach(el => {
      const name = el.dataset.sprite;
      el.outerHTML = sprite(name, name === 'cloud' ? 6 : 2, { className: el.className });
    });

    $('#tabs').addEventListener('click', e => {
      const t = e.target.closest('[data-tab]');
      if (t && !t.disabled) go(t.dataset.tab);
    });

    $('#main').addEventListener('click', e => {
      const a = e.target.closest('[data-action]');
      if (a && ACTIONS[a.dataset.action]) return ACTIONS[a.dataset.action](a.dataset.id);
      const g = e.target.closest('[data-goto]');
      if (g) return go(g.dataset.goto);
      const f = e.target.closest('[data-medfilter]');
      if (f) { medFilter = f.dataset.medfilter; return render(); }
      const p = e.target.closest('[data-pick]');
      if (p) { state.activePetId = p.dataset.pick; persist(); return render(); }
      const sq = e.target.closest('[data-suggest]');
      if (sq) return sendAsk(sq.dataset.suggest);
      const ss = e.target.closest('[data-scan-save]');
      if (ss) {
        const [mi, i, edit] = ss.dataset.scanSave.split(':');
        ss.disabled = true;
        return saveScanMed(Number(mi), Number(i), !!edit);
      }
      const ph = e.target.closest('[data-photo]');
      if (ph) photoUrl(ph.dataset.photo).then(url => window.open(url, '_blank', 'noopener')).catch(err => toast(errText(err), 'bad'));
    });

    $('#main').addEventListener('input', e => {
      if (e.target.id === 'askInput') chatDraft = e.target.value;
      if (e.target.id !== 'medSearch') return;
      medQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const input = $('#medSearch');
      input.focus();
      input.setSelectionRange(pos, pos);
    });

    $('#main').addEventListener('submit', e => {
      if (e.target.id === 'askForm') {
        e.preventDefault();
        return sendAsk(e.target.q.value);
      }
      if (e.target.id !== 'loginForm') return;
      e.preventDefault();
      handleAuth(e.target, e.submitter?.dataset.auth || 'in');
    });

    $('#main').addEventListener('change', e => {
      if (e.target.id === 'importFile' && e.target.files[0]) importData(e.target.files[0]);
      if (e.target.classList.contains('photo-input') && e.target.files[0]) startScan(e.target.files[0]);
    });

    $('#petSwitch').addEventListener('change', e => {
      if (e.target.id !== 'petSelect') return;
      state.activePetId = e.target.value;
      persist();
      render();
    });

    $('#buddy').addEventListener('click', () => {
      const b = $('#buddy');
      b.classList.remove('happy');
      void b.offsetWidth;
      b.classList.add('happy');
      const p = pet();
      toast(p ? `${p.name}: 멍!` : '멍!');
    });

    $('#dialog').addEventListener('click', e => {
      if (e.target.id === 'dialog') e.target.close();
    });

    if (sb) watchAuth();
    render();
  }

  init();
})();
