// 보고하기 지점 F 라우팅 실측 (v296)
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
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(212, 0.418, 0.495);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const d = await h.page.evaluate(() => {
    heroX = 0.418; heroY = 0.495; camX = heroX; camY = heroY;
    const st = STAGES[212];
    const out = {};
    out.fac = (() => { try { const f = window.BD_v24NearestFacility && BD_v24NearestFacility(); return f ? f.label : null; } catch (e) { return 'ERR' + e; } })();
    out.res = (() => { try { const r = window.BD_nearResident && BD_nearResident(); return r ? (r.label || r.resident) : null; } catch (e) { return 'ERR' + e; } })();
    out.bg = [st.bgW, st.bgH];
    const enji = (st.objects || []).find(o => o && /은지/.test(o.label || ''));
    out.enji = enji ? { type: enji.type, resident: !!enji.resident, r: [enji.rx, enji.ry, enji.rw, enji.rh] } : null;
    return out;
  });
  say('실측: ' + JSON.stringify(d));
  // F를 간격을 두고 3회 — 대화 닫힘 직후 600ms 쿨다운 영향 배제
  for (let k = 0; k < 3; k++) {
    await h.wait(1200);
    await h.key('f', 1, 300);
    await h.wait(900);
    const after = await h.page.evaluate(() => ({
      modal: (() => { const m = document.getElementById('bd-district-facility-modal'); return !!(m && m.classList.contains('open')); })(),
      dlgH: (() => { const e = document.getElementById('dialogue-box'); return e ? e.getBoundingClientRect().height : 0; })(),
      spk: (() => { const e = document.getElementById('dialogue-name'); return e ? e.textContent.trim() : null; })(),
      txt: (() => { const e = document.getElementById('dialogue-text'); return e ? e.textContent.trim().slice(0, 50) : null; })(),
      shop: (() => { const e = document.getElementById('shop-overlay'); return !!(e && getComputedStyle(e).display !== 'none'); })(),
    }));
    say(`F#${k + 1} 후: ` + JSON.stringify(after));
    // 열린 대화는 닫는다
    for (let i = 0; i < 6; i++) { const on = await h.page.evaluate(() => { const e = document.getElementById('dialogue-box'); return !!(e && e.getBoundingClientRect().height > 0); }); if (!on) break; await h.page.keyboard.press(' '); await h.wait(350); }
  }
  await h.shot('fprobe');
};
