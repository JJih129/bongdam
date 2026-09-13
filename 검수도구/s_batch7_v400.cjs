/* (v400) 갤러리 검수 반영 묶음 7 검증 — 임무 창 제목·보상 아이콘 · 장비 제목 · 수첩 블러 · 가방 닫기 안내 · 설정 «다시 보기» · 조작법↔설정 겹침 ·
 *   나침반 칸 문구 · 전투 진입 시 담이 필드 말풍선 정리 · 스킬 메뉴 중 «내 차례» 숨김 · 툴팁 띄어쓰기
 *   node 검수도구/s_batch7_v400.cjs [--url=http://localhost:8788/new/] [--out=검수도구/shots_batch7] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const OUT = path.resolve(opt('out', path.join(__dirname, 'shots_batch7'))); fs.mkdirSync(OUT, { recursive: true });
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
  /* 1. 임무 창 — 제목 «📋 임무» · 보상 카드 아이콘 🎴 */
  await p.keyboard.press('j'); await p.waitForTimeout(800);
  const ql = await ev(p, `(function(){var h=document.querySelector('.bd-qlog2-htitle');var ics=[...document.querySelectorAll('.bd-qlog2-reward-ic')].map(function(x){return x.textContent});return JSON.stringify({title:h?h.textContent:'',ics:ics});})()`);
  ok(/"title":"📋 임무"/.test(ql) && !/🗂/.test(ql), '임무 창 제목 «📋 임무» · 보상 아이콘 🗂 없음', ql);
  await snap(p, 'quest_title');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 2. 장비 창 제목 «🔧 장비» */
  await ev(p, `(function(){try{BD_openEquipModal();}catch(e){}})()`); await p.waitForTimeout(700);
  const eq = await ev(p, `(function(){var t=[...document.querySelectorAll('.bd-modal-title')].map(function(x){return x.textContent}).filter(function(t){return /장비/.test(t)});return JSON.stringify(t);})()`);
  ok(/🔧 장비/.test(eq) && !/주인공 전용/.test(eq), '장비 창 제목 «🔧 장비»', eq);
  await snap(p, 'equip_title');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 3. 수첩 배경 블러 */
  await ev(p, `(function(){['trash','bicycle'].forEach(function(v){BD_codexRecord(v)});BD_codexOpen();})()`); await p.waitForTimeout(700);
  const bf = await ev(p, `(function(){var o=document.getElementById('bd-codex-ov');var cs=o?getComputedStyle(o):null;return cs?(cs.backdropFilter||cs.webkitBackdropFilter||'none'):'no-el';})()`);
  ok(/blur/.test(bf), '수첩 배경 블러', bf);
  await snap(p, 'codex_blur');
  await ev(p, `BD_codexClose()`); await p.waitForTimeout(300);
  /* 4. 가방 닫기 안내 대비 */
  await p.keyboard.press('e'); await p.waitForTimeout(700);
  const ft = await ev(p, `(function(){var f=document.getElementById('inv-footer');var cs=f?getComputedStyle(f):null;return cs?JSON.stringify({color:cs.color,size:cs.fontSize,w:cs.fontWeight}):'no-el';})()`);
  ok(/rgb\(107, 82, 48\)/.test(ft) && /"size":"12px"/.test(ft), '가방 «E 또는 ESC 키로 닫기» 진한 갈색 12px', ft);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 5. 나침반 칸 — 목적지 없을 때 짧은 문구(navigation.routeText) */
  const rt = await ev(p, `(function(){try{var nv=window.__bdNavState||window.BD_NAV_STATE;if(nv&&nv.routeText)return nv.routeText;}catch(e){}return 'n/a';})()`);
  console.log('  ↳ routeText:', rt);
  /* 6. 설정 «다시 보기» 버튼 · 조작법 열면 설정 창 숨김 */
  await ev(p, `(function(){var b=document.getElementById('bd-settings-btn');if(b)b.click();})()`); await p.waitForTimeout(1200);
  const tb = await ev(p, `(function(){var b=document.getElementById('bd-pc-tuto');return b?b.textContent.trim():'none';})()`);
  ok(tb === '다시 보기', '설정 — 튜토리얼 버튼 «다시 보기»', tb);
  await ev(p, `(function(){var h=document.getElementById('bd-set-help');if(h)h.click();})()`); await p.waitForTimeout(600);
  const hv = await ev(p, `(function(){var h=document.getElementById('bd-pc-help');var m=document.getElementById('bd-settings-modal');return JSON.stringify({help:!!h,settingsVis:m?getComputedStyle(m).visibility:'none'});})()`);
  ok(/"help":true/.test(hv) && /"settingsVis":"hidden"/.test(hv), '조작법 창이 뜨면 설정 창 숨김', hv);
  await snap(p, 'help_over_settings');
  await ev(p, `(function(){var b=document.getElementById('bd-pc-help-close');if(b)b.click();})()`); await p.waitForTimeout(400);
  const hv2 = await ev(p, `(function(){var m=document.getElementById('bd-settings-modal');return m?getComputedStyle(m).visibility:'none';})()`);
  ok(hv2 === 'visible', '조작법 닫으면 설정 창 다시 보임', hv2);
  await ev(p, `(function(){var m=document.getElementById('bd-settings-modal');if(m)m.remove();})()`); await p.waitForTimeout(400);
  /* 7. 전투 — 담이 필드 말풍선 정리 · 툴팁 띄어쓰기 · 스킬 메뉴 중 «내 차례» 숨김 */
  await ev(p, `(function(){localStorage.removeItem('bd_battle_guide_done');BD_DAMI.show('앗, 저기 문화의집 앞에 쓰레기가 쌓여 있어요.',{face:'worry'});var st=STAGES[212];var o=(st.objects||[]).find(function(x){return x&&x.hazardId==='ow212_kickboard_1'});heroX=o.rx+(o.rw||0.04)/2;heroY=o.ry+(o.rh||0.05)+0.012;camX=heroX;camY=heroY;BD_hazardInteract(o);})()`); await p.waitForTimeout(900);
  if (await ev(p, `!!(window.__bdChoiceState&&__bdChoiceState.open)`) === true) await p.keyboard.press('Enter');
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(400); if (await ev(p, `!!(window.HSR&&HSR.active)`) === true) break; await p.keyboard.press('Space'); }
  for (let i = 0; i < 20; i++) { const st = await ev(p, `(window.HSR&&HSR.state)||''`); if (st === 'player') break; await p.waitForTimeout(400); }
  await p.waitForTimeout(900);
  const dm = await ev(p, `(function(){var b=document.getElementById('bd-dami-bubble');var t=document.getElementById('bd-dami-text');var tip=document.getElementById('bd-guide-tip');return JSON.stringify({bubbleOn:!!(b&&b.classList.contains('on')),active:!!BD_DAMI._active,txt:t?t.textContent.slice(0,20):'',tip:tip?tip.textContent:''});})()`);
  ok(!/쓰레기가 쌓여/.test(dm) || /"bubbleOn":false/.test(dm), '전투 진입 시 필드 담이 말풍선 접힘', dm);
  ok(/Q\]를 눌러/.test(dm) || !/Q\] 를/.test(dm), '툴팁 «[정화 스티커 Q]를» 띄어쓰기', dm.slice(-80));
  await snap(p, 'battle_enter');
  await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-skill');if(b)b.click();else if(window.BD_toggleSkillMenu)BD_toggleSkillMenu();})()`); await p.waitForTimeout(600);
  const tm = await ev(p, `(function(){var m=document.getElementById('hsr-skill-menu');var t=document.getElementById('hsr-turnmsg');return JSON.stringify({menu:!!m,op:t?getComputedStyle(t).opacity:'none'});})()`);
  ok(/"menu":true/.test(tm) && /"op":"0"/.test(tm), '스킬 카드 메뉴 중 «내 차례» 문구 숨김', tm);
  await snap(p, 'battle_skillmenu_turnmsg');
  await ev(p, `BD_closeSkillMenu&&BD_closeSkillMenu()`); await p.waitForTimeout(200);
  for (let i = 0; i < 6; i++) { const on = await ev(p, `!!(window.HSR&&HSR.active)`); if (on !== true) break; await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();})()`); await p.waitForTimeout(700); }
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
