// 재시작 후 'fan' 복원 소스 추적 — sessionStorage 전수 + 복원 스택
module.exports = async (h) => {
  const { say } = h;
  await h.page.addInitScript(() => {
    try {
      window.__skillLog = [];
      const stk = () => String(new Error().stack).split('\n').slice(2, 6).map(s => s.trim().replace(/file:\/\/\/[^\s)]*html/, 'html')).join(' | ').slice(0, 400);
      const wrapArr = (arr) => {
        if (!Array.isArray(arr) || arr.__w) return arr;
        const p = new Proxy(arr, {
          set(t, k, v) { if (typeof v === 'string' && v !== 'sticker') window.__skillLog.push({ op: 'set[' + String(k) + ']=' + v, stack: stk() }); t[k] = v; return true; },
        });
        Object.defineProperty(p, '__w', { value: true });
        return p;
      };
      const iv = setInterval(() => {
        try {
          if (!window.BD) return;
          clearInterval(iv);
          let cur = wrapArr(BD.unlockedSkills);
          Object.defineProperty(BD, 'unlockedSkills', {
            get() { return cur; },
            set(v) { window.__skillLog.push({ op: '재대입 [' + (v || []).join(',') + ']', stack: stk() }); cur = wrapArr(v); },
            configurable: true,
          });
        } catch (e) { }
      }, 40);
      // fantasyRPG_save 쓰기/삭제 로그 — 퍼지에도 살아남는 키에 기록
      const oSet = Storage.prototype.setItem, oRem = Storage.prototype.removeItem;
      const wlog = (entry) => { try { const a = JSON.parse(oSet ? (localStorage.getItem('__qa_writelog') || '[]') : '[]'); a.push(entry); oSet.call(localStorage, '__qa_writelog', JSON.stringify(a.slice(-12))); } catch (e) { } };
      Storage.prototype.setItem = function (k, v) {
        if (k === 'fantasyRPG_save') wlog({ op: 'set', freeze: !!window.__bdFreezeStore, t: Date.now(), stack: stk().slice(0, 220) });
        return oSet.apply(this, arguments);
      };
      Storage.prototype.removeItem = function (k) {
        if (k === 'fantasyRPG_save') wlog({ op: 'REMOVE', freeze: !!window.__bdFreezeStore, t: Date.now(), stack: stk().slice(0, 220) });
        return oRem.apply(this, arguments);
      };
    } catch (e) { }
  });
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      const btn = document.getElementById('bd-title-start');
      return { onTitle: !!(btn && btn.offsetHeight > 0), modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    await h.wait(700);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  await h.page.evaluate(() => { try { BD.unlockedSkills = ['sticker', 'fan']; bdSave(); } catch (e) { } });
  await h.wait(2500);
  const sess = await h.page.evaluate(() => {
    const s = {};
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); s[k] = String(sessionStorage.getItem(k)).slice(0, 60); }
    return s;
  });
  say('오염 후 sessionStorage: ' + JSON.stringify(sess, null, 1).slice(0, 900));
  await h.page.evaluate(() => { try { BD_pauseToTitle(); } catch (e) { } });
  await h.wait(2000);
  await h.page.click('#bd-title-start', { timeout: 8000 });
  for (let k = 0; k < 14; k++) {
    const st = await h.page.evaluate(() => ({
      grant: localStorage.getItem('bd_map_skill_v283'),
      skills: (window.BD && BD.unlockedSkills || []).join(','),
      core: (() => { try { return BD_MapProgress.region('wawoo').core; } catch (e) { return 'ERR'; } })(),
      pct: (() => { try { return BD_MapProgress.region('wawoo').pct; } catch (e) { return 'ERR'; } })(),
    })).catch(() => 'nav');
    say((k * 0.4).toFixed(1) + 's: ' + JSON.stringify(st));
    await h.wait(400);
  }
  const keys = await h.page.evaluate(() => {
    const l = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); l[k] = String(localStorage.getItem(k)).slice(0, 50); }
    return l;
  }).catch(() => 'nav');
  say('전체 키: ' + JSON.stringify(keys, null, 1).slice(0, 1600));
  const gl = await h.page.evaluate(() => window.__skillLog || null).catch(() => 'nav');
  say('스킬 변경 스택: ' + JSON.stringify(gl, null, 1).slice(0, 2400));
  const wl = await h.page.evaluate(() => JSON.parse(localStorage.getItem('__qa_writelog') || '[]')).catch(() => 'nav');
  say('세이브 쓰기 로그: ' + JSON.stringify(wl, null, 1).slice(0, 2600));
};
