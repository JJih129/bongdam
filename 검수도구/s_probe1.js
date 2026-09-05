// 모험 시작 버튼 무반응 원인 계측
module.exports = async function ({ page, say, wait, shot }) {
  await wait(2500);
  await page.click('#bd-title-start', { timeout: 5000 });
  await wait(2500);

  // 1) 계측 설치: confirm 호출·클릭 도달·show 클래스 변화 추적
  await page.evaluate(() => {
    window.__probe = { confirmCalls: 0, btnClickReached: 0, showToggles: [] };
    const orig = window.BD_confirmStartSetup;
    window.BD_confirmStartSetup = function () {
      window.__probe.confirmCalls++;
      try { window.__probe.confirmStack = new Error().stack.split('\n').slice(1, 4).join(' | '); } catch (e) { }
      return orig.apply(this, arguments);
    };
    const m = document.getElementById('bd-startsetup-modal');
    if (m) {
      const mo = new MutationObserver(() => {
        window.__probe.showToggles.push({ t: Date.now() % 100000, show: m.classList.contains('show') });
      });
      mo.observe(m, { attributes: true, attributeFilter: ['class'] });
      const btn = m.querySelector('button');
      if (btn) btn.addEventListener('click', () => { window.__probe.btnClickReached++; }, true);
    }
  });

  // 2) 실클릭
  const btn = page.locator('#bd-startsetup-modal button').first();
  await btn.click({ timeout: 3000 }).catch(e => say('클릭 예외: ' + e.message));
  await wait(2000);
  let p = await page.evaluate(() => ({ ...window.__probe, show: document.getElementById('bd-startsetup-modal').classList.contains('show'), confirmCb: typeof window.__bdStartConfirm }));
  say('실클릭 후:', JSON.stringify(p));

  // 3) 직접 호출
  await page.evaluate(() => { try { window.BD_confirmStartSetup(); } catch (e) { window.__probe.err = String(e); } });
  await wait(2500);
  p = await page.evaluate(() => ({ ...window.__probe, show: document.getElementById('bd-startsetup-modal').classList.contains('show'), stage: typeof currentStage !== 'undefined' ? currentStage : null }));
  say('직접 호출 후:', JSON.stringify(p));
  await shot('probe1_after');
};
