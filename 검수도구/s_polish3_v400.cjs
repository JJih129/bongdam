/* (v400) 검수 반영 잔손질 4건 검증 — 미니맵 «시설 n/m» · 경험치 «n / m» · 정화 스티커 카드 ✨ · 리포트 타일 3열
 *   node 검수도구/s_polish3_v400.cjs [--url=http://localhost:8788/new/] [--out=검수도구/shots_polish3] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const OUT = path.resolve(opt('out', path.join(__dirname, 'shots_polish3'))); fs.mkdirSync(OUT, { recursive: true });
let fails = 0, n = 0;
const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
const B64 = s => Buffer.from(s, 'utf8').toString('base64');
async function ev(p, js) { return await p.evaluate(b => eval(new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)))), B64(js)).catch(e => 'ERR ' + e.message); }
async function snap(p, name) { n++; const f = String(n).padStart(2, '0') + '_' + name + '.jpg'; await p.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 86 }); console.log('  📸 ' + f); }
async function space(p, k = 12) { for (let i = 0; i < k; i++) { const o = await ev(p, `(function(){var e=document.getElementById('dialogue-box');return !!(e&&e.getBoundingClientRect().height>0);})()`); if (!o) return; await p.keyboard.press('Space'); await p.waitForTimeout(260); } }
async function guideOff(p) { for (let i = 0; i < 10; i++) { const g = await ev(p, `!!window.__bdGuideOpen`); if (g !== true) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); } }
async function start(p) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500);
  await ev(p, `document.getElementById('bd-title-start').click()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await ev(p, `(function(){var m=document.getElementById('bd-startsetup-modal');return !!(m&&m.classList.contains('show'));})()`) === true) break; }
  await ev(p, `(function(){try{BD_pickStartChar(1);BD_confirmStartSetup();}catch(e){}})()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await ev(p, `(function(){try{return currentStage;}catch(e){return null;}})()`); if (s && s !== 1) break; }
  await p.waitForTimeout(1500); await space(p, 6);
}
async function toField(p) {
  await ev(p, `(function(){['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_battle_tutorial_seen','bd_shop_tutorial_done_v75','bd_map_tuto_done'].forEach(function(k){localStorage.setItem(k,'1')});try{BD_PROGRESS.story.tutorialFlags.badgeGiven=true;}catch(e){}try{localStorage.setItem('bd_hzquest_v57',JSON.stringify({ow212_kickboard_1:'a'}));BD.purified['ow212_trash_1']=1;var Q=window.QUESTS||window.BD_QUESTS;BD.questIdx=Q.findIndex(function(q){return q.id==='ch1'});}catch(e){}fadeToStage(212,0.33,0.40,200);})()`);
  await p.waitForTimeout(2500); await space(p, 8); await guideOff(p);
}

(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await start(p); await toField(p);
  /* 1. 미니맵 진행도 «시설 n/m» */
  const mm = await ev(p, `(function(){var e=document.querySelector('#bd-district-minimap .bd-district-mini-progress, .bd-district-mini-progress');return e?e.textContent.trim():'none';})()`);
  ok(/^시설 \d+\/\d+$/.test(mm), '미니맵 진행도 «시설 n/m» 라벨', mm);
  /* 2. 경험치 «n / m» (HP 표기와 통일) */
  const xp = await ev(p, `(function(){var e=document.querySelector('.xp-num');return e?e.textContent.trim():'none';})()`);
  ok(/^\d+ \/ \d+$/.test(xp), '경험치 표기 «n / m»', xp);
  await snap(p, 'field_hud');
  /* 3. 리포트 타일 3열 */
  await ev(p, `BD_showReport()`); await p.waitForTimeout(800);
  const rp = await ev(p, `(function(){var g=document.querySelector('#bd-report .grid');var el=document.getElementById('bd-report');return JSON.stringify({on:!!(el&&el.classList.contains('on')),cols:g?getComputedStyle(g).gridTemplateColumns.split(' ').length:0,cells:g?g.children.length:0});})()`);
  ok(/"on":true/.test(rp) && /"cols":3/.test(rp) && /"cells":6/.test(rp), '리포트 통계 타일 3열 × 2행', rp);
  await snap(p, 'report_grid3');
  await ev(p, `(function(){var b=document.getElementById('bd-rp-close');if(b)b.click();})()`); await p.waitForTimeout(400);
  /* 4. 전투 — 정화 스티커 카드 ✨ 아이콘 보임 */
  await ev(p, `(function(){var st=STAGES[212];var o=(st.objects||[]).find(function(x){return x&&x.hazardId==='ow212_kickboard_1'});heroX=o.rx+(o.rw||0.04)/2;heroY=o.ry+(o.rh||0.05)+0.012;camX=heroX;camY=heroY;BD_hazardInteract(o);})()`); await p.waitForTimeout(900);
  if (await ev(p, `!!(window.__bdChoiceState&&__bdChoiceState.open)`) === true) await p.keyboard.press('Enter');
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(400); if (await ev(p, `!!(window.HSR&&HSR.active)`) === true) break; await p.keyboard.press('Space'); }
  for (let i = 0; i < 20; i++) { const st = await ev(p, `(window.HSR&&HSR.state)||''`); if (st === 'player') break; await p.waitForTimeout(400); }
  await p.waitForTimeout(600);
  const card = await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-basic');var i=b&&b.querySelector('.hsr-ai');var s=document.querySelector('.hsr-act.hsr-skill .hsr-ai');return JSON.stringify({basic:!!b,icon:i?i.textContent:'',disp:i?getComputedStyle(i).display:'none',skillIcon:s?getComputedStyle(s).display:'none'});})()`);
  ok(/"basic":true/.test(card) && /"icon":"✨"/.test(card) && /"disp":"block"/.test(card) && /"skillIcon":"none"/.test(card), '정화 스티커 카드 ✨ 표시(배지 카드는 아이콘 없음)', card);
  await snap(p, 'battle_basic_icon');
  for (let i = 0; i < 6; i++) { const on = await ev(p, `!!(window.HSR&&HSR.active)`); if (on !== true) break; await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();})()`); await p.waitForTimeout(700); }
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
