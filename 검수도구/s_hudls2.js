// VN 중 LD 위를 덮는 요소 식별 (elementsFromPoint 샘플링)
module.exports = async (h) => {
  const { say } = h;
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const info = await h.page.evaluate(() => {
    // 길안내 카드: «길안내» 텍스트 요소의 최상위 조상 식별
    const out = { navCard: null, regionCard: null };
    const walk = (needle) => {
      const els = [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && (e.textContent || '').includes(needle));
      if (!els.length) return null;
      let el = els[0];
      let top = el;
      while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'absolute') top = el;
        el = el.parentElement;
      }
      const cs2 = getComputedStyle(top);
      const r = top.getBoundingClientRect();
      return { id: top.id || ('.' + String(top.className).split(' ')[0]), pos: cs2.position, z: cs2.zIndex, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], parentIsGame: !!top.closest('#game-screen') };
    };
    out.navCard = walk('길안내');
    out.regionCard = walk('봉담 4개 리');
    // VN 열고 초상 좌표에서 위에 얹힌 요소들
    try { showDialog('사서 도현', ['레이어 확인']); } catch (e) { }
    return out;
  });
  say('카드: ' + JSON.stringify(info));
  await h.wait(1200);
  const above = await h.page.evaluate(() => {
    const por = document.getElementById('dialogue-portrait');
    if (!por) return 'no-portrait';
    const r = por.getBoundingClientRect();
    const pts = [[r.left + r.width / 2, r.top + 10], [r.left + 20, r.top + r.height * 0.3], [r.left + r.width - 10, r.top + 20]];
    const seen = new Set();
    pts.forEach(([x, y]) => {
      document.elementsFromPoint(x, y).forEach((el, i) => {
        if (el === por) return;
        const idx = document.elementsFromPoint(x, y).indexOf(por);
        if (idx >= 0 && document.elementsFromPoint(x, y).indexOf(el) < idx) seen.add(el.id || ('.' + String(el.className).split(' ')[0]));
      });
    });
    return [...seen];
  });
  say('초상 위 요소: ' + JSON.stringify(above));
};
