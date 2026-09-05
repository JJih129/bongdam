// 최종보스 LD 에셋 교체 검증 — 보스전 진입 후 적 스프라이트가 새 이미지인지
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }

  const a1 = await h.page.evaluate(() => ({
    slot: (window.BD_ASSETS && BD_ASSETS.get && (BD_ASSETS.get('enemy.final_boss') || '').slice(0, 30)) || null,
    field: (window.BD_ASSETS && BD_ASSETS.get && (BD_ASSETS.get('field.hazard.final_boss') || '').slice(0, 30)) || null,
    mk: (window.makeBossSprite ? makeBossSprite().slice(0, 30) : null),
  }));
  say('① 에셋 등록: ' + JSON.stringify(a1));
  const okA = a1.slot && a1.slot.startsWith('data:image/webp') && a1.mk && a1.mk.startsWith('data:image/webp');
  say((okA ? '✅' : '❌') + ' ① 슬롯·필드·makeBossSprite 모두 새 WebP');

  // 보스전 강제 진입
  await h.page.evaluate(() => {
    BD.questIdx = 5;
    fadeToStage(212, 0.55, 0.8);
  });
  await h.wait(2000);
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    const boss = (STAGES[212].objects || []).find(o => o && o.hazardId === 'final_boss_1');
    if (boss) { heroX = boss.rx + (boss.rw || 0.1) / 2; heroY = boss.ry + (boss.rh || 0.1) + 0.012; camX = heroX; camY = heroY; }
    else window.__bossErr = '보스 오브젝트 없음';
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(700);
  for (let k = 0; k < 20; k++) {
    const st = await h.page.evaluate(() => ({
      b: !!(window.HSR && HSR.active),
      c: !!(window.__bdChoiceState && __bdChoiceState.open),
    }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(350); }
  }
  await h.wait(1500);
  for (let i = 0; i < 8; i++) { // 전투 튜토·인트로 대사 소화
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), d: (() => { const d = document.getElementById('dialogue-box'); return !!(d && d.getBoundingClientRect().height > 0); })() }));
    if (st.b && !st.d) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  const b1 = await h.page.evaluate(() => {
    const sp = document.getElementById('hsr-enemy-sprite');
    const img = sp && sp.querySelector('img');
    return {
      battle: !!(window.HSR && HSR.active), isBoss: !!(window.HSR && HSR._isBoss),
      imgSrc: img ? img.src.slice(0, 30) : null, w: img ? img.naturalWidth : 0,
      err: window.__bossErr || null,
    };
  });
  say('② 보스전: ' + JSON.stringify(b1));
  const okB = b1.battle && b1.isBoss && b1.imgSrc && b1.imgSrc.startsWith('data:image/webp') && b1.w >= 500;
  say((okB ? '✅' : '❌') + ' ② 전투 적 스프라이트 = 새 LD 에셋');
  await h.shot('boss_new');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
