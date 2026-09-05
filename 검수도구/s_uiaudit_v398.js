/* (v398) 모바일 UI 전수 점검 — 화면·패널을 순서대로 열며 스크린샷 + 수치 측정.
 *
 * 각 화면마다 확인하는 것:
 *   · 화면 밖으로 잘린 요소       (rect 가 뷰포트를 벗어남)
 *   · 44px 미만 탭 타겟           (Apple 44 / Android 48 권장)
 *   · 화면상 12px 미만 텍스트      (zoom·scale 누적 반영)
 *   · 주 버튼 도달성              (elementFromPoint — «보인다 ≠ 눌린다»)
 *
 * 사용: VW=874 VH=300 DPR=3 TOUCH=1 SHOTS_DIR=_audit \
 *       node drive.js s_uiaudit_v398.js --url=http://localhost:8788/new/
 */
'use strict';

const PROBE = `(() => {
  const zoomOf = el => { let k = 1;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p);
      const z = parseFloat(s.zoom); if (z && z !== 1) k *= z;
      const m = (s.transform || '').match(/^matrix\\(([-\\d.]+)/);
      if (m && parseFloat(m[1]) && parseFloat(m[1]) !== 1) k *= parseFloat(m[1]); }
    return k; };
  const seen = el => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)<0.15) return false;
    if (r.width < 4 || r.height < 4) return false;
    for (let p = el.parentElement; p; p = p.parentElement) { const ps = getComputedStyle(p);
      if (ps.display==='none'||ps.visibility==='hidden'||parseFloat(ps.opacity)<0.15) return false; }
    return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; };

  const cut = [], tap = [], tiny = [];
  document.querySelectorAll('*').forEach(el => {
    if (!seen(el)) return;
    const r = el.getBoundingClientRect();
    const name = (el.id ? '#'+el.id : el.tagName+'.'+String(el.className||'').trim().split(/\\s+/)[0]).slice(0,28);
    const cl = Math.round(Math.max(0,-r.left)), cr = Math.round(Math.max(0,r.right-innerWidth));
    const cb = Math.round(Math.max(0,r.bottom-innerHeight)), ct = Math.round(Math.max(0,-r.top));
    if (cl>2||cr>2||cb>2||ct>2) cut.push({el:name, 좌:cl, 우:cr, 위:ct, 아래:cb, 글:(el.textContent||'').trim().slice(0,18)});
  });
  document.querySelectorAll('button,[onclick],[role=button],[class*=btn],[class*=hit],[id*=btn]').forEach(el => {
    if (!seen(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) tap.push({
      el:(el.id?'#'+el.id:'.'+String(el.className||'').trim().split(/\\s+/)[0]).slice(0,26),
      크기: Math.round(r.width)+'x'+Math.round(r.height), 글:(el.textContent||'').trim().slice(0,14)});
  });
  document.querySelectorAll('div,span,p,button,b,td').forEach(el => {
    if (!seen(el) || el.children.length > 2) return;
    const t = (el.textContent||'').trim(); if (!t || t.length > 50) return;
    const px = +(parseFloat(getComputedStyle(el).fontSize) * zoomOf(el)).toFixed(1);
    if (px && px < 12) tiny.push({px, 글: t.slice(0,20)});
  });
  tiny.sort((a,b)=>a.px-b.px);

  /* 주 버튼(확인·시작·닫기 등) 이 실제로 눌리는가 */
  const acts = [...document.querySelectorAll('button,.modal-btn')].filter(seen)
    .filter(b => /확인|시작|닫기|저장|모험|계속|나가기|돌아가기/.test(b.textContent||''))
    .slice(0,5).map(b => { const r=b.getBoundingClientRect();
      const hit=document.elementFromPoint(Math.round(r.left+r.width/2), Math.round(r.top+r.height/2));
      return {글:(b.textContent||'').trim().slice(0,10), 눌림: hit===b||b.contains(hit)}; });

  return { 잘림: cut.length, 잘림상세: cut.slice(0,4),
           탭44미만: tap.length, 탭상세: tap.slice(0,4),
           작은글자: tiny.length, 가장작음: tiny.slice(0,3),
           주버튼: acts };
})()`;

