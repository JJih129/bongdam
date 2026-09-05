// 수첩·장비·상점 모달 실제 셀렉터 확보 + 원거리 상점 재현
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(280); }

  const dumpTop = async (label, opener) => {
    await h.page.evaluate(opener);
    await h.wait(900);
    const info = await h.page.evaluate(() => {
      // 화면 중앙 최상위 요소에서 모달 컨테이너 추정
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      let cur = el, cont = null;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if ((cs.position === 'fixed' || cs.position === 'absolute') && cur.offsetWidth > 300 && cur.offsetHeight > 200) cont = cur;
        cur = cur.parentElement;
      }
      if (!cont) return null;
      const cs2 = getComputedStyle(cont);
      return { id: cont.id, cls: String(cont.className).slice(0, 60), bg: cs2.backgroundColor, w: cont.offsetWidth };
    });
    say(label + ': ' + JSON.stringify(info));
    await h.shot('ui_' + label);
    await h.page.keyboard.press('Escape'); await h.wait(500); await h.page.keyboard.press('Escape'); await h.wait(400);
  };
  await dumpTop('equip', () => { try { BD_openEquipModal(); } catch (e) { } });
  await dumpTop('codex', () => { try { BD_codexOpen(); } catch (e) { } });
  await dumpTop('cards', () => { try { BD_openCardCollection(); } catch (e) { } });
  await dumpTop('shop', () => { try { BD_openShop(); } catch (e) { } });

  // 원거리 상점 재현: 약국에서 멀리(맵 중앙) 서서 F
  await h.page.evaluate(() => { heroX = 0.5; heroY = 0.62; camX = heroX; camY = heroY; });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(900);
  const far = await h.page.evaluate(() => ({
    shopOpen: (() => { const s = document.getElementById('shop-overlay'); return !!(s && getComputedStyle(s).display !== 'none'); })(),
    facModal: (() => { const m = document.getElementById('bd-district-facility-modal'); return !!(m && m.classList.contains('open')); })(),
  }));
  say('원거리 F 결과: ' + JSON.stringify(far));
  await h.shot('ui_far');
};
