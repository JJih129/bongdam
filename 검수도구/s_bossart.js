module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => {
    const Q = window.QUESTS || window.BD_QUESTS; BD.questIdx = Q.findIndex(q => q.id === 'final');
    localStorage.setItem('bd_tut2_done', '1');
    if (typeof fadeToStage === 'function') fadeToStage(212);
  });
  await h.wait(5000); await A.advance();
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.isBoss);
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.012; camX = heroX; camY = o.ry + o.rh / 2;
  });
  await h.wait(1500);
  await L.press('Space', 3, 400);
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.isBoss);
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.012; camX = heroX; camY = o.ry + o.rh / 2;
    ['bd-quest-hud','bd-district-minimap','bd-district-hud','bge-toggle','bd-dami-field-bubble','bd-dami-hud','bd-keybar','bd-menu-btns'].forEach(id=>{const e=document.getElementById(id); if(e) e.style.display='none';});
  });
  await h.wait(2000);
  await h.shot('boss_art');
  const im = await h.page.evaluate(() => {
    const i = window.BD_ASSETS.image('field.hazard.final_boss');
    return { complete: i && i.complete, w: i && i.naturalWidth, h: i && i.naturalHeight };
  });
  say('보스 이미지: ' + JSON.stringify(im));
};
