// shared helpers for 봉담지킴이 scenarios
module.exports = (h) => {
  const { say } = h;
  const api = {};

  api.dump = async (tag) => {
    const st = await h.state();
    say(`[${tag}] mode=${st.mode} stg=${st.stage && st.stage.id} hero=(${st.hero.x},${st.hero.y}) hp=${st.hero.hp} q=${st.quest ? st.quest.id + ' ' + st.quest.cur + '/' + st.quest.need : '-'} guide=${st.guide} spk=${st.ui.speaker || '-'} dlg=${st.ui.dialogue ? JSON.stringify(st.ui.dialogue).slice(0, 70) : '-'} ch=${JSON.stringify(st.ui.choice)} pc=${st.ui.placeCard} aug=${st.ui.augment} dami=${st.ui.damiBubble} bat=${st.battle ? st.battle.enemy + ' ' + st.battle.enemyHp + '/' + st.battle.enemyMax + ' mg=' + st.battle.minigame : '-'}`);
    return st;
  };

  api.blocked = async () => await h.page.evaluate(() => ({
    b: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
    scene: !!window.__bdSceneActive,
    ov: (() => { const e = document.getElementById('dialogue-overlay'); return e ? getComputedStyle(e).display : '-'; })(),
    bdd: (() => { const e = document.getElementById('bd-dialog'); return e ? getComputedStyle(e).display : '-'; })(),
    modal: (() => { const m = document.querySelector('.bd-modal.show'); return m ? (m.id || m.className) : null; })(),
    dOpen: (() => { try { return !!dialogueOpen; } catch (e) { return 'n/a'; } })(),
    choice: (() => { const e = document.getElementById('bd-choice'); return e ? getComputedStyle(e).display : '-'; })(),
    hsr: (() => { try { return !!(window.HSR && HSR.active); } catch (e) { return false; } })(),
    arcade: !!window.__bdArcadeOpen,
  }));

  // wait until predicate(state) true, max ms
  api.until = async (label, pred, ms = 15000, step = 400) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const st = await h.state();
      if (pred(st)) { say(`  ✔ ${label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); return st; }
      await h.wait(step);
    }
    say(`  ✖ TIMEOUT ${label} after ${ms}ms`);
    return null;
  };

  // move hero toward (tx,ty) using WASD, up to maxMs
  api.moveTo = async (tx, ty, maxMs = 12000, tol = 0.022) => {
    const t0 = Date.now();
    let last = null, stuckN = 0;
    while (Date.now() - t0 < maxMs) {
      const st = await h.state();
      const dx = tx - st.hero.x, dy = ty - st.hero.y;
      const d = Math.hypot(dx, dy);
      if (d <= tol) return { ok: true, st };
      if (st.mode !== 'field') return { ok: false, reason: 'mode=' + st.mode, st };
      const pos = st.hero.x.toFixed(3) + ',' + st.hero.y.toFixed(3);
      if (pos === last) { stuckN++; } else { stuckN = 0; last = pos; }
      if (stuckN === 4) { // 한 축이 막혔을 수 있다 — 다른 축으로 살짝 흔들어 본다
        const jig = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 's' : 'w') : (dx > 0 ? 'd' : 'a');
        await h.page.keyboard.down(jig); await h.wait(180); await h.page.keyboard.up(jig);
      }
      if (stuckN >= 8) return { ok: false, reason: 'stuck at ' + pos + ' d=' + d.toFixed(3), st };
      const keys = [];
      const EPS = 0.0022;   // 좁은 통로에서도 미세 보정이 되도록 아주 작게
      if (dy < -EPS) keys.push('w'); else if (dy > EPS) keys.push('s');
      if (dx < -EPS) keys.push('a'); else if (dx > EPS) keys.push('d');
      if (!keys.length) return { ok: true, st };
      for (const k of keys) await h.page.keyboard.down(k);
      await h.wait(Math.min(260, Math.max(90, d * 900)));
      for (const k of keys) await h.page.keyboard.up(k);
      await h.wait(60);
    }
    const st = await h.state();
    return { ok: false, reason: 'timeout', st };
  };

  // repeatedly press key to clear dialogue/cutscene until field or timeout
  api.clearDialog = async (max = 40) => {
    for (let i = 0; i < max; i++) {
      const b = await api.blocked();
      if (!b.b) return true;
      if (b.choice !== 'none' && b.choice !== '-') return 'choice';
      if (b.hsr) return 'battle';
      await h.page.keyboard.press('Space');
      await h.wait(230);
    }
    return false;
  };

  api.press = async (k, n = 1, d = 150) => { for (let i = 0; i < n; i++) { await h.page.keyboard.press(k); await h.wait(d); } };

  api.topOverlay = async () => await h.page.evaluate(() => {
    const list = [...document.querySelectorAll('body *')].filter(e => {
      const cs = getComputedStyle(e);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 &&
        e.offsetWidth > 200 && e.offsetHeight > 100 &&
        (cs.position === 'fixed' || cs.position === 'absolute') && +cs.zIndex > 80;
    }).map(e => ({ id: e.id || ('.' + String(e.className).split(' ')[0]), z: +getComputedStyle(e).zIndex, w: e.offsetWidth, h: e.offsetHeight, t: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) }));
    list.sort((a, b) => b.z - a.z);
    return list.slice(0, 6);
  });

  api.waitBoot = async (ms = 90000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const gone = await h.page.evaluate(() => {
        const e = document.getElementById('bd-boot');
        return !e || getComputedStyle(e).display === 'none' || +getComputedStyle(e).opacity < 0.05;
      });
      if (gone) { say(`  ✔ boot overlay gone (${((Date.now() - t0) / 1000).toFixed(1)}s)`); return true; }
      await h.wait(500);
    }
    say('  ✖ boot overlay never disappeared');
    return false;
  };

  // click a visible element by its text
  api.clickText = async (txt, tagSel = 'button,div,span,a') => {
    return await h.page.evaluate(({ txt, tagSel }) => {
      const els = [...document.querySelectorAll(tagSel)].filter(e => {
        const cs = getComputedStyle(e);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && e.offsetWidth > 8 &&
          (e.textContent || '').replace(/\s+/g, ' ').trim().includes(txt);
      });
      // deepest match
      const target = els[els.length - 1];
      if (!target) return false;
      target.click();
      return target.id || target.tagName + '.' + String(target.className).slice(0, 20);
    }, { txt, tagSel });
  };

  return api;
};
