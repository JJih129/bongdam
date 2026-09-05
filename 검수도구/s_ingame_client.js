// 스킬 클라이언트를 «게임 시작 이후» 상태에서 돌리기 위한 진입 스크립트
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance(); await h.wait(600);

  const acts = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'action_ingame.json'), 'utf8'));
  const KEY = { up: 'w', down: 's', left: 'a', right: 'd', space: 'Space', escape: 'Escape', f: 'f', e: 'e', j: 'j' };
  let n = 0;
  for (const st of acts.steps) {
    const keys = (st.buttons || []).map(b => KEY[b] || b);
    for (const k of keys) await h.page.keyboard.down(k);
    await h.page.evaluate(f => { try { window.advanceTime(f * (1000 / 60)); } catch (e) { } }, st.frames || 1);
    await h.wait(Math.max(60, (st.frames || 1) * 16));
    for (const k of keys) await h.page.keyboard.up(k);
    await h.wait(250);
    const s = await A.probe();
    say(`step${n} [${keys.join(',')}] f=${st.frames} → stg=${s.stage} hero=(${s.hero[0].toFixed(3)},${s.hero[1].toFixed(3)}) hp=${s.hp} blocked=${s.blocked} panel=${s.panel} 목표=${s.tgt ? s.tgt.label : 'none'}`);
    if (st.capture) await h.shot('ig_' + n);
    n++;
  }
};
