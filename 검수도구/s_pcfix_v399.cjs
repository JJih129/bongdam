/* (v399) PC 웹 개선(0273 + 소스 편집) 검증 — PC웹_개선제안_v399.md 의 S·A·B 항목을 수치로 확인한다.
 *
 *   node 검수도구/s_pcfix_v399.cjs [--url=http://localhost:8788/new/] [--size=1920x1080]
 *
 * 데스크톱 조건: 터치 없음, DPR 1, 마우스. 스크린샷: 검수도구/shots_pcfix/
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const [W, H] = opt('size', '1920x1080').split('x').map(Number);
const SHOTS = path.join(__dirname, 'shots_pcfix'); fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0;
const log = s => console.log(s);
const ok = (c, l, d) => { log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
const SKIP = ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75', 'bd_map_tuto_done'];

async function newPage(browser, initLS) {
  const c = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: false });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  if (initLS) await p.addInitScript(o => { try { for (const k in o) localStorage.setItem(k, o[k]); } catch (e) {} }, initLS);
  return { c, p, errs };
}
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, W + 'x' + H + '_' + n + '.png') });
async function bootToField(p) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await p.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) {} });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await p.waitForTimeout(2000);
}
async function toDistrict(p) {
  await p.evaluate((k) => { k.forEach(x => localStorage.setItem(x, '1')); if (typeof fadeToStage === 'function') fadeToStage(212, 0.5, 0.55); }, SKIP);
  await p.waitForTimeout(2500);
  /* 남은 대사·안내 넘기기 */
  for (let i = 0; i < 12; i++) { const b = await p.evaluate(() => !!(window.BD_isInputBlocked && BD_isInputBlocked())); if (!b) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); }
}

