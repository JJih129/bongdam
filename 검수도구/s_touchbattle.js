// 3단계 — 터치 전투: 버튼 크기(≥44px)·리듬 터치 버튼 검증
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(3000);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    BD.unlockedSkills.push('cheer'); BD.equippedSkill = 'cheer';
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  say('터치 모드: ' + await h.page.evaluate(() => document.documentElement.classList.contains('bd-touch-mode')));
  // 전투 진입
  // (v315 대응) 담이 오프닝(조사 잠금) 종료 대기
  for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    if (o) { heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; }
  });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(1100);   // 첫 F 1회 소모 가드 대응 — 2연타
  for (let i = 0; i < 10; i++) {
    try { await h.page.touchscreen.tap(590, 700); } catch (e) { }
    await h.wait(300);
    const dbg = await h.page.evaluate(() => {
      const t = document.getElementById('dialogue-text');
      return { txt: t ? t.textContent.trim().slice(0, 24) : null };
    });
    if (i === 0) {
      const deep = await h.page.evaluate(() => {
        const g = id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { d: cs.display, z: cs.zIndex, h: Math.round(r.height), pe: cs.pointerEvents }; };
        return {
          ovl: g('dialogue-overlay'), box: g('dialogue-box'), bdDlg: g('bd-dialog'),
          scene: !!window.__bdSceneActive,
          topAt700: document.elementsFromPoint(590, 700).slice(0, 4).map(e => e.id || String(e.className).slice(0, 20)),
          whiteText: (() => { const els = [...document.querySelectorAll('div')].filter(e => /쓰레기가 잔뜩/.test(e.textContent || '') && e.children.length === 0); const e = els[0]; if (!e) return null; let p = e; while (p.parentElement && p.parentElement !== document.body) p = p.parentElement; return { rootId: p.id || String(p.className).slice(0, 30) }; })(),
        };
      });
      say('  DOM: ' + JSON.stringify(deep));
      const ch = await h.page.evaluate(() => ({
        chState: window.__bdChoiceState ? { open: __bdChoiceState.open, n: (__bdChoiceState.items || []).length } : null,
        chHTML: (() => { const b = document.getElementById('bd-choice'); return b ? b.innerHTML.replace(/\s+/g, ' ').slice(0, 300) : null; })(),
        chClass: (() => { const b = document.getElementById('bd-choice'); return b ? b.className : null; })(),
      }));
      say('  CHOICE: ' + JSON.stringify(ch));
    }
    if (i % 3 === 0) say('  진행 중 텍스트: ' + JSON.stringify(dbg));
    const ch = await h.page.evaluate(() => { const o = document.querySelector('[id^="bd-ch-"]'); return !!o; });
    if (ch) break;
  }
  // 선택지 가시성 측정 + 확정 (가드 고려 재시도)
  const vis = await h.page.evaluate(() => {
    const o = document.getElementById('bd-ch-investigate');
    if (!o) return null;
    const r = o.getBoundingClientRect(); const cs = getComputedStyle(o);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, bg: cs.backgroundColor, visibleTop: (document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)[0] || {}).id || 'other' };
  });
  say('조사한다 행 가시성: ' + JSON.stringify(vis));
  const cover = await h.page.evaluate(() => {
    const o = document.getElementById('bd-ch-investigate');
    if (!o) return null;
    const r = o.getBoundingClientRect();
    return document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).slice(0, 6).map(e => ({
      id: e.id || null, cls: String(e.className).slice(0, 40), tag: e.tagName,
      z: getComputedStyle(e).zIndex, pe: getComputedStyle(e).pointerEvents,
      bg: getComputedStyle(e).backgroundColor,
    }));
  });
  say('덮개 스택: ' + JSON.stringify(cover));
  await h.shot('tb_choice_open');
  if (vis) {
    await h.page.touchscreen.tap(vis.x + vis.w / 2, vis.y + vis.h / 2);
    await h.wait(900);
    const tapped = await h.page.evaluate(() => ({ open: !!(window.__bdChoiceState && __bdChoiceState.open), vnH: (() => { const b = document.getElementById('dialogue-box'); return b ? Math.round(b.getBoundingClientRect().height) : -1; })() }));
    say('실탭 후: ' + JSON.stringify(tapped));
  }
  for (let k = 0; k < 6; k++) {
    await h.wait(700);
    const r = await h.page.evaluate(() => {
      const S = window.__bdChoiceState;
      const out = { open: S && S.open, idx: S && S.idx, hsr: !!(window.HSR && HSR.active) };
      try { window.BD_choiceConfirm ? BD_choiceConfirm() : (document.getElementById('bd-ch-investigate') || {}).click(); out.called = true; } catch (e) { out.err = String(e).slice(0, 80); }
      out.vnH = (() => { const b = document.getElementById('dialogue-box'); return b ? b.getBoundingClientRect().height : -1; })();
      return out;
    });
    say(`  확정 시도 ${k}: ` + JSON.stringify(r));
    if (await h.page.evaluate(() => !!(window.HSR && HSR.active))) break;
    await h.page.keyboard.press(' '); await h.wait(300);
  }
  await h.wait(3500);
  for (let t = 0; t < 15; t++) { if ((await h.page.evaluate(() => window.HSR && HSR.state)) === 'player') break; await h.wait(500); }
  const btns = await h.page.evaluate(() => [...document.querySelectorAll('.hsr-act')].filter(b => b.offsetHeight > 0).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || '').trim().slice(0, 10), w: Math.round(r.width), h: Math.round(r.height) }; }));
  say('전투 버튼: ' + JSON.stringify(btns));
  const small = btns.filter(b => b.h < 44);
  say(small.length ? '⚠ 44px 미만: ' + JSON.stringify(small) : '버튼 크기 OK');
  await h.shot('tb_battle');
  // 리듬 미니게임 — 카드 열기
  await h.page.keyboard.press('e'); await h.wait(900);
  await h.page.evaluate(() => {
    const els = [...document.querySelectorAll('div,button')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 30 && r.height > 20 && /힘내라 봉담/.test(x.textContent || '') && x.children.length <= 4; });
    const c = els[els.length - 1]; if (c) c.click();
  });
  await h.wait(1300);
  const mg = await h.page.evaluate(() => ({
    ddr: !!document.getElementById('bd-mg-ddr'),
    touchRow: !!document.getElementById('bd-ddr-touch'),
  }));
  say('리듬: ' + JSON.stringify(mg));
  await h.shot('tb_rhythm');
  if (mg.touchRow) {
    // 터치 버튼 탭으로 5개 정타
    const KEY = { '◀': 0, '▼': 1, '▲': 2, '▶': 3 };
    for (let i = 0; i < 7; i++) {
      const ch = await h.page.evaluate(() => { const s = document.querySelector('.ddr-slot-in'); return s ? s.textContent.trim() : null; });
      if (!ch || ch === '✓' || KEY[ch] == null) break;
      await h.page.evaluate((idx) => {
        const b = document.querySelectorAll('#bd-ddr-touch button')[idx];
        if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      }, KEY[ch]);
      await h.wait(230);
    }
    await h.wait(1200);
    const done = await h.page.evaluate(() => ({ gone: !document.getElementById('bd-mg-ddr'), grade: window.__bdMgGrade || null }));
    say('터치 완주: ' + JSON.stringify(done));
  }
  say('콘솔 오류: ' + h.consoleErrors.length);
};
