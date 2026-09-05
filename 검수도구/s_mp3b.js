module.exports = async (h) => {
  const say = h.say, page = h.page;
  await h.wait(1000);
  await page.evaluate(() => localStorage.setItem('bd_force_mp3', '1'));
  await page.reload(); await h.wait(3000);
  say('flag=' + await page.evaluate(() => localStorage.getItem('bd_force_mp3')) + ' ogg=' + await page.evaluate(() => BD_BgmReal.oggOK));
  await h.click('#bd-title-start'); await h.wait(500);
  await page.keyboard.press(' '); await h.wait(500);
  const r = await page.evaluate(async () => {
    for (let t = 0; t < 24 && BD_BgmReal._dbg().buffers.length < 7; t++) await new Promise(r2 => setTimeout(r2, 500));
    return BD_BgmReal._dbg();
  });
  say('DBG ' + JSON.stringify(r));
  await page.evaluate(() => localStorage.removeItem('bd_force_mp3'));
};
