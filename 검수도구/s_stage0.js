// 단계 0 검증 — 세탁된 배치 데이터가 신규 플레이에 올바르게 반영되는지
module.exports = async function ({ page, say, shot, state, wait, consoleErrors }) {
  await wait(3000);   // 부트 레이어 안정화

  const r = await page.evaluate(() => {
    const out = { errors: [] };
    try {
      // 1) localStorage에 구운 데이터가 주입됐는지 + 오염 잔재 없는지
      const raw = localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest') || '';
      out.lsInjected = raw.length > 100000;
      out.lsHasBdGone = raw.indexOf('__bdGone') >= 0;
      out.lsHasHzLines = raw.indexOf('__bdHzQuestLines') >= 0;
      out.lsHasCopy = raw.indexOf(' 복사"') >= 0;
      // 2) 상리 술병 존재·비소멸
      const st213 = STAGES[213];
      const bottle = (st213.objects || []).find(o => o && o.hazardId === 'ow213_bottle_1');
      out.bottle = bottle ? { hidden: !!bottle.hidden, gone: !!bottle.__bdGone, fam: bottle.hazardFamily } : null;
      // 3) 은지 대사 (부탁 시스템이 아직 덮기 전 원본 또는 offer여야 정상 — '완료 감사'면 오염)
      const eunji = (STAGES[212].objects || []).find(o => o && o.residentId === 'ow_npc_eunji');
      out.eunjiLine = eunji && eunji.npcLines && eunji.npcLines[0];
      // 4) 수영리 오배치 제거 확인
      out.wauriParkIn210 = (STAGES[210].objects || []).some(o => o && o.facilityId === 'wauri_culture_park');
      // 5) 재이·재현 라벨
      const jaei = (STAGES[213].objects || []).find(o => o && o._editorId === 'bdnpc_jaei');
      const jaehyun = (STAGES[211].objects || []).find(o => o && o._editorId === 'bdnpc_jaehyun');
      out.jaeiLabel = jaei && jaei.label;
      out.jaehyunLabel = jaehyun && jaehyun.label;
      // 6) 위험요소 개수 (212 메인 셈)
      out.hz213 = (st213.objects || []).filter(o => o && o.interactable === 'hazard' && o.hazardId && !o.bdOptional && !o.isBoss).map(o => o.hazardId);
    } catch (e) { out.errors.push(String(e)); }
    return out;
  });

  say('검증 결과:', r);
  const pass =
    r.lsInjected === true &&
    r.lsHasBdGone === false && r.lsHasHzLines === false && r.lsHasCopy === false &&
    r.bottle && r.bottle.hidden === false && r.bottle.gone === false && r.bottle.fam === 'dark' &&
    r.wauriParkIn210 === false &&
    r.jaeiLabel === '재이' && r.jaehyunLabel === '재현' &&
    Array.isArray(r.hz213) && r.hz213.includes('ow213_bottle_1');
  say(pass ? '✅ 단계 0 데이터 검증 통과' : '❌ 단계 0 데이터 검증 실패');

  // 7) 타이틀 → 새 게임 진입 스모크 (프롤로그 시작까지)
  try {
    await page.click('#bd-title-start', { timeout: 5000 });
    // 선택 모달이 열려 있으면 DOM 클릭으로 확정 → stage 101 진입까지 폴링
    await page.evaluate(() => {
      window.__probe = { confirms: 0, opens: 0 };
      const oc = window.BD_confirmStartSetup;
      window.BD_confirmStartSetup = function(){ window.__probe.confirms++; return oc.apply(this, arguments); };
      const oo = window.BD_openStartSetup;
      window.BD_openStartSetup = function(){ window.__probe.opens++; return oo.apply(this, arguments); };
    });
    let started = false, log = null;
    for (let t = 0; t < 25 && !started; t++) {
      await wait(800);
      log = await page.evaluate(() => {
        const m = document.getElementById('bd-startsetup-modal');
        const show = !!(m && m.classList.contains('show'));
        if (show) { const b = m.querySelector('button'); if (b) b.click(); }
        return { show, stage: (typeof currentStage !== 'undefined') ? Number(currentStage) : -1, probe: window.__probe };
      });
      started = log.stage === 101;
    }
    say('프롤로그(101) 진입:', started, '· 마지막 관측:', JSON.stringify(log));
    await wait(2500);
    const st = await state();
    say('진입 후 상태:', JSON.stringify({ stage: st.stage, mode: st.mode, hero: st.hero && { x: +(+st.hero.x).toFixed(3), y: +(+st.hero.y).toFixed(3) } }));
    await shot('s0_prologue');
  } catch (e) { say('스모크 실패: ' + e.message); }

  say('콘솔 오류 수: ' + consoleErrors.length);
};
