// v327 ④: 장비 구매 → 가방 장비 탭 표시 검증
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  const r = await h.page.evaluate(async () => {
    playerGold = 999; BD.questIdx = 2;
    const ok1 = BD_buyEquip('prot_W');
    const keys = Object.keys((BD.equipV2 && BD.equipV2.owned) || {});
    openInventory();
    await new Promise(r2 => setTimeout(r2, 500));
    // 실제 유저 경로 — 탭 버튼 클릭
    const tabBtn = [...document.querySelectorAll('.inv-tab')].find(b => /장비/.test(b.textContent || ''));
    if (tabBtn) tabBtn.click(); else switchInvTab('equip', null);
    await new Promise(r2 => setTimeout(r2, 500));
    const grid = document.getElementById('inv-grid');
    const slots = grid ? grid.querySelectorAll('.bd-inv-equip').length : -1;
    const emptyMsg = grid ? !!grid.querySelector('.inv-empty') : null;
    // 상세 클릭
    const s = grid && grid.querySelector('.bd-inv-equip');
    if (s) s.click();
    const detail = (document.getElementById('inv-detail') || {}).textContent || '';
    return { ok1, keys, slots, emptyMsg, detailHas: /바람막이/.test(detail), wrapped: !!(window.renderInventory && renderInventory.__v327) };
  });
  say('장비 탭: ' + JSON.stringify(r));
  await h.shot('equip_tab');
  const pass = r.ok1 && r.slots >= 1 && !r.emptyMsg && r.detailHas;
  say((pass ? '✅' : '❌') + ' 장비 인벤 표시');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
