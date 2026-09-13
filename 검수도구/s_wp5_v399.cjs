/* (v399e) 약한 부분 5건 검증 — 스크린샷 + 단언
 *   node 검수도구/s_wp5_v399.cjs [--url=http://localhost:8788/new/] [--out=검수도구/shots_wp5]
 *   ③ 임무 문구 «부탁 n/m · 시설 n/m» + 진행 토스트 · ④ 위험요소 끝 → 담이 시설 안내 · 시설 방문 배너 · 조각 토스트 문구
 *   ① 사서 도현 📖 마커 + 지도 담당자 대사 · ② «파티에 합류» 제거 + 엔딩 친구 대사 · ⑤ 3층 PC존·노래방 클리어 전 잠금
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const OUT = path.resolve(opt('out', path.join(__dirname, 'shots_wp5'))); fs.mkdirSync(OUT, { recursive: true });
let fails = 0, n = 0;
const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
const B64 = s => Buffer.from(s, 'utf8').toString('base64');
async function ev(p, js) { return await p.evaluate(b => eval(new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)))), B64(js)).catch(e => 'ERR ' + e.message); }
async function snap(p, name) { n++; const f = String(n).padStart(2, '0') + '_' + name + '.jpg'; await p.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 86 }); console.log('  📸 ' + f); }
async function space(p, k = 12) { for (let i = 0; i < k; i++) { const o = await ev(p, `(function(){var e=document.getElementById('dialogue-box');return !!(e&&e.getBoundingClientRect().height>0);})()`); if (!o) return; await p.keyboard.press('Space'); await p.waitForTimeout(260); } }
const toastText = p => ev(p, `(function(){var a=document.getElementById('bd-toast');var b=document.getElementById('bge-toast');var s='';if(a&&a.classList.contains('show'))s+=a.textContent.trim()+' | ';if(b&&b.offsetHeight)s+=b.textContent.trim();return s;})()`);
const damiText = p => ev(p, `(function(){var t=document.getElementById('bd-dami-hud');return t?t.textContent.replace(/\\s+/g,' ').trim():'';})()`);

(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500);
  await ev(p, `document.getElementById('bd-title-start').click()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await ev(p, `(function(){var m=document.getElementById('bd-startsetup-modal');return !!(m&&m.classList.contains('show'));})()`) === true) break; }
  await ev(p, `(function(){try{BD_pickStartChar(1);BD_confirmStartSetup();}catch(e){}})()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await ev(p, `(function(){try{return currentStage;}catch(e){return null;}})()`); if (s && s !== 1) break; }
  await p.waitForTimeout(1500); await space(p, 6);

  /* 필드로 (튜토 스킵) */
  await ev(p, `(function(){['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_battle_tutorial_seen','bd_shop_tutorial_done_v75','bd_map_tuto_done'].forEach(function(k){localStorage.setItem(k,'1')});fadeToStage(212,0.33,0.40,200);})()`);
  await p.waitForTimeout(2500); await space(p, 8);

  /* ⑤ 3층 PC존 — 클리어 전 F → 담이 잠금 안내 */
  console.log('⑤ 3층 미니게임 잠금');
  await ev(p, `(function(){try{BD_PROGRESS.story.tutorialFlags.badgeGiven=true;}catch(e){}fadeToStage(101,0.515,0.735,200);})()`); await p.waitForTimeout(2200); await space(p, 8);
  for (let i = 0; i < 10; i++) { const g = await ev(p, `!!window.__bdGuideOpen`); if (g !== true) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); }
  await p.waitForTimeout(400);
  await p.keyboard.press('f'); await p.waitForTimeout(700);
  let lock = ''; for (let i = 0; i < 8; i++) { lock = await damiText(p); if (/열려요/.test(lock)) break; await p.waitForTimeout(400); }
  const sel = await ev(p, `!!(window.__bdSelectOpen||document.getElementById('bd-gamesel'))`);
  ok(/완성하면 열려요/.test(lock) && sel !== true, 'PC존 F → 잠금 안내, 게임 선택창 안 뜸', lock.slice(0, 60) + ' / sel=' + sel);
  await snap(p, 'arcade_locked');
  await ev(p, `(function(){BD.gameCleared=true;BD.purified['final_boss_1']=1;})()`); await p.waitForTimeout(3800);
  await p.keyboard.press('f'); await p.waitForTimeout(800);
  const sel2 = await ev(p, `(function(){var g=document.getElementById('bd-gamesel');return !!(window.__bdSelectOpen||window.__bdArcadeOpen||(g&&g.style.display!=='none'));})()`);
  const dbg5 = await ev(p, `(function(){var v=document.getElementById('dialogue-box');return JSON.stringify({guide:!!window.__bdGuideOpen,scene:!!window.__bdSceneActive,choice:!!(window.BD_choiceOpen&&BD_choiceOpen()),dlg:!!(v&&v.offsetHeight>0),hsr:!!(window.HSR&&HSR.active),d:+Math.hypot(heroX-0.515,heroY-0.715).toFixed(3),stage:currentStage,arcade:!!window.__bdArcadeOpen,cleared:!!BD.gameCleared,blocked:!!(BD_isInputBlocked&&BD_isInputBlocked())});})()`);
  ok(sel2 === true, '클리어 후 F → 게임 선택창', 'sel=' + sel2 + ' ' + dbg5);
  await snap(p, 'arcade_unlocked');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await ev(p, `(function(){BD.gameCleared=false;delete BD.purified['final_boss_1'];try{if(window.__bdSelectOpen)window.__bdSelectOpen=false;}catch(e){}fadeToStage(212,0.33,0.40,200);})()`); await p.waitForTimeout(2200); await space(p, 6);

  /* ③ 임무 문구 항목별 진행 · 진행 토스트 */
  console.log('③ 항목별 진행 표시');
  await ev(p, `(function(){var Q=window.QUESTS||window.BD_QUESTS;BD.questIdx=Q.findIndex(function(q){return q.id==='ch1'});BD.purified['ow212_trash_1']=1;var s={ow212_kickboard_1:'r',ow212_bicycle_1:'r'};localStorage.setItem('bd_hzquest_v57',JSON.stringify(s));['ow212_kickboard_1','ow212_bicycle_1'].forEach(function(h){BD.purified[h]=1;});if(window.BD_syncQuestNeeds)BD_syncQuestNeeds();})()`);
  await p.waitForTimeout(2200);
  const qt = await ev(p, `(function(){var Q=window.QUESTS||window.BD_QUESTS;var q=Q[BD.questIdx];return q.objectives[0].t+' '+q.objectives[0].cur+'/'+q.objectives[0].need;})()`);
  ok(/부탁 2\/3 · 시설 0\/3/.test(qt), '임무 목표 문구 «부탁 2/3 · 시설 0/3»', qt);
  await p.keyboard.press('j'); await p.waitForTimeout(700); await snap(p, 'quest_breakdown'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await ev(p, `(function(){window.__bdQPLast=0;BD_questProgress();})()`); await p.waitForTimeout(500);
  const t3 = await toastText(p);
  ok(/와우리 지도 \d+% — 부탁 2\/3 · 시설 0\/3/.test(t3), '진행 토스트 «와우리 지도 n% — 부탁 2/3 · 시설 0/3»', t3);
  await snap(p, 'progress_toast');

  /* ④ 위험요소·부탁 끝, 시설 남음 → 담이 안내 · 시설 방문 배너 */
  console.log('④ 지도 채우기 안내');
  await ev(p, `(function(){var s={ow212_kickboard_1:'r',ow212_bicycle_1:'r',ow212_smoke_1:'r'};localStorage.setItem('bd_hzquest_v57',JSON.stringify(s));['ow212_kickboard_1','ow212_bicycle_1','ow212_smoke_1','ow212_trash_1'].forEach(function(h){BD.purified[h]=1;});localStorage.removeItem('bd_mapfill_hint_wawoo');})()`);
  let hint = ''; for (let i = 0; i < 14; i++) { await p.waitForTimeout(700); hint = await damiText(p); if (/남은 곳 3/.test(hint)) break; }
  ok(/지도를 채울 차례/.test(hint) && /남은 곳 3/.test(hint), '담이 «지도를 채울 차례 … 남은 곳 3»', hint.slice(0, 90));
  await snap(p, 'mapfill_hint');
  await ev(p, `(function(){window.__tl=[];var el=document.getElementById('bd-toast');if(el){new MutationObserver(function(){window.__tl.push(el.textContent.trim());}).observe(el,{childList:true,characterData:true,subtree:true});}var st=STAGES[212];var lm=(st.__v24Landmarks||[]).find(function(l){return l&&l.facilityId==='bongdam_police'})||(st.__v24Landmarks||[]).find(function(l){return l&&l.majorFacility&&!/pharmacy|home_mart|tongtoon|stationery/.test(String(l.facilityId))});if(lm){heroX=Number(lm.interactionX);heroY=Number(lm.interactionY);camX=heroX;camY=heroY;}})()`);
  await p.waitForTimeout(500); await p.keyboard.press('f'); await p.waitForTimeout(1200); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  let ban = ''; for (let i = 0; i < 6; i++) { await p.waitForTimeout(600); ban = await toastText(p); if (/시설 1\/3/.test(ban)) break; }
  const tl = await ev(p, `JSON.stringify({tl:window.__tl||[],visit:BD_MapProgress.region('wawoo').visit,ids:(BD_PROGRESS.facility.visitedFacilityIds||[]).slice(0,5)})`);
  ok((ban.indexOf('시설 1/3') >= 0 && ban.indexOf('남은 곳 2') >= 0) || tl.indexOf('시설 1/3') >= 0, '시설 방문 배너 «와우리 시설 1/3 — 남은 곳 2»', ban + ' ' + tl);
  await snap(p, 'visit_banner');

  /* ① 사서 도현 📖 + 대사 */
  console.log('① 사서 도현');
  await ev(p, `(function(){var Q=window.QUESTS||window.BD_QUESTS;BD.questIdx=Q.findIndex(function(q){return q.id==='ch2'});var st=STAGES[213];var o=(st.objects||[]).find(function(x){return x&&x.resident&&x.npcName==='사서 도현'});fadeToStage(213,o.rx+(o.rw||0.05)/2,o.ry+(o.rh||0.08)+0.02,200);})()`);
  await p.waitForTimeout(2500); await space(p, 8);
  const guide = await ev(p, `(function(){var o=(STAGES[213].objects||[]).find(function(x){return x&&x.npcName==='사서 도현'});return JSON.stringify({mapGuide:!!(o&&o.bdMapGuide),line0:o&&o.npcLines&&o.npcLines[0]});})()`);
  ok(/"mapGuide":true/.test(guide) && /지도를 채우러/.test(guide), '도현 bdMapGuide + 지도 담당자 첫 대사', guide.slice(0, 120));
  await snap(p, 'dohyun_marker');
  await p.keyboard.press('f'); await p.waitForTimeout(800); await snap(p, 'dohyun_dialogue'); await space(p, 10);

  /* ② «파티에 합류» 제거(정적) · 엔딩 친구 대사 */
  console.log('② 친구 3인');
  const html = await ev(p, `(function(){var s='';document.querySelectorAll('script[src]').forEach(function(x){s+=x.src+' ';});return s;})()`);
  const bundleUrl = (html.match(/\S+_game\.js/) || [])[0];
  let src = ''; try { src = await (await p.request.get(bundleUrl)).text(); } catch (e) { }
  ok(src.length > 1000 && !/파티에 합류했다/.test(src) && /연락처를 주고받았어요/.test(src), '빌드에 «파티에 합류» 없음 · «연락처를 주고받았어요» 있음', bundleUrl);
  ok(/야, 봤지\? 다음엔 내가 먼저 알아챌 거야/.test(src) && /사건 종결\. 보고서 마지막 줄엔/.test(src) && /3층 PC존이랑 노래연습실에서 놀다 가/.test(src), '엔딩에 세아·재이·재현 대사 + 3층 개방 대사', '');
  await ev(p, `(function(){try{BD_playScene('final_done');}catch(e){}})()`); await p.waitForTimeout(800);
  let seenSea = false; for (let i = 0; i < 12; i++) { const nm = await ev(p, `(function(){var e=document.getElementById('dialogue-name');return e?e.textContent.trim():'';})()`); if (nm === '세아') { seenSea = true; break; } await p.keyboard.press('Space'); await p.waitForTimeout(350); }
  ok(seenSea, '엔딩 컷신에서 세아 대사 도달', '');
  await snap(p, 'ending_friends');
  await space(p, 20);
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
