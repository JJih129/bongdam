// 모든 UI 패널이 «열리고 확실히 닫히는지» 점검 — 못 닫히면 진행 막힘
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;

  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(2500);
  await A.advance();
  await h.wait(800);

  const snapshot = async () => await h.page.evaluate(() => {
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 100 && r.height > 100; };
    return [...document.querySelectorAll('body *')].filter(e => on(e) && ['fixed', 'absolute'].includes(getComputedStyle(e).position) && +getComputedStyle(e).zIndex > 50)
      .map(e => e.id || ('.' + String(e.className).split(' ')[0])).filter(x => x && x !== '.').slice(0, 12);
  });

  const base = await snapshot();
  say('기준 화면: ' + JSON.stringify(base));

  const opens = [
    ['E 가방', async () => h.page.keyboard.press('e')],
    ['I 인벤토리', async () => h.page.keyboard.press('i')],
    ['J 임무창', async () => h.page.keyboard.press('j')],
    ['안전수첩 버튼', async () => h.page.click('#bd-codex-btn')],
    ['장비 버튼', async () => h.page.click('#bd-mb-equip')],
    ['장소수첩 버튼', async () => h.page.click('#bd-mb-card')],
    ['안전지도 버튼', async () => h.page.click('#bd-mb-map')],
    ['설정 버튼', async () => h.page.click('#bd-settings-btn')],
    ['ESC 일시정지', async () => h.page.keyboard.press('Escape')],
  ];

  for (const [name, fn] of opens) {
    try {
      await fn();
    } catch (e) { say(`❌ ${name}: 열기 실패 ${String(e).slice(0, 50)}`); continue; }
    await h.wait(1200);
    const opened = await snapshot();
    const added = opened.filter(x => !base.includes(x));
    if (!added.length) { say(`⚠ ${name}: 열리지 않음 (화면 변화 없음)`); continue; }
    await h.shot('p_' + name.replace(/[^\w가-힣]/g, '_'));
    // ESC 로 닫기
    await h.page.keyboard.press('Escape');
    await h.wait(900);
    let after = await snapshot();
    let still = after.filter(x => !base.includes(x));
    let how = 'ESC';
    if (still.length) {
      // 닫기 버튼 시도
      const c = await h.page.evaluate((ids) => {
        for (const id of ids) {
          const e = id.startsWith('.') ? document.querySelector(id) : document.getElementById(id);
          if (!e) continue;
          const b = [...e.querySelectorAll('button,div,span')].reverse().find(x => /^(닫기|확인|✕|✖|X|나가기|계속하기|계속 플레이)/.test((x.textContent || '').trim()) && x.getBoundingClientRect().height > 2);
          if (b) { b.click(); return id + '→' + (b.textContent || '').trim().slice(0, 8); }
        }
        return null;
      }, still);
      await h.wait(900);
      after = await snapshot();
      still = after.filter(x => !base.includes(x));
      how = '닫기버튼(' + c + ')';
    }
    const blocked = await L.blocked();
    say(`${still.length ? '❌' : '✅'} ${name}: 닫기=${how} 남은패널=${JSON.stringify(still)} 입력차단=${blocked.b}`);
    if (still.length) await h.shot('BLOCK_panel_' + name.replace(/[^\w가-힣]/g, '_'));
    // 강제 정리
    await h.page.keyboard.press('Escape'); await h.wait(500);
  }
};
