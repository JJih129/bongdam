// v283→v342 자동 대체 경로 진단 — 200ms 간격 상태 추적
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 30; t++) {
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    window.__trace = [];
    const neo = () => { const d = document.getElementById('bd-map-v342'); return d ? d.classList.contains('show') : 'none'; };
    const oldD = () => { const o = document.getElementById('bd-map-v283'); return o ? (o.style.display || '(empty)') : 'none'; };
    const d0 = document.getElementById('bd-map-v342');
    if (d0) {
      const oAdd = d0.classList.add.bind(d0.classList);
      const oRem = d0.classList.remove.bind(d0.classList);
      d0.classList.add = function (...a) { window.__trace.push(['add', a.join(','), Date.now() % 100000]); return oAdd(...a); };
      d0.classList.remove = function (...a) { window.__trace.push(['remove', a.join(','), (new Error().stack || '').split('\n')[2] || '', Date.now() % 100000]); return oRem(...a); };
    } else {
      // 모달 미생성 상태 — ensure를 위해 한 번 열고 닫는다
      try { BD_openSafetyMap(); BD_closeSafetyMap(); } catch (e) { window.__trace.push(['ensure-err', String(e).slice(0, 120)]); }
    }
    const old = document.getElementById('bd-map-v283');
    window.__trace.push(['before', 'old=' + oldD(), 'neo=' + neo()]);
    if (old) old.style.display = 'flex';
  });
  await h.wait(300);
  // ensure 후 다시 계측 (모달이 이제 존재)
  await h.page.evaluate(() => {
    const d0 = document.getElementById('bd-map-v342');
    if (d0 && !d0.__traced) {
      d0.__traced = true;
      const oAdd = d0.classList.add.bind(d0.classList);
      const oRem = d0.classList.remove.bind(d0.classList);
      d0.classList.add = function (...a) { window.__trace.push(['add', a.join(','), Date.now() % 100000]); return oAdd(...a); };
      d0.classList.remove = function (...a) { window.__trace.push(['remove', a.join(','), (new Error().stack || '').split('\n')[2] || '', Date.now() % 100000]); return oRem(...a); };
    }
  });
  for (let i = 0; i < 10; i++) {
    await h.wait(250);
    const s = await h.page.evaluate(() => {
      const o = document.getElementById('bd-map-v283');
      const d = document.getElementById('bd-map-v342');
      return { old: o ? (o.style.display || '(empty)') : 'none', neo: d ? d.classList.contains('show') : 'no-el' };
    });
    say(`t+${(i + 1) * 250}ms: ` + JSON.stringify(s));
    if (s.neo === true) break;
  }
  const tr = await h.page.evaluate(() => window.__trace);
  say('trace: ' + JSON.stringify(tr).slice(0, 900));
};
