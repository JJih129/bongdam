module.exports = async (h) => {
  const say = h.say, page = h.page;
  page.on('console', m => { const t = m.text(); if (/bgm|decode|audio/i.test(t)) say('CON ' + t.slice(0, 160)); });
  await h.wait(1200);
  await h.click('#bd-title-start'); await h.wait(800);
  const r = await page.evaluate(async () => {
    const out = {};
    try {
      const d = BD_BgmReal._dbg(); out.dbg = d; out.ogg = BD_BgmReal.oggOK;
      const C = window.AudioContext || window.webkitAudioContext;
      const ctx2 = new C();
      out.state = ctx2.state;
      // mp3 데이터 직접 디코드 시험
      const url = (window.BD_BGM_SLOTS && BD_BGM_SLOTS.field) || null;
      out.urlHead = url ? url.slice(0, 40) : null;
      const ab = await fetch(url).then(x => x.arrayBuffer());
      out.bytes = ab.byteLength;
      try {
        const buf = await new Promise((res, rej) => { const p = ctx2.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
        out.decoded = buf.duration;
      } catch (e) { out.decodeErr = String(e); }
    } catch (e) { out.err = String(e); }
    return out;
  });
  say('WK ' + JSON.stringify(r));
};
