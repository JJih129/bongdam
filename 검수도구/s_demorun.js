// (v397 재작성) 단축 완주 검증 — 구 「짧게 체험하기」 버튼(v379 삭제)에 의존하던 판을
// 현행 부팅으로 교체: 일반 시작 → 튜토 격리 플래그 → 와우리(212) 핵심 루프(정화·정류장) 검증.
// 완전 완주는 s_fullrun 담당 — 이 판은 «6~9분 안에 핵심 동선이 살아 있는가»만 본다.
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const T0 = Date.now();

  // ── 표준 부팅 (v326+ 프리앰블 축약판) ──
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) {} }).catch(() => {});
    await h.wait(700);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }

  // 튜토 격리 후 212 진입
  await h.page.evaluate(() => {
    ['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_shop_tutorial_done_v75'].forEach(k => { try { localStorage.setItem(k, '1'); } catch (e) {} });
  });
  await h.page.evaluate(() => fadeToStage(212, 0.4, 0.5));
  await h.wait(2000);
  // 대사 드레인
  for (let i = 0; i < 10; i++) {
    const talking = await h.page.evaluate(() => {
      const d = document.getElementById('dialogue-box');
      return (d && d.offsetHeight > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!talking) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  say('부팅 완료: ' + JSON.stringify(await h.page.evaluate(() => ({ stg: Number(currentStage) }))));
  await h.shot('demo_boot');

  // ── 핵심 루프: 오토파일럿 (와우리 정화·시설) ──
  let ok = true, purified = 0;
  for (let chunk = 0; chunk < 3; chunk++) {
    if ((Date.now() - T0) / 60000 > 9) { say('⏱ 시간 예산 초과'); break; }
    const res = await A.run(30);
    const p = await A.probe();
    purified = p.purified.length;
    say(`◇ 청크${chunk}: ok=${res.ok} reason=${res.reason || '-'} stg=${p.stage} 정화=${purified} 경과=${((Date.now() - T0) / 60000).toFixed(1)}분`);
    await h.shot(`demo_chunk${chunk}`);
    if (!res.ok && res.reason !== 'steps-exhausted') { ok = false; break; }
    if (purified >= 2) break;   // 핵심 검증 충족 — 정화 루프가 살아 있다
  }

  // ── 정류장 이동 1회 (버스 시스템 검증) ──
  let busOk = false;
  try {
    const r = await h.page.evaluate(() => {
      const st = STAGES[currentStage];
      const stop = (st.objects || []).find(o => o && o.interactable === 'bus_stop' && !o.hidden);
      if (!stop) return { no: 'stop' };
      heroX = stop.rx + stop.rw / 2; heroY = stop.ry + stop.rh + 0.03; camX = heroX; camY = heroY;
      return { ok: true };
    });
    if (r.ok) {
      await h.wait(500);
      await h.page.keyboard.down('f'); await h.wait(90); await h.page.keyboard.up('f');
      await h.wait(1200);
      busOk = await h.page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetHeight > 0 && /수영리|동화리|상리/.test(b.textContent));
        if (btns[0]) { btns[0].click(); return true; }
        return false;
      });
      await h.wait(2500);
    }
  } catch (e) {}
  const stg2 = await h.page.evaluate(() => Number(currentStage));
  say(`버스 이동: 선택=${busOk} → stg=${stg2}`);
  await h.shot('demo_bus');

  const errs = h.consoleErrors;
  const pass = ok && purified >= 1;
  say(`FINAL: ${JSON.stringify({ pass, purified, busMoved: stg2 !== 212, minutes: +(((Date.now() - T0) / 60000).toFixed(1)) })}`);
  say('콘솔 오류: ' + errs.length);
  say(pass && errs.length === 0 ? '✅ 단축 검증 통과' : '❌ 실패 — 위 로그 확인');
  await h.shot('demo_final');
};
