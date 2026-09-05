// 저장 → 타이틀 → 이어하기 왕복 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;

  say('▶ 새 게임');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  await A.advance();

  // 진행 상태를 조금 바꿔 둔다
  await h.page.evaluate(() => { try { playerGold = 777; heroX = 0.4; heroY = 0.5; } catch (e) { } });
  await h.wait(400);

  say('▶ 저장 (슬롯 UI)');
  const opened = await h.page.evaluate(() => {
    try { if (typeof window.BD_openSlotUI === 'function') { window.BD_openSlotUI('save'); return 'BD_openSlotUI'; } } catch (e) { }
    return 'none';
  });
  await h.wait(1200);
  await h.shot('s_01_slot_save');
  const slotVisible = await h.page.evaluate(() => {
    const m = document.getElementById('bd-slot-modal') || document.getElementById('modal-save-slot');
    if (!m) return 'no-el';
    const cs = getComputedStyle(m);
    return cs.display + '/' + m.getBoundingClientRect().height + '/' + m.className;
  });
  say('슬롯 UI(' + opened + '): ' + slotVisible);

  // 슬롯 1 클릭
  const clicked = await h.page.evaluate(() => {
    const m = document.getElementById('bd-slot-modal') || document.getElementById('modal-save-slot');
    if (!m) return null;
    const btn = [...m.querySelectorAll('button')].find(b => /여기 저장|덮어쓰기/.test((b.textContent || '').trim()) && b.getBoundingClientRect().height > 4);
    if (btn) { btn.click(); return (btn.textContent || '').trim().slice(0, 20); }
    return null;
  });
  say('슬롯 클릭: ' + clicked);
  await h.wait(1500);
  await h.shot('s_02_after_save');

  const saved = await h.page.evaluate(() => {
    try {
      const r = localStorage.getItem('fantasyRPG_save');
      const slots = Object.keys(localStorage).filter(k => k.indexOf('bongdam_guardian_slot_') === 0);
      return { fantasy: r ? Object.keys(JSON.parse(r)) : null, slots };
    } catch (e) { return String(e); }
  });
  say('저장 슬롯 키: ' + JSON.stringify(saved));

  // 타이틀로 돌아가서 이어하기
  say('▶ 페이지 새로고침 후 이어하기');
  await h.page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(4000);
  await h.shot('s_03_title_again');
  const contBtn = await h.page.evaluate(() => {
    const b = document.getElementById('bd-title-continue');
    if (!b) return 'no-btn';
    const cs = getComputedStyle(b);
    b.click();
    return cs.display + '/' + b.getBoundingClientRect().height;
  });
  say('이어하기 버튼: ' + contBtn);
  await h.wait(2000);
  await h.shot('s_04_load_ui');
  const loadPick = await h.page.evaluate(() => {
    const m = document.getElementById('bd-slot-modal') || document.getElementById('modal-save-slot');
    if (!m) return 'no-modal';
    const btn = [...m.querySelectorAll('.bd-slot-click')].find(b => b.getBoundingClientRect().height > 10);
    if (btn) { btn.click(); return (btn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
    return 'no-slot-btn';
  });
  say('불러오기 클릭: ' + loadPick);
  await h.wait(4000);
  await A.advance();
  await h.shot('s_05_loaded');
  const st = await A.probe();
  say('로드 후: stage=' + st.stage + ' hero=' + JSON.stringify(st.hero) + ' quest=' + JSON.stringify(st.quest));
  const gold = await h.page.evaluate(() => { try { return playerGold; } catch (e) { return null; } });
  say('소지금(777이면 정상): ' + gold);
};