module.exports = async (h) => {
  const report = [];
  async function step(name, fn) {
    try { await fn(); } catch (e) { h.say('  (' + name + ' 열기 실패: ' + String(e.message).split('\n')[0] + ')'); }
    await h.wait(1600);
    await h.shot(name);
    let r = null;
    try { r = await h.page.evaluate(PROBE); } catch (e) { r = { 오류: String(e.message).slice(0, 60) }; }
    report.push({ name, r });
    h.say('  [' + name + '] 잘림 ' + r.잘림 + ' · 탭44미만 ' + r.탭44미만 + ' · 12px미만 ' + r.작은글자
      + (r.주버튼 && r.주버튼.length ? ' · 주버튼 ' + r.주버튼.map(b => b.글 + (b.눌림 ? '✓' : '✗')).join(' ') : ''));
  }
  const click = sel => h.page.evaluate(s => {
    const el = document.querySelector(s); if (!el) throw new Error('없음 ' + s);
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (const t of ['pointerdown','mousedown','pointerup','mouseup','click'])
      el.dispatchEvent(new (t.startsWith('pointer')?PointerEvent:MouseEvent)(t,
        {bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0,pointerId:1,isPrimary:true}));
  }, sel);
  const esc = () => h.page.keyboard.press('Escape').catch(()=>{});

  await step('01_타이틀', async () => {});
  await step('02_타이틀_설정', () => click('#bd-settings-btn'));
  await esc(); await h.wait(600);

  await step('03_캐릭터생성', () => click('#bd-title-start'));
  /* 리로드가 끼어들므로 모달이 뜰 때까지 기다린다 */
  for (let i = 0; i < 25; i++) {
    await h.wait(700);
    const ok = await h.page.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2);
    if (ok) break;
  }
  await h.shot('03b_캐릭터생성_확정');

  await step('04_필드진입', async () => {
    await click('#char-card-1'); await h.wait(900);
    await h.page.evaluate(() => {
      const g = [...document.querySelectorAll('button,.modal-btn')]
        .filter(b => b.getBoundingClientRect().width > 2)
        .find(b => /모험\s*시작/.test(b.textContent || ''));
      if (g) g.click();
    });
    for (let i = 0; i < 25; i++) {
      await h.wait(900);
      const st = await h.page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
      if (st && st !== 1) break;
    }
    await h.wait(2500);
  });

  await step('05_가방', () => click('#bd-bag-top'));
  await esc(); await h.wait(700);
  await step('06_안전지도', () => click('#bd-touch-mapbtn'));
  await esc(); await h.wait(700);
  await step('07_메뉴', () => click('#bd-mb-toggle'));
  await esc(); await h.wait(700);
  await step('08_설정_인게임', () => click('#bd-settings-btn'));
  await esc(); await h.wait(700);
  await step('09_안전수첩', () => click('#bd-menu-btns > *'));
  await esc(); await h.wait(700);

  await step('10_대화', () => h.page.evaluate(() => {
    if (typeof window.BD_forceTalkNearest === 'function') return BD_forceTalkNearest();
    const k = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true });
    document.dispatchEvent(k);
  }));

  h.say('');
  h.say('════ 요약 ════');
  h.say('화면              잘림  탭44미만  12px미만');
  report.forEach(x => h.say(String(x.name).padEnd(18)
    + String(x.r.잘림 ?? '-').padStart(4) + String(x.r.탭44미만 ?? '-').padStart(9) + String(x.r.작은글자 ?? '-').padStart(10)));
  h.say('');
  report.forEach(x => {
    if (x.r.잘림 > 0) h.say('[' + x.name + '] 잘림: ' + JSON.stringify(x.r.잘림상세));
    if (x.r.주버튼 && x.r.주버튼.some(b => !b.눌림)) h.say('[' + x.name + '] ⚠ 안 눌리는 버튼: '
      + x.r.주버튼.filter(b => !b.눌림).map(b => b.글).join(', '));
  });
  h.say('콘솔에러 ' + h.consoleErrors.length);
  if (h.consoleErrors.length) h.say('  ' + h.consoleErrors.slice(0, 3).join(' | '));
};
