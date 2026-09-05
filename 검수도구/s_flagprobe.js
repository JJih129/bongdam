// 시연 플래그 수명 관측
module.exports = async (h) => {
  const { say } = h;
  const st = async (tag) => say(`[${tag}] ` + JSON.stringify(await h.page.evaluate(() => ({
    ls: localStorage.getItem('bd_demo_mode'), ss: sessionStorage.getItem('bd_demo_mode'),
    demoBtn: !!document.getElementById('bd-title-demo'),
  }))));
  for (let t = 0; t < 15; t++) { if (await h.page.evaluate(() => !!document.getElementById('bd-title-demo'))) break; await h.wait(400); }
  await st('타이틀');
  await h.page.evaluate(() => document.getElementById('bd-title-demo').click());
  await st('칩 클릭 직후');
  for (let t = 0; t < 10; t++) { await h.wait(1000); await st('start+' + (t + 1) + 's'); const gone = await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return m && m.classList.contains('show'); }); if (gone) break; }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  for (let t = 0; t < 6; t++) { await h.wait(1000); await st('confirm+' + (t + 1) + 's'); }
};
