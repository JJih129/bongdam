// 리로드 후 타이틀 클릭 삼킴 추적 — stopPropagation/preventDefault 호출자 스택
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start');
  await h.wait(4000);   // 리로드 완료 대기
  const trace = await h.page.evaluate(() => {
    window.__stopLog = [];
    const wrap = (name) => {
      const o = Event.prototype[name];
      Event.prototype[name] = function () {
        try { window.__stopLog.push({ fn: name, type: this.type, stack: String(new Error().stack).split('\n').slice(2, 5).join(' | ').slice(0, 300) }); } catch (e) { }
        return o.apply(this, arguments);
      };
    };
    ['stopImmediatePropagation', 'stopPropagation', 'preventDefault'].forEach(wrap);
    // 클릭 도달 검사용 리스너
    window.__reach = {};
    const b = document.getElementById('bd-title-start');
    b.addEventListener('click', () => { window.__reach.bubbleBtn = true; });                       // 버블(마지막 등록)
    window.addEventListener('click', () => { window.__reach.winCapture = true; }, true);           // 캡처(늦은 등록 — 기존 캡처 뒤)
    b.click();
    return { log: window.__stopLog, reach: window.__reach };
  });
  say('삼킴 추적: ' + JSON.stringify(trace, null, 1).slice(0, 1600));
  await h.wait(800);
  say('모달: ' + await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }));
};
