// 리로드 후 자동 재클릭 소비자 동작 계측
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start');   // purge+reload 유발
  for (let k = 0; k < 12; k++) {
    await h.wait(1000);
    const st = await h.page.evaluate(() => {
      const b = document.getElementById('bd-title-start');
      return {
        autoFlag: sessionStorage.getItem('bd_auto_open_start'),
        btn: !!b, offsetParent: b ? !!b.offsetParent : null,
        offsetH: b ? b.offsetHeight : null,
        vis: b ? (b.offsetWidth > 0) : null,
        modal: (() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); })(),
        fn: typeof window.BD_startNewGame,
      };
    }).catch(() => 'nav');
    say(k + 's: ' + JSON.stringify(st));
    if (st && st.modal) { say('✅ 자동 재진입 성공'); return; }
  }
  say('❌ 자동 재진입 실패 — 소비자 미동작');
  const deep = await h.page.evaluate(() => {
    const b = document.getElementById('bd-title-start');
    const out = {
      onclickAttr: b ? String(b.getAttribute('onclick') || '(없음)').slice(0, 70) : null,
      disabled: b ? b.disabled : null,
      hook: b ? !!b.__bdFresh : null,
      pointerEvents: b ? getComputedStyle(b).pointerEvents : null,
    };
    try { b.click(); out.clickedNow = true; } catch (e) { out.clickErr = String(e); }
    return out;
  });
  say('버튼 정밀: ' + JSON.stringify(deep));
  await h.wait(1500);
  say('클릭 직후 모달: ' + JSON.stringify(await h.page.evaluate(() => {
    const m = document.getElementById('bd-startsetup-modal');
    return { modal: !!(m && m.classList.contains('show')), reloaded: !document.getElementById('bd-title-start') };
  }).catch(() => 'nav')));
  const direct = await h.page.evaluate(() => { try { BD_startNewGame(); return 'called'; } catch (e) { return String(e).slice(0, 80); } });
  await h.wait(1200);
  say('직접 호출(' + direct + ') 모달: ' + JSON.stringify(await h.page.evaluate(() => {
    const m = document.getElementById('bd-startsetup-modal');
    return !!(m && m.classList.contains('show'));
  }).catch(() => 'nav')));
};
