/* (v399e) 검수 메모 반영 확인 — 설정 «UI 크기» 한 줄 · 도움말 단어 줄바꿈 · 타이틀 설정에 «메인 메뉴로» 숨김 · 수첩 라벨 */
'use strict';
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = (process.argv.find(a => a.startsWith('--url=')) || '--url=http://localhost:8788/new/').slice(6);
const OUT = path.join(__dirname, 'shots_wp5'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('bd-settings-btn').click()); await p.waitForTimeout(900);
  const r = await p.evaluate(() => { const row = [...document.querySelectorAll('#bd-settings-modal .bd-pc-row')][0]; const lab = row && row.querySelector('span'); const auto = row && row.querySelector('[data-uis="auto"]'); const main = document.getElementById('bd-set-main'); return { labH: lab ? lab.getBoundingClientRect().height : 0, autoH: auto ? auto.getBoundingClientRect().height : 0, autoW: auto ? auto.getBoundingClientRect().width : 0, mainShown: !!(main && getComputedStyle(main).display !== 'none') }; });
  ok(r.labH > 0 && r.labH < 30, '설정 «UI 크기» 라벨 한 줄', JSON.stringify(r));
  ok(r.autoH > 0 && r.autoH < 40 && r.autoW > 30, '«자동» 버튼 한 줄', '');
  ok(r.mainShown === false, '타이틀에서 연 설정에 «메인 메뉴로 돌아가기» 숨김', 'shown=' + r.mainShown);
  await p.screenshot({ path: path.join(OUT, '10_fix_settings.jpg'), type: 'jpeg', quality: 86 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(() => BD_PC399.help()); await p.waitForTimeout(600);
  const h = await p.evaluate(() => { const box = document.querySelector('#bd-pc-help .box'); const cs = getComputedStyle(box); return { wb: cs.wordBreak, ow: cs.overflowWrap }; });
  ok(h.wb === 'keep-all', '도움말 word-break: keep-all', JSON.stringify(h));
  await p.screenshot({ path: path.join(OUT, '11_fix_help.jpg'), type: 'jpeg', quality: 86 });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('bd-title-start').click());
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await p.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await p.waitForTimeout(1500);
  await p.evaluate(() => { try { BD_codexOpen(); } catch (e) { } }); await p.waitForTimeout(700);
  const cx = await p.evaluate(() => (document.querySelector('#bd-codex-ov .bd-cdx-sub') || {}).textContent || '');
  ok(/배운 안전 지식 \d+ \/ 11/.test(cx), '수첩 라벨 «배운 안전 지식 n / 11»', cx.slice(0, 40));
  await p.evaluate(() => { try { document.getElementById('bd-settings-btn').click(); } catch (e) { } }); await p.waitForTimeout(700);
  const inGame = await p.evaluate(() => { const main = document.getElementById('bd-set-main'); return !!(main && getComputedStyle(main).display !== 'none'); });
  ok(inGame === true, '게임 중 설정에는 «메인 메뉴로 돌아가기» 표시', 'shown=' + inGame);
  await b.close(); console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
