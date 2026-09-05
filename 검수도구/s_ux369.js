// UX·편의성·가독성 QA 프로브: 키 바인딩→패널, 닫기 버튼 유무, 말풍선/키바 겹침, 글자 크기, 상점 플로우, 스크린샷
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h); const A = require('./auto')(h, L);
  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) { await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }); await h.wait(600); if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break; }
  await h.wait(2500);
  await h.page.evaluate(() => ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75'].forEach(k => localStorage.setItem(k, '1')));
  await h.page.evaluate(() => { try { fadeToStage(212, 0.4, 0.5); } catch (e) { } });
  await h.wait(1500); await A.advance(20);
  const vis = (sel) => h.page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 2 && r.height > 2; }, sel);
  const topPanels = () => h.page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return (cs.position === 'fixed' || cs.position === 'absolute') && +cs.zIndex >= 100 && cs.display !== 'none' && r.width > 300 && r.height > 200 && +cs.opacity > 0.3; }).map(e => e.id || e.className.toString().split(' ')[0]).slice(0, 4));
  // 1) 키 → 패널
  const keys = [['j', '임무(J)'], ['m', '지도(M)'], ['e', '가방(E)'], ['n', '수첩(N)'], ['i', '인벤(I)'], ['Tab', 'Tab'], ['q', 'Q'], ['Escape', 'ESC']];
  for (const [k, nm] of keys) {
    await h.page.keyboard.press(k); await h.wait(700);
    const tp = await topPanels();
    const closeBtn = await h.page.evaluate(() => { const cands = [...document.querySelectorAll('button,div,span')].filter(e => { const t = (e.textContent || '').trim(); const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(e).display !== 'none' && /^(✕|✖|×|X|닫기|닫기 \(Esc\)|닫기 \(ESC\))$/i.test(t); }); return cands.length; });
    say(`  키 ${nm}: 최상위=${JSON.stringify(tp)} 닫기버튼=${closeBtn}`);
    await h.shot('ux_key_' + k);
    await h.page.keyboard.press('Escape'); await h.wait(500);
    // ESC 가 일시정지를 열었으면 다시 닫기
    if (await vis('#bd-pause-modal.show')) { await h.page.keyboard.press('Escape'); await h.wait(400); }
    if (await vis('#bd-pause-modal.show')) { await h.page.evaluate(() => { try { window.BD_resumeGame && BD_resumeGame(); } catch (e) { } }); await h.wait(300); }
  }
  // 2) 담이 말풍선 vs 하단 키바 겹침
  const ov = await h.page.evaluate(() => {
    const b = document.getElementById('bd-dami-hud'); const kb = [...document.querySelectorAll('body *')].find(e => /대화 넘기기/.test(e.textContent || '') && e.getBoundingClientRect().height < 60 && e.getBoundingClientRect().height > 10);
    const rb = b && b.getBoundingClientRect(), rk = kb && kb.getBoundingClientRect();
    const inter = rb && rk && !(rb.right < rk.left || rb.left > rk.right || rb.bottom < rk.top || rb.top > rk.bottom);
    return { bubble: rb && [Math.round(rb.left), Math.round(rb.top), Math.round(rb.width), Math.round(rb.height)], keybar: rk && [Math.round(rk.left), Math.round(rk.top), Math.round(rk.width), Math.round(rk.height)], overlap: !!inter, keybarText: kb && kb.textContent.trim().slice(0, 40) };
  });
  say('  말풍선/키바: ' + JSON.stringify(ov));
  // 3) 글자 크기 표본
  const fonts = await h.page.evaluate(() => {
    const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); return { fs: cs.fontSize, lh: cs.lineHeight, color: cs.color }; };
    return { dialogueText: pick('#dialogue-text'), dami: pick('#bd-dami-hud'), questHud: pick('#bd-quest-hud, .bd-quest-hud, #bd-quest-panel'), keybar: pick('#bd-keybar, .bd-keybar'), toast: pick('#bd-toast'), hp: pick('#gs-hp, .gs-hp') };
  });
  say('  글자: ' + JSON.stringify(fonts));
  // 4) 상점 플로우 (해피24 편의점 F → 물건 구경하기)
  await h.page.evaluate(() => { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; });
  const shopL = await h.page.evaluate(() => { const L = (STAGES[212].__v24Landmarks || []).find(l => /해피24|편의점/.test(l.label)); return L ? [Number(L.interactionX), Number(L.interactionY), L.label] : null; });
  if (shopL) {
    await h.page.evaluate(([x, y]) => { heroX = x; heroY = y + 0.012; camX = heroX; camY = heroY; }, shopL); await h.wait(300);
    await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(800);
    const m1 = await h.page.evaluate(() => { const m = document.getElementById('bd-district-facility-modal'); return m && m.classList.contains('open') ? [...m.querySelectorAll('button')].map(b => b.textContent.trim()) : null; });
    say('  상점 시설 모달: ' + JSON.stringify(m1));
    await h.page.evaluate(() => { const m = document.getElementById('bd-district-facility-modal'); const b = m && [...m.querySelectorAll('button')].find(x => /상점/.test(x.textContent)); if (b) b.click(); });
    await h.wait(1200);
    const shop = await h.page.evaluate(() => { const ids = ['shop-overlay', 'bd-shop', 'bd-shop-modal', 'shop-panel']; const e = ids.map(i => document.getElementById(i)).find(x => x && getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().height > 50); return e ? { id: e.id, items: e.querySelectorAll('.shop-item, .bd-shop-item, [data-item]').length, text: (e.textContent || '').replace(/\s+/g, ' ').slice(0, 160) } : null; });
    say('  상점 패널: ' + JSON.stringify(shop));
    await h.shot('ux_shop');
    await h.page.keyboard.press('Escape'); await h.wait(500);
  }
  // 5) 대화창·선택창 스크린샷 (은지 대화)
  const npc = await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.resident); return o ? [o.rx + (o.rw || 0.04) / 2, o.ry + (o.rh || 0.06) + 0.012, o.label] : null; });
  if (npc) { await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, npc); await h.wait(300); await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(900); await h.shot('ux_dialog'); }
  say('콘솔 오류: ' + h.consoleErrors.length);
};