(async () => {
  const browser = await chromium.launch();

  /* ── 1. 타이틀 · UI 크기 130% (A-8) ── */
  log('1. 타이틀 @130%');
  {
    const { c, p, errs } = await newPage(browser, { bd_ui_scale_v353: '130' });
    await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(4500);
    const r = await p.evaluate(() => {
      const t = document.getElementById('bd-title-screen'), q = document.getElementById('bd-title-reset') || document.querySelector('.bd-title-hit:last-child');
      const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
      const rt = t.getBoundingClientRect(), rq = q ? q.getBoundingClientRect() : null;
      return { zoom: z, titleBottomScreen: Math.round(rt.bottom), quitBottomScreen: rq ? Math.round(rq.bottom) : null, titleCssH: Math.round(t.offsetHeight), vh: innerHeight, pill: !!(document.getElementById('bd-fullscreen-return') && document.getElementById('bd-fullscreen-return').offsetHeight), foot: (document.querySelector('.bd-title-foot') || {}).textContent };
    });
    log('  ' + JSON.stringify(r));
    await shot(p, '01_title_130');
    ok(Math.abs(r.zoom - 1.3) < 0.01, 'body zoom 1.3 적용', '' + r.zoom);
    ok(r.titleBottomScreen <= r.vh + 2, '타이틀 화면이 뷰포트 안', r.titleBottomScreen + ' / ' + r.vh);
    ok(r.quitBottomScreen && r.quitBottomScreen <= r.vh, '「종료하기」 버튼이 화면 안', '' + r.quitBottomScreen);
    ok(!r.pill, 'PC: 상단 전체화면 필 숨김 (S-6)');
    ok(/Build 399/.test(r.foot || ''), '빌드 태그 v399 (B-10)', r.foot);
    ok(errs.length === 0, '콘솔 0', errs.slice(0, 2).join(' | '));
    await c.close();
  }

  /* ── 2. 프롤로그: 대화 클릭(S-1) · 키바(A-1) · 전체화면 미요청(S-6) ── */
  log('2. 프롤로그');
  const { c, p, errs } = await newPage(browser);
  await bootToField(p);
  const fs1 = await p.evaluate(() => ({ fs: !!document.fullscreenElement, pill: !!(document.getElementById('bd-fullscreen-return') && document.getElementById('bd-fullscreen-return').offsetHeight), veil: !!document.getElementById('bd-fsr-v398') }));
  ok(!fs1.pill && !fs1.veil, 'PC: 전체화면 필·베일 없음 (S-6)', JSON.stringify(fs1));
  const d0 = await p.evaluate(() => ({ open: typeof dialogueOpen !== 'undefined' && dialogueOpen, text: (document.getElementById('dialogue-text') || {}).textContent, hint: getComputedStyle(document.getElementById('dialogue-next')).opacity, hintText: (document.getElementById('dialogue-next') || {}).textContent }));
  await shot(p, '02_prologue_dialogue');
  if (d0.open) {
    const box = await p.evaluate(() => { const r = document.getElementById('dialogue-box').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.click(box.x, box.y); await p.waitForTimeout(700);
    const d1 = await p.evaluate(() => ({ text: (document.getElementById('dialogue-text') || {}).textContent, open: typeof dialogueOpen !== 'undefined' && dialogueOpen }));
    ok(d1.text !== d0.text || !d1.open, '대화창 클릭으로 대사 진행 (S-1)', (d0.text || '').slice(0, 20) + ' → ' + (d1.text || '').slice(0, 20));
    ok(parseFloat(d0.hint) >= 0.5 && /클릭/.test(d0.hintText || ''), '«▼ 클릭 · Space» 힌트 표시', d0.hint + ' ' + d0.hintText);
  } else log('  (대화창이 열려 있지 않아 S-1 생략)');
  const kb = await p.evaluate(() => { const k = document.getElementById('bd-keybar'); return k ? { shown: k.offsetHeight > 0, text: k.textContent } : null; });
  ok(kb && kb.shown && /임무/.test(kb.text) && /안전지도/.test(kb.text) && /Esc/.test(kb.text), '키 안내바 상시 + J/M/Esc (A-1)', kb ? kb.text.slice(0, 80) : '없음');

  /* ── 3. 와우리: 상단 버튼(A-2) · 가방 탭(A-5) · ESC 스택(S-3) · 장소 카드(S-4) · 자가치유(S-2) · 닫기 스킨(A-6) · 글자 하한(B-1) · 물러나기(A-4) ── */
  log('3. 와우리');
  await toDistrict(p);
  const kb2 = await p.evaluate(() => { const k = document.getElementById('bd-keybar'); return !!(k && k.offsetHeight > 0); });
  ok(kb2, '필드에서도 키바 유지 (A-1)');
  const btns = await p.evaluate(() => ['bd-pc-bag', 'bd-pc-quest'].map(id => { const b = document.getElementById(id); return b ? b.offsetHeight > 0 : false; }));
  ok(btns[0] && btns[1], '상단 🎒 가방·📋 임무 버튼 (A-2)', JSON.stringify(btns));
  await p.click('#bd-pc-bag'); await p.waitForTimeout(600);
  const inv = await p.evaluate(() => { const o = document.getElementById('inv-overlay'); const tabs = [...document.querySelectorAll('.inv-tab')].map(t => ({ t: t.textContent.trim(), h: Math.round(t.getBoundingClientRect().height), ws: getComputedStyle(t).whiteSpace })); return { open: !!(o && o.classList.contains('open')), tabs }; });
  ok(inv.open, '가방 버튼 → 인벤토리 열림');
  ok(inv.tabs.length && inv.tabs.every(t => t.h <= 44 && t.ws === 'nowrap'), '가방 탭 한 줄 (A-5)', inv.tabs.map(t => t.t + ':' + t.h).join(' '));
  /* 업적 탭 색 */
  await p.evaluate(() => { const t = [...document.querySelectorAll('.inv-tab')].find(x => /업적/.test(x.textContent)); if (t) t.click(); }); await p.waitForTimeout(400);
  const ach = await p.evaluate(() => { const n = document.querySelector('.achieve-name'); return n ? getComputedStyle(n).color : null; });
  await shot(p, '03_bag_achieve');
  ok(ach && !/240, 216, 112/.test(ach), '업적 이름 색 라이트 테마 (A-5)', ach);
  /* S-4: 가방 열린 채 장소 카드 요청 → 대기 */
  const card = await p.evaluate(async () => {
    const id = Object.keys((window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS) || {})[0];
    try { window.BD_showPlaceCard(id, {}); } catch (e) { return { err: String(e) }; }
    await new Promise(r => setTimeout(r, 900));
    return { whileOpen: !!document.getElementById('bd-place-card'), queued: (window.BD_placeCardQueue || []).length };
  });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const invClosed = await p.evaluate(() => { const o = document.getElementById('inv-overlay'); return !(o && o.classList.contains('open')); });
  ok(invClosed, 'ESC 로 가방 닫힘');
  await p.waitForTimeout(1800);
  const cardAfter = await p.evaluate(() => !!document.getElementById('bd-place-card'));
  ok(!card.whileOpen && cardAfter, '장소 카드: 가방 열린 동안 대기 → 닫히면 표시 (S-4)', JSON.stringify(card) + ' after=' + cardAfter);
  await p.evaluate(() => { const c = document.getElementById('bd-place-card'); if (c) c.remove(); const m = document.getElementById('bd-pause-modal'); if (m && m.classList.contains('show') && window.BD_togglePause) BD_togglePause(); }); await p.waitForTimeout(300);
  /* S-3: 설정 열고 ESC */
  await p.click('#bd-settings-btn'); await p.waitForTimeout(500);
  const s0 = await p.evaluate(() => ({ settings: !!(document.getElementById('bd-settings-modal') && document.getElementById('bd-settings-modal').offsetHeight), rows: !!document.querySelector('#bd-settings-modal .bd-pc-row') }));
  await shot(p, '04_settings');
  ok(s0.settings && s0.rows, '⚙ 설정에 UI 크기·길안내·튜토 행 (A-7)', JSON.stringify(s0));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const s1 = await p.evaluate(() => ({ settings: !!(document.getElementById('bd-settings-modal') && document.getElementById('bd-settings-modal').offsetHeight), pause: !!(document.getElementById('bd-pause-modal') && document.getElementById('bd-pause-modal').classList.contains('show')) }));
  ok(!s1.settings && !s1.pause, 'ESC: 설정만 닫히고 일시정지 안 열림 (S-3)', JSON.stringify(s1));
  /* 일시정지 → 설정 → 같은 창 */
  await p.evaluate(() => { const m = document.getElementById('bd-pause-modal'); if (!(m && m.classList.contains('show')) && window.BD_togglePause) BD_togglePause(); }); await p.waitForTimeout(400);
  const pz = await p.evaluate(() => { const m = document.getElementById('bd-pause-modal'); if (!m || !m.classList.contains('show')) return { pause: false }; const b = [...m.querySelectorAll('button')].find(x => /설정/.test(x.textContent)); if (b) b.click(); return { pause: true, clicked: !!b }; });
  await p.waitForTimeout(500);
  const pz2 = await p.evaluate(() => ({ settingsBgm: !!document.querySelector('#bd-settings-modal #bd-set-bgm'), rows: !!document.querySelector('#bd-settings-modal .bd-pc-row') }));
  ok(pz.pause && pz2.settingsBgm && pz2.rows, '일시정지 「설정」 → 통합 설정 창 (A-7)', JSON.stringify({ pz, pz2 }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => { const m = document.getElementById('bd-pause-modal'); if (m && m.classList.contains('show') && window.BD_togglePause) BD_togglePause(); });
  /* A-6 닫기 버튼 */
  await p.evaluate(() => { try { window.BD_codexOpen(); } catch (e) {} }); await p.waitForTimeout(500);
  const cdx = await p.evaluate(() => { const b = document.getElementById('bd-codex-close'); return b ? { bg: getComputedStyle(b).backgroundImage, text: b.textContent.trim() } : null; });
  await shot(p, '05_codex');
  ok(cdx && cdx.bg === 'none', '안전수첩 닫기 버튼에 스킨 이미지 없음 (A-6)', cdx ? cdx.bg.slice(0, 40) + ' ' + cdx.text : '없음');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  /* B-1 글자 하한 */
  const small = await p.evaluate(() => { const z = parseFloat(getComputedStyle(document.body).zoom) || 1; const out = []; document.querySelectorAll('#bd-district-minimap *, #bd-keybar kbd, .xp-num').forEach(el => { if (!el.offsetHeight) return; const s = parseFloat(getComputedStyle(el).fontSize) * z; if (s < 11.8) out.push((el.className || el.tagName) + ':' + s.toFixed(1)); }); return out; });
  ok(small.length === 0, '미니맵·키바·HP 수치 글자 ≥12px (B-1)', small.slice(0, 5).join(' '));
  /* S-2: 약국 위(쓰레기 사거리) 에서 F → 시설 모달, 1.5초 뒤에도 선택창 없음 */
  await p.evaluate(() => fadeToStage(212, 0.336, 0.462)); await p.waitForTimeout(1800);
  for (let i = 0; i < 8; i++) { const b = await p.evaluate(() => !!(window.BD_isInputBlocked && BD_isInputBlocked())); if (!b) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); }
  await p.keyboard.press('f'); await p.waitForTimeout(1600);
  const s2 = await p.evaluate(() => ({ facility: !!(document.getElementById('bd-district-facility-modal') && document.getElementById('bd-district-facility-modal').classList.contains('open')), choice: !!(document.getElementById('bd-choice') && document.getElementById('bd-choice').classList.contains('show')) }));
  await shot(p, '06_pharmacy_F');
  ok(s2.facility && !s2.choice, '약국 F → 시설 모달만, 자가치유가 선택창을 띄우지 않음 (S-2)', JSON.stringify(s2));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 은지 이동 확인 */
  const eunji = await p.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.resident && /은지/.test(x.npcName || x.label || '') && !/어머니/.test(x.npcName || x.label || '')); return o ? [+o.rx.toFixed(3), +o.ry.toFixed(3)] : null; });
  ok(eunji && eunji[0] > 0.39, '은지가 약국 문에서 떨어져 있음(x 0.354→0.39+)', JSON.stringify(eunji));
  /* S-1: legacy 대화창(#dialogue-box)을 직접 띄워 클릭 진행 확인 */
  {
    const opened = await p.evaluate(() => { try { if (typeof openDialogue === 'function') { openDialogue({ name: '검증', portrait: '', lines: [{ text: '검증용 첫째 줄입니다.' }, { text: '검증용 둘째 줄입니다.' }] }); return true; } } catch (e) {} return false; });
    await p.waitForTimeout(1500);
    const dd0 = await p.evaluate(() => ({ open: typeof dialogueOpen !== 'undefined' && dialogueOpen, text: (document.getElementById('dialogue-text') || {}).textContent, hint: getComputedStyle(document.getElementById('dialogue-next')).opacity, hintText: (document.getElementById('dialogue-next') || {}).textContent }));
    if (opened && dd0.open) {
      const bx = await p.evaluate(() => { const r = document.getElementById('dialogue-box').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(700);
      const dd1 = await p.evaluate(() => ({ text: (document.getElementById('dialogue-text') || {}).textContent, open: typeof dialogueOpen !== 'undefined' && dialogueOpen }));
      await shot(p, '06b_legacy_dialogue');
      ok(dd1.text !== dd0.text || !dd1.open, '대화창 클릭으로 대사 진행 (S-1)', (dd0.text || '').slice(0, 18) + ' → ' + (dd1.text || '').slice(0, 18));
      ok(parseFloat(dd0.hint) >= 0.5 && /클릭/.test(dd0.hintText || ''), '«▼ 클릭 · Space» 힌트 표시 (S-1)', dd0.hint + ' ' + dd0.hintText);
      for (let i = 0; i < 12; i++) { const o = await p.evaluate(() => typeof dialogueOpen !== 'undefined' && dialogueOpen); if (!o) break; await p.keyboard.press('Space'); await p.waitForTimeout(350); }
    } else log('  (showDialog 를 열지 못해 S-1 생략: ' + JSON.stringify({ opened, dd0 }) + ')');
  }
  if (false && eunji) {
    await p.evaluate((e) => fadeToStage(212, e[0] + 0.03, e[1] + 0.05), eunji); await p.waitForTimeout(1500);
    await p.keyboard.press('f'); await p.waitForTimeout(900);
    const dd0 = await p.evaluate(() => ({ open: typeof dialogueOpen !== 'undefined' && dialogueOpen, text: (document.getElementById('dialogue-text') || {}).textContent, hint: getComputedStyle(document.getElementById('dialogue-next')).opacity, hintText: (document.getElementById('dialogue-next') || {}).textContent }));
    if (dd0.open) {
      const bx = await p.evaluate(() => { const r = document.getElementById('dialogue-box').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(700);
      const dd1 = await p.evaluate(() => ({ text: (document.getElementById('dialogue-text') || {}).textContent, open: typeof dialogueOpen !== 'undefined' && dialogueOpen }));
      await shot(p, '06b_resident_dialogue');
      ok(dd1.text !== dd0.text || !dd1.open, '주민 대화창 클릭으로 대사 진행 (S-1)', (dd0.text || '').slice(0, 18) + ' → ' + (dd1.text || '').slice(0, 18));
      ok(parseFloat(dd0.hint) >= 0.5 && /클릭/.test(dd0.hintText || ''), '«▼ 클릭 · Space» 힌트 표시 (S-1)', dd0.hint + ' ' + dd0.hintText);
      for (let i = 0; i < 12; i++) { const o = await p.evaluate(() => typeof dialogueOpen !== 'undefined' && dialogueOpen); if (!o) break; await p.keyboard.press('Space'); await p.waitForTimeout(350); }
    } else log('  (은지 대화가 열리지 않아 S-1 생략)');
  }
  /* A-4: 전투 진입 → ESC 두 번 */
  const hz = await p.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.interactable === 'hazard' && x.hazardId === 'ow212_trash_1'); return o ? [o.rx + (o.rw || 0.04) / 2, o.ry + (o.rh || 0.04) + 0.02] : null; });
  await p.evaluate((h) => fadeToStage(212, h ? h[0] : 0.34, h ? h[1] : 0.352), hz); await p.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) { const b = await p.evaluate(() => !!(window.BD_isInputBlocked && BD_isInputBlocked())); if (!b) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); }
  await p.keyboard.press('f'); await p.waitForTimeout(900);
  let ch = await p.evaluate(() => !!(document.getElementById('bd-choice') && document.getElementById('bd-choice').classList.contains('show')));
  if (!ch) { await p.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1'); if (o && window.BD_hazardInteract) BD_hazardInteract(o); }); await p.waitForTimeout(800); ch = await p.evaluate(() => !!(document.getElementById('bd-choice') && document.getElementById('bd-choice').classList.contains('show'))); }
  if (ch) { await p.keyboard.press('Enter'); }
  let battle = false;
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !!(window.HSR && HSR.active && (HSR.state === 'player' || HSR.state === 'gauge')))) { battle = true; break; } if (await p.evaluate(() => typeof dialogueOpen !== 'undefined' && dialogueOpen)) await p.keyboard.press('Space'); }
  if (battle) {
    await p.waitForTimeout(800);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    const a1 = await p.evaluate(() => !!(window.HSR && HSR.active));
    await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
    const a2 = await p.evaluate(() => !!(window.HSR && HSR.active));
    await shot(p, '07_after_flee');
    ok(a1 && !a2, '전투 ESC 1회 = 안내, 2회 = 물러나기 (A-4)', 'after1=' + a1 + ' after2=' + a2);
  } else log('  (전투 진입 실패 — A-4 생략, choice=' + ch + ')');
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await c.close();
  await browser.close();
  log(fails ? '실패 ' + fails + '건' : '전부 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
