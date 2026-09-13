/* (v399e) 갤러리 검수 반영 묶음 1~6 + 모바일 검증 — 최소 단언 + 스크린샷
 *   node 검수도구/s_batch6_v399.cjs [--url=http://localhost:8788/new/] [--out=검수도구/shots_batch6] */
'use strict';
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const OUT = path.resolve(opt('out', path.join(__dirname, 'shots_batch6'))); fs.mkdirSync(OUT, { recursive: true });
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
  await start(p);
  /* 6. 타이틀 — 이어하기 비활성 표시 (새 컨텍스트에서 확인) */
  /* 6. 3층 길안내 — 배지 전 문구 */
  await snap(p, 'prologue_nav_before_badge');
  await toField(p);
  /* 1. 필드 — 위험요소 근접: 0181 태그 + 캔버스 [F] 없음(시각) */
  await ev(p, `(function(){var st=STAGES[212];var o=(st.objects||[]).find(function(x){return x&&x.hazardId==='ow212_kickboard_1'});heroX=o.rx+(o.rw||0.04)/2;heroY=o.ry+(o.rh||0.05)+0.012;camX=heroX;camY=heroY;})()`); await p.waitForTimeout(1500);
  const tag = await ev(p, `(function(){var t=document.getElementById('bd-f-target');return JSON.stringify({disp:t?t.style.display:'no-el',tag:t?document.getElementById('bd-f-target-tag').textContent:'',busy:!!(window.BD_isInputBlocked&&BD_isInputBlocked()),dami:!!(window.__bdDamiIntroBusy||window.__bdDamiOpeningBusy)});})()`);
  ok(/조사/.test(tag), '위험요소 근접 시 0181 태그 «F · 조사»', tag);
  await snap(p, 'field_hazard_prompt');
  /* 2. 키 안내 바 접기 — 조작 6회 → 미니 칩 · ? 로 펼침 */
  for (let i = 0; i < 7; i++) { await p.keyboard.press('j'); await p.waitForTimeout(120); await p.keyboard.press('Escape'); await p.waitForTimeout(120); }
  await p.waitForTimeout(1400);
  const mini = await ev(p, `(function(){var c=document.getElementById('bd-keybar-chip');return JSON.stringify({mini:document.documentElement.classList.contains('bd-keybar-mini'),chip:!!(c&&getComputedStyle(c).display!=='none'),bar:(function(){var k=document.getElementById('bd-keybar');return !!(k&&getComputedStyle(k).display!=='none');})()});})()`);
  ok(/"mini":true/.test(mini) && /"chip":true/.test(mini) && /"bar":false/.test(mini), '키 안내 바 접힘 + 칩 표시', mini);
  await snap(p, 'keybar_mini');
  await p.keyboard.press('?'); await p.waitForTimeout(400);
  const mini2 = await ev(p, `document.documentElement.classList.contains('bd-keybar-mini')`);
  ok(mini2 === false, '? 키로 키 안내 바 다시 펼침', String(mini2));
  /* 2. 모달 열림 중 담이 흐림 */
  await p.keyboard.press('e'); await p.waitForTimeout(700);
  const dim = await ev(p, `(function(){var h=document.getElementById('bd-dami-hud');return JSON.stringify({open:document.documentElement.classList.contains('bd-modal-open'),op:h?getComputedStyle(h).opacity:null});})()`);
  ok(/"open":true/.test(dim) && /"op":"0\.2/.test(dim), '가방 열림 → 담이 말풍선 흐림', dim);
  /* 4. 가방 제목·탭 우측 안내 */
  const title = await ev(p, `(document.getElementById('inv-title')||{}).textContent`);
  ok(/가방/.test(title) && !/인벤토리/.test(title), '가방 제목 «🎒 가방»', title);
  await ev(p, `(function(){var b=[...document.querySelectorAll('.inv-tab')].find(function(x){return /업적/.test(x.textContent)});if(b)b.click();})()`); await p.waitForTimeout(700);
  const achDetail = await ev(p, `(function(){var d=document.getElementById('inv-detail');return d?getComputedStyle(d).display:'none';})()`);
  ok(achDetail === 'none', '업적 탭에서 우측 아이템 안내 숨김', achDetail);
  await snap(p, 'bag_achieve');
  await ev(p, `(function(){var b=[...document.querySelectorAll('.inv-tab')].find(function(x){return /안전도/.test(x.textContent)});if(b)b.click();})()`); await p.waitForTimeout(700);
  const sf = await ev(p, `(function(){var s=document.querySelector('#inv-safety-panel .safety-skill');var h=document.querySelector('#inv-safety-panel #safety-header');return JSON.stringify({card:s?getComputedStyle(s).backgroundColor:null,head:h?getComputedStyle(h).backgroundColor:null});})()`);
  ok(/rgb\(255, 253, 247\)/.test(sf) && /rgb\(255, 248, 234\)/.test(sf), '안전도 탭 크림 톤', sf);
  await snap(p, 'bag_safety');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 4. 수첩 keep-all */
  await ev(p, `(function(){['trash','bicycle'].forEach(function(v){BD_codexRecord(v)});BD_codexOpen();})()`); await p.waitForTimeout(700);
  const wb = await ev(p, `(function(){var c=document.getElementById('bd-codex');return c?getComputedStyle(c).wordBreak:null;})()`);
  ok(wb === 'keep-all', '수첩 word-break keep-all', wb);
  await snap(p, 'codex_keepall');
  await ev(p, `BD_codexClose()`); await p.waitForTimeout(300);
  /* 5. 지도 범례·자물쇠 */
  await p.keyboard.press('m'); await p.waitForTimeout(900);
  const leg = await ev(p, `(function(){var t=[...document.querySelectorAll('#bd-map-v342 .m42-leg')].map(function(x){return x.textContent.trim()}).join('|');var l=document.querySelector('#bd-map-v342 .m42-lockov');return JSON.stringify({leg:t,lock:l?getComputedStyle(l).fontSize:null});})()`);
  ok(/들러 본 시설/.test(leg) && /안 열린 동네/.test(leg) && /"lock":"22px"/.test(leg), '지도 범례 ✓·🔒 + 자물쇠 22px 모서리', leg.slice(0, 160));
  await snap(p, 'map_legend');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  /* 3. 전투 — 스킬 메뉴 열면 가이드 툴팁 숨김 · 플레이어 패널 */
  await ev(p, `(function(){localStorage.removeItem('bd_battle_guide_done');var st=STAGES[212];var o=(st.objects||[]).find(function(x){return x&&x.hazardId==='ow212_kickboard_1'});heroX=o.rx+(o.rw||0.04)/2;heroY=o.ry+(o.rh||0.05)+0.012;camX=heroX;camY=heroY;BD_hazardInteract(o);})()`); await p.waitForTimeout(900);
  const ch0 = await ev(p, `JSON.stringify({choice:!!(window.__bdChoiceState&&__bdChoiceState.open),dlg:(function(){var e=document.getElementById('dialogue-box');return e?e.textContent.trim().slice(0,60):''})(),hsr:!!(window.HSR&&HSR.active)})`); console.log('  ↳ interact:', ch0);
  if (await ev(p, `!!(window.__bdChoiceState&&__bdChoiceState.open)`) === true) await p.keyboard.press('Enter');
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(400); if (await ev(p, `!!(window.HSR&&HSR.active)`) === true) break; await p.keyboard.press('Space'); }
  for (let i = 0; i < 20; i++) { const st = await ev(p, `(window.HSR&&HSR.state)||''`); if (st === 'player') break; await p.waitForTimeout(400); }
  await p.waitForTimeout(600);
  const cls = await ev(p, `(function(){var e=document.querySelector('.hsr-hero-cls, #hsr-hero-cls');return e?e.textContent:(document.body.innerText.match(/Lv\\.\\d+ [^\\n]{0,20}SPD \\d+/)||[''])[0];})()`);
  ok(!/지킴이 · SPD/.test(cls), '플레이어 패널 «지킴이» 중복 제거', cls);
  await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-skill');if(b)b.click();else if(window.BD_toggleSkillMenu)BD_toggleSkillMenu();})()`); await p.waitForTimeout(600);
  const tipHidden = await ev(p, `(function(){var t=document.getElementById('bd-guide-tip');var m=document.getElementById('hsr-skill-menu');var b=document.querySelector('.hsr-act.hsr-skill');return JSON.stringify({menu:!!m,tip:t?getComputedStyle(t).display:'none',hsr:!!(window.HSR&&HSR.active),state:window.HSR&&HSR.state,btn:!!b,btnDis:b&&(b.disabled||b.classList.contains('hsr-lock')),owned:(window.BD&&BD.unlockedSkills||[]).length});})()`);
  ok(/"menu":true/.test(tipHidden) && /"tip":"none"/.test(tipHidden), '스킬 카드 메뉴 열림 중 가이드 툴팁 숨김', tipHidden);
  await snap(p, 'battle_skillmenu');
  await ev(p, `BD_closeSkillMenu&&BD_closeSkillMenu()`); await p.waitForTimeout(200);
  for (let i = 0; i < 6; i++) { const on = await ev(p, `!!(window.HSR&&HSR.active)`); if (on !== true) break; await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();})()`); await p.waitForTimeout(700); await ev(p, `(function(){var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();})()`); await p.waitForTimeout(1500); }
  await b.close();

  /* 6. 타이틀 이어하기 비활성 (새 브라우저) */
  const b2 = await chromium.launch(); const p2 = await b2.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p2.waitForTimeout(2500);
  const lk = await p2.evaluate(() => { const e = document.getElementById('bd-title-continue'); if (!e) return 'none'; const cs = getComputedStyle(e); return cs.opacity + '|' + e.classList.contains('locked'); });
  ok(/^0\.6[0-9]*\|true/.test(lk), '타이틀 «이어하기» 비활성 표시(opacity .62)', lk);
  await p2.screenshot({ path: path.join(OUT, String(++n).padStart(2, '0') + '_title_locked.jpg'), type: 'jpeg', quality: 86 });
  await b2.close();

  /* 7. 모바일 */
  const b3 = await chromium.launch(); const mc = await b3.newContext({ ...devices['iPhone 13'], locale: 'ko-KR' }); const mp = await mc.newPage();
  await mp.goto(URL, { waitUntil: 'load', timeout: 180000 }); await mp.waitForTimeout(3000);
  await mp.evaluate(() => document.getElementById('bd-title-start').click());
  for (let i = 0; i < 40; i++) { await mp.waitForTimeout(400); if (await mp.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await mp.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } });
  for (let i = 0; i < 40; i++) { await mp.waitForTimeout(500); const s = await mp.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await mp.evaluate(() => { ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75', 'bd_map_tuto_done'].forEach(k => localStorage.setItem(k, '1')); try { BD_PROGRESS.story.tutorialFlags.badgeGiven = true; } catch (e) { } fadeToStage(212, 0.33, 0.40, 200); });
  await mp.waitForTimeout(2500); for (let i = 0; i < 8; i++) { await mp.touchscreen.tap(200, 400); await mp.waitForTimeout(250); }
  const mh = await mp.evaluate(() => { const mb = document.getElementById('bd-menu-btns'); const hp = document.querySelector('#bd-hud, #bd-hp-panel, .bd-hud-top'); const r = mb.getBoundingClientRect(); return { top: Math.round(r.top), touch: document.documentElement.classList.contains('bd-touch-mode'), qh: (function () { const q = document.getElementById('bd-quest-hud'); return q ? getComputedStyle(q).display : 'none'; })() }; });
  ok(mh.touch && mh.top >= 55 && mh.qh === 'none', '모바일 — 메뉴 버튼 아래로(HP 패널과 분리) · 좌측 임무 텍스트 숨김', JSON.stringify(mh));
  await mp.screenshot({ path: path.join(OUT, String(++n).padStart(2, '0') + '_mobile_field.jpg'), type: 'jpeg', quality: 86 });
  await mp.evaluate(() => { try { BD_openSafetyMap(); } catch (e) { } }); await mp.waitForTimeout(900);
  const mm = await mp.evaluate(() => { const t = document.querySelector('#bd-map-v342 .m42-tip'); const bd = document.getElementById('bd-map-v342-board'); const x = document.querySelector('#bd-map-v342 .m42-x'); return { tipW: t ? Math.round(t.getBoundingClientRect().width) : 0, boardW: bd ? Math.round(bd.getBoundingClientRect().width) : 0, boardTop: bd ? Math.round(bd.getBoundingClientRect().top) : -1, close: !!(x && x.getBoundingClientRect().width > 10) }; });
  ok(mm.tipW > 200 && mm.boardW > 250 && mm.boardTop < 400 && mm.close, '모바일 안전지도 — 안내문 가로 배치·지도 본문·닫기 보임', JSON.stringify(mm));
  await mp.screenshot({ path: path.join(OUT, String(++n).padStart(2, '0') + '_mobile_map.jpg'), type: 'jpeg', quality: 86 });
  await b3.close();
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
