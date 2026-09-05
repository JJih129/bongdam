// v334 신규 베이크 검증 — 런타임 STAGES ↔ 신규 JSON 일치 + 4개 맵 육안
const fs = require('fs');
module.exports = async (h) => {
  const { say } = h;
  const J = JSON.parse(fs.readFileSync('D:/봉담/작업_신규배치2/bongdam_rpg_editor_data_v5_2_quest.json', 'utf8'));
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const boot = await h.page.evaluate(() => ({
    stamp: localStorage.getItem('bd_bake_stamp'),
    bakedAt: window.__BD_BAKED_AT,
    K: !!localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'),
  }));
  say('부트: ' + JSON.stringify(boot));
  say((boot.stamp === 'bd-bake-d6d6c528-3145728' ? '✅' : '❌') + ' 새 스탬프 적용');

  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  let allOk = true;
  for (const sid of [212, 211, 213, 210]) {
    const js = (J.stages[sid] || {});
    const rt = await h.page.evaluate((p) => {
      if (Number(currentStage) !== p) fadeToStage(p, 0.5, 0.5);
      return null;
    }, sid);
    await h.wait(1800);
    await h.page.keyboard.press(' '); await h.wait(250); await h.page.keyboard.press(' '); await h.wait(250);
    const cmp = await h.page.evaluate((p) => {
      const st = STAGES[p.sid];
      const objs = (st.objects || []).filter(o => o);
      // JSON 좌표 표본 3개 대조 (라벨+rx)
      const misses = [];
      p.sample.forEach(s => {
        const hit = objs.find(o => o.label === s.label && Math.abs(Number(o.rx) - s.rx) < 0.0005 && Math.abs(Number(o.ry) - s.ry) < 0.0005);
        if (!hit) misses.push(s.label + '@' + s.rx.toFixed(3));
      });
      return { n: objs.length, lm: (st.__v24Landmarks || []).length, misses };
    }, {
      sid,
      sample: (js.objects || []).filter(o => o && o.label).slice(-5).map(o => ({ label: o.label, rx: Number(o.rx ?? o.cx ?? 0), ry: Number(o.ry ?? o.cy ?? 0) })),
    });
    const jn = (js.objects || []).length, jl = (js.__v24Landmarks || []).length;
    const ok = cmp.n === jn && cmp.misses.length === 0;
    allOk = allOk && ok;
    say(`${ok ? '✅' : '❌'} ${sid}: 런타임 obj=${cmp.n}/lm=${cmp.lm} · JSON obj=${jn}/lm=${jl} · 표본 불일치 ${cmp.misses.length} ${JSON.stringify(cmp.misses.slice(0, 3))}`);
    await h.shot('bake_' + sid);
  }
  say((allOk ? '✅' : '❌') + ' 배치 일치 종합');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
