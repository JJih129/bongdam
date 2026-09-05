// 완주 오토파일럿을 돌리며 questIdx 가 바뀔 때마다 스냅샷(slot2 + localStorage) 저장 → snaps/chN_start.json
const fs = require('fs'), path = require('path');
module.exports = async (h) => {
  const L = require('./lib')(h); const A = require('./auto')(h, L); const { say } = h;
  const SN = path.join(__dirname, 'snaps'); fs.mkdirSync(SN, { recursive: true });
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) { await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }); await h.wait(600); if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break; }
  await h.wait(2500);
  let lastQ = -1; const T0 = Date.now();
  const save = async (name) => {
    const dump = await h.page.evaluate(() => { try { BD_saveToSlot(2); } catch (e) { } const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    fs.writeFileSync(path.join(SN, name + '.json'), JSON.stringify(dump)); say('💾 스냅샷 ' + name);
  };
  for (let c = 0; c < 400; c++) {
    const r = await A.run(4);
    const st = await h.page.evaluate(() => ({ q: (window.BD && BD.questIdx) || 0, s: Number(currentStage), pur: Object.keys((window.BD && BD.purified) || {}).length, cleared: !!(window.BD && BD.gameCleared) }));
    if (st.q !== lastQ) { lastQ = st.q; if (st.q >= 1) await save('ch' + st.q + '_start'); }
    if (c % 5 === 0) say(`◇ c${c} q=${st.q} stage=${st.s} pur=${st.pur} ${((Date.now() - T0) / 60000).toFixed(1)}분`);
    if (st.cleared) { await save('cleared'); say('🏁 cleared'); break; }
    if (r && r.ok === false) { say('⛔ ' + r.reason); await save('stuck_q' + st.q + '_' + c); if (/loop|unreachable/.test(r.reason)) { /* 계속 시도 */ } }
    if (Date.now() - T0 > 70 * 60000) { say('⏱ 70분 초과'); await save('timeout_q' + st.q); break; }
  }
};
