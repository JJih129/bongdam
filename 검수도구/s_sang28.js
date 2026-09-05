// 상리(213) 위험요소 전수 — 조사하기 확정 후 전투 진입 추적
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[선택\]|\[전투\]|\[v35|\[v340/.test(t)) say('  콘솔: ' + t.slice(0, 110)); });
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
  const drain = async (n = 20) => {
    for (let t = 0; t < n; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        return { open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c, choice: c };
      });
      if (!st.open) return;
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 4;   // 상리 장 진행 상태
    fadeToStage(213, 0.5, 0.5);
  });
  await h.wait(2000); await drain(20);
  for (let t = 0; t < 45; t++) {
    const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
    if (!busy) break;
    await h.wait(1000);
  }
  await drain(10);
  // 부탁 상태 직접 주입 (유저 상태 재현: 수락 완료)
  const pairs = await h.page.evaluate(() => {
    const pr = (window.BD_hzQuestMap ? BD_hzQuestMap(213) : []) || [];
    const s = JSON.parse(localStorage.getItem('bd_hzquest_v57') || '{}');
    pr.forEach(p => { s[p.id] = 'a'; });
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    return pr.map(p => p.id + '→a');
  });
  say('부탁 주입: ' + JSON.stringify(pairs));
  // 지연 대기열 나레이션(— 상리 — 등) 소화
  for (let t = 0; t < 20; t++) {
    const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
    if (d) { await h.page.keyboard.press(' '); await h.wait(350); t = 0; continue; }
    await h.wait(400);
  }
  // 위험요소 전수
  const hz = await h.page.evaluate(() => (STAGES[213].objects || [])
    .filter(x => x && x.hazardId && !x.isBoss && !x.__bdGone && !(BD.purified || {})[x.hazardId])
    .map(o => ({ id: o.hazardId, label: o.label, rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.05, gate: (() => { try { return BD_hzQuestGate(o); } catch (e) { return 'err'; } })() })));
  say('위험요소: ' + JSON.stringify(hz.map(z => ({ id: z.id, gate: z.gate }))));
  let pass = 0, fail = [];
  for (const z of hz) {
    if (z.gate) { say(`  ${z.id}: 게이트 잠김(사양) — 스킵`); continue; }
    await h.page.evaluate((p) => { heroX = p.rx + p.rw / 2; heroY = p.ry + p.rh + 0.012; camX = heroX; camY = heroY; }, z);
    await h.wait(900);
    await h.page.keyboard.press('f');   // 단일 F + 자가치유 대기 (실플레이 패턴)
    let opened = false;
    for (let k = 0; k < 10 && !opened; k++) {
      await h.wait(420);
      const st = await h.page.evaluate(() => ({
        c: !!(window.__bdChoiceState && __bdChoiceState.open),
        d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(),
      }));
      opened = st.c;
      if (!opened && st.d) { await h.page.keyboard.press(' '); }
    }
    if (!opened) {
      const diag = await h.page.evaluate((p) => {
        const m = document.querySelector('.bd-modal.show');
        const d = document.getElementById('dialogue-box');
        let nf = null; try { const f = BD_v24NearestFacility(); nf = f ? (f.label + '@' + Math.round(f.dist || -1)) : null; } catch (e) { nf = 'err'; }
        const o = (STAGES[213].objects || []).find(x => x && x.hazardId === p);
        return {
          modal: m ? (m.id || m.className).slice(0, 30) : null,
          dlg: (d && d.getBoundingClientRect().height > 0) ? (d.textContent || '').replace(/\s+/g, ' ').slice(0, 40) : null,
          near: nf,
          hero: [+heroX.toFixed(3), +heroY.toFixed(3)],
          hzRect: o ? [+(+o.rx).toFixed(3), +(+o.ry).toFixed(3), o.rw, o.rh] : null,
          busy: !!window.__bdDamiOpeningBusy,
          blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
        };
      }, z.id);
      say('    진단: ' + JSON.stringify(diag));
      await h.shot('sangdiag_' + z.id);
      fail.push({ id: z.id, at: 'choice미오픈' }); say(`  ${z.id}: ❌ 선택창 미오픈`); continue;
    }
    await h.wait(450); await h.page.keyboard.press('Enter');
    // 확정 후 3.5초 추적
    let entered = false, trace = [];
    for (let k = 0; k < 10; k++) {
      await h.wait(420);
      const st = await h.page.evaluate(() => ({
        b: !!(window.HSR && HSR.active),
        c: !!(window.__bdChoiceState && __bdChoiceState.open),
        d: (() => { const x = document.getElementById('dialogue-box'); return (x && x.getBoundingClientRect().height > 0) ? (x.textContent || '').replace(/\s+/g, ' ').slice(0, 22) : null; })(),
        busy: !!window.__bdDamiOpeningBusy,
      }));
      trace.push(st.b ? 'B' : st.c ? 'C' : st.d ? 'D' : '·');
      if (st.b) { entered = true; break; }
      if (st.d) { await h.page.keyboard.press(' '); }
    }
    if (entered) {
      pass++;
      say(`  ${z.id}: ✅ 전투 진입 (${trace.join('')})`);
      // 플레이어 턴 + 버튼 생성 대기 후 물러나기
      for (let w = 0; w < 16; w++) {
        const rdy = await h.page.evaluate(() => ({
          st: window.HSR ? HSR.state : null,
          btn: !!document.querySelector('.hsr-act.hsr-flee'),
        }));
        if (rdy.st === 'player' && rdy.btn) break;
        const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
        if (d) await h.page.keyboard.press(' ');
        await h.wait(500);
      }
      const clicked = await h.page.evaluate(() => { const b = document.querySelector('.hsr-act.hsr-flee'); if (b) { b.click(); return true; } return false; });
      say('    물러나기 클릭: ' + clicked);
      await h.wait(900); await drain(12);
      // 이탈 후 잔여 정리: 나레이션 소화 + 유령잠금 해제 대기 (1초 추적)
      for (let t = 0; t < 18; t++) {
        const st = await h.page.evaluate(() => ({
          hsr: !!(window.HSR && HSR.active), state: window.HSR ? HSR.state : null,
          d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(),
          blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return true; } })(),
          chD: (() => { const c = document.getElementById('bd-choice'); return c ? getComputedStyle(c).display : null; })(),
          bOn: document.body.classList.contains('bd-battle-on'),
        }));
        say('    settle' + t + ': ' + JSON.stringify(st));
        if (st.d) { await h.page.keyboard.press(' '); await h.wait(350); continue; }
        if (!st.blocked) break;
        await h.wait(1000);
      }
    } else {
      fail.push({ id: z.id, at: '확정후무반응', trace: trace.join('') });
      say(`  ${z.id}: ❌ 확정 후 전투 미진입 (${trace.join('')})`);
      await h.shot('sang_' + z.id);
      await drain(10);
    }
  }
  say(`결과: 진입 ${pass} · 실패 ${fail.length} ${JSON.stringify(fail)}`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
