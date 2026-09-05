// v337 레이어 생존 확인
module.exports = async (h) => {
  const { say } = h;
  await h.wait(3000);
  const r = await h.page.evaluate(() => ({
    darken: typeof window.__bdDarken,
    useFacWrapped: !!(window.BD_useFacility && BD_useFacility.__v337),
    styleRules: (() => { try { const s = document.getElementById('bd-round18-css-v337'); return s && s.sheet ? s.sheet.cssRules.length : null; } catch (e) { return String(e).slice(0, 40); } })(),
    scriptEl: !!document.getElementById('bd-round18-v337'),
    winHSR: typeof window.HSR,
  }));
  say(JSON.stringify(r));
  const sc = await h.page.evaluate(() => new Promise(res => {
    const host = document.getElementById('hsr-hero-sprite');
    if (!host) return res({ host: false });
    const d = document.createElement('div');
    host.appendChild(d);
    setTimeout(() => {
      res({ host: true, inline: d.style.transform, computed: getComputedStyle(d).transform, kids: host.children.length, scaledFlag: !!d.__bdScaled });
      d.remove();
    }, 1600);
  }));
  say('② 직접: ' + JSON.stringify(sc));
};
