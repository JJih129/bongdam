module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  say('touch=' + await h.page.evaluate(() => ('ontouchstart' in window) || navigator.maxTouchPoints > 0));
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3500); await A.advance(); await h.wait(2500);
  const texts = await h.page.evaluate(() => {
    const g = id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return (cs.display !== 'none' && r.height > 2) ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null; };
    return { card: g('bd-tut-card'), keybar: g('bd-keybar'), dami: g('bd-dami-hud'), hud: g('bd-quest-hud'), html: document.documentElement.className };
  });
  say('안내 문구: ' + JSON.stringify(texts, null, 1));
  await h.shot('t_01_touch_field');
};
