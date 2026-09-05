module.exports = async (h) => {
  const say = h.say, page = h.page;
  await h.wait(800);
  await page.evaluate(() => localStorage.setItem('bd_force_mp3', '1'));
  await page.reload(); await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1000);
  const r = await page.evaluate(async () => {
    const out = { ogg: BD_BgmReal.oggOK };
    for (let t = 0; t < 20 && BD_BgmReal._dbg().buffers.length < 7; t++) await new Promise(r2 => setTimeout(r2, 500));
    const d = BD_BgmReal._dbg(); out.buffers = d.buffers.length; out.cur = d.cur; out.playing = d.playing;
    return out;
  });
  say('MP3CHECK ' + JSON.stringify(r));
  await page.evaluate(() => localStorage.removeItem('bd_force_mp3'));
};
