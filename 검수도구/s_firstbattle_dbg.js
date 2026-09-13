// 첫 전투 진단 — s_fullrun 과 같은 부팅·오토파일럿으로 첫 전투까지 간 뒤, 전투 안에서 무엇이 진행을 막는지 1초 단위로 덤프
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  say('▶ 시작하기');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) {
    const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); });
    if (v) break; await h.wait(200);
  }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  // 오토파일럿으로 첫 전투까지
  let gotBattle = false;
  for (let k = 0; k < 6 && !gotBattle; k++) {
    const r = await A.run(30);
    say('  run → ' + JSON.stringify(r).slice(0, 120));
    if (await h.page.evaluate(() => !!(window.HSR && HSR.active))) { gotBattle = true; break; }
  }
  if (!gotBattle) { say('  전투 미진입'); return; }
  say('  ⚔ 전투 진입 — 12초 덤프');
  for (let t = 0; t < 12; t++) {
    const s = await h.page.evaluate(() => {
      const on = e => { const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.height > 2; };
      const acts = [...document.querySelectorAll('.hsr-act')].filter(on).map(e => ({ t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 14), dis: e.classList.contains('disabled') || e.classList.contains('hsr-lock') || e.disabled, pe: getComputedStyle(e).pointerEvents }));
      const top = (() => { const a = document.querySelector('.hsr-act'); if (!a) return null; const r = a.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e ? (e.id || e.className || e.tagName) : null; })();
      return { state: HSR.state, ehp: HSR.enemy && HSR.enemy.hp, acts, topAtAct: String(top).slice(0, 40),
        mg: ['bd-mg', 'bd-mg-ddr', 'bd-mg-light', 'bd-mg-ring', 'bd-mg-mash'].filter(id => document.getElementById(id)),
        tutor: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), step: window.__bdTutStepId,
        kbQ: !!(window.BD_TUTOR_keyBlocked && BD_TUTOR_keyBlocked({ key: 'q' })),
        dami: ((document.getElementById('bd-dami-bubble') || {}).textContent || '').slice(0, 50),
        blocked: !!(window.BD_isInputBlocked && BD_isInputBlocked()), dlg: typeof dialogueOpen !== 'undefined' && dialogueOpen,
        inv: !!(document.getElementById('inv-overlay') && document.getElementById('inv-overlay').classList.contains('open')),
        overlays: [...document.querySelectorAll('body > *')].filter(e => { const cs = getComputedStyle(e); return cs.position === 'fixed' && cs.display !== 'none' && +cs.zIndex >= 3000 && e.offsetHeight > 100; }).map(e => e.id || e.className).slice(0, 6) };
    });
    say('  t' + t + ' ' + JSON.stringify(s));
    if (t === 2) {
      const c = await h.page.evaluate(() => { const on = e => { const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.height > 2; }; const list = [...document.querySelectorAll('.hsr-act')].filter(e => on(e) && !e.disabled && !e.classList.contains('disabled') && !e.classList.contains('hsr-lock')); if (!list.length) return null; list[0].click(); return list[0].textContent.trim().slice(0, 16); });
      say('  click → ' + c);
    }
    await h.wait(1000);
  }
  await h.shot('firstbattle_dbg');
};
