/* (v399e) UI 비주얼 전수 캡처 — 타이틀·설정·도움말·시작 설정·프롤로그·대화·필드 HUD·지도·가방(탭별)·임무·안전수첩·리포트·
 *   장비·업적·시설 창·상점·주민 부탁·조사 선택·전투·스킬 카드·타이밍 링·장소 카드·버스·4개 리·일시정지·모바일 2장
 *   node 검수도구/s_shots_ui_v399.cjs [--url=http://localhost:8788/new/] [--out=검수도구/shots_ui_v399]
 *   결과: <out>/NN_name.jpg + <out>/index.json (캡션 포함)
 */
'use strict';
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const OUT = path.resolve(opt('out', path.join(__dirname, 'shots_ui_v399')));
fs.mkdirSync(OUT, { recursive: true });
const shots = []; let n = 0;
const log = m => console.log('  ' + m);
async function snap(p, name, caption, group) {
  n++; const file = String(n).padStart(2, '0') + '_' + name + '.jpg';
  await p.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 86 });
  shots.push({ file, name, caption, group }); log('📸 ' + file + ' — ' + caption);
}
const B64 = s => Buffer.from(s, 'utf8').toString('base64');
/* base64 → UTF-8 복원 (atob 만 쓰면 한글이 깨져 '은지'·'닫기' 비교가 조용히 실패한다) */
async function ev(p, js) { return await p.evaluate(b => eval(new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)))), B64(js)).catch(e => 'ERR ' + e.message); }
async function closeAll(p) {
  /* 배지 수여 연출(#bd-badge-ov)이 떠 있으면 먼저 넘긴다 — 시드가 questIdx 를 올리면 뜬다 */
  for (let i = 0; i < 6; i++) { const bo = await ev(p, `(function(){var e=document.getElementById('bd-badge-ov');if(!e)return false;var cs=getComputedStyle(e);return cs.display!=='none'&&e.getBoundingClientRect().height>2;})()`); if (bo !== true) break; await p.keyboard.press('Space'); await p.waitForTimeout(500); }
  for (let i = 0; i < 6; i++) {
    const open = await ev(p, `(function(){var on=function(e){if(!e)return false;var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return false;var r=e.getBoundingClientRect();return r.width>2&&r.height>2;};
      var m=[...document.querySelectorAll('.bd-modal.show,#bd-district-facility-modal.open,#inv-overlay,#quest-overlay,#bd-codex-ov,#bd-report,#bd-map-v342.show,#bd-place-card,#hsr-skill-menu')].filter(on);return m.length;})()`);
    if (!open) break;
    await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  }
  await ev(p, `(function(){try{BD_codexClose()}catch(e){};try{BD_hideReport()}catch(e){};try{var pc=document.getElementById('bd-place-card');if(pc)pc.style.display='none'}catch(e){}})()`);
  await ev(p, `(function(){var on=function(e){if(!e)return false;var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return false;var r=e.getBoundingClientRect();return r.width>2&&r.height>2;};['bd-bus-modal','bd-district-facility-modal','shop-overlay','bd-result-modal'].forEach(function(id){var m=document.getElementById(id);if(!on(m))return;var b=[...m.querySelectorAll('button')].find(function(x){return /닫기|확인|나가기|✕/.test(x.textContent||'')});if(b)b.click();else{m.classList.remove('show','open');m.style.display='none';}});})()`);
  await p.waitForTimeout(250);
  await p.waitForTimeout(200);
}
async function pressUntilDialogueGone(p, max = 14) {
  for (let i = 0; i < max; i++) {
    const o = await ev(p, `(function(){var e=document.getElementById('dialogue-box');return !!(e&&e.getBoundingClientRect().height>0)||!!(window.BD_isInputBlocked&&BD_isInputBlocked());})()`);
    if (!o) return; await p.keyboard.press('Space'); await p.waitForTimeout(280);
  }
}
async function gotoObj(p, sid, pred, dy = 0.02) {
  const js = `(function(){var st=STAGES[${sid}];var o=(st.objects||[]).find(${pred});if(!o)return 'no';var x=(o.interactionX!=null)?o.interactionX:o.rx+(o.rw||0.05)/2;var y=(o.interactionY!=null)?o.interactionY:o.ry+(o.rh||0.08)+${dy};window.__shotAim=[x,y];fadeToStage(${sid},x,y,200);return 'ok';})()`;
  for (let t = 0; t < 3; t++) {
    const r = await ev(p, js); if (r === 'no') { log('gotoObj: 대상 없음'); return false; }
    await p.waitForTimeout(1300);
    const near = await ev(p, `(function(){var a=window.__shotAim||[0,0];return Number(currentStage)===${sid}&&Math.hypot(heroX-a[0],heroY-a[1])<0.05;})()`);
    if (near === true) return true;
    await closeAll(p); await p.waitForTimeout(600);
  }
  log('gotoObj: 이동 실패'); return false;
}

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(3000);

  /* ── 타이틀 ── */
  await snap(p, 'title', '타이틀 화면 (PC 1440×900)', '타이틀·시작');
  await ev(p, `document.getElementById('bd-settings-btn')&&document.getElementById('bd-settings-btn').click()`); await p.waitForTimeout(700);
  await snap(p, 'title_settings', '설정 (PC 통합 설정 — UI 배율·길안내·튜토 다시보기·도움말)', '타이틀·시작');
  await closeAll(p);
  await ev(p, `window.BD_PC399&&BD_PC399.help&&BD_PC399.help()`); await p.waitForTimeout(600);
  await snap(p, 'help', '도움말 (조작키 안내)', '타이틀·시작');
  await closeAll(p);
  await ev(p, `document.getElementById('bd-title-start').click()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await ev(p, `(function(){var m=document.getElementById('bd-startsetup-modal');return !!(m&&m.classList.contains('show'));})()`) === true) break; }
  await p.waitForTimeout(500);
  await snap(p, 'start_setup', '시작 설정 — 캐릭터 선택', '타이틀·시작');
  await ev(p, `(function(){try{BD_pickStartChar(1);BD_confirmStartSetup();}catch(e){}})()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await ev(p, `(function(){try{return currentStage;}catch(e){return null;}})()`); if (s && s !== 1) break; }
  await p.waitForTimeout(1500);

  /* ── 프롤로그(3층) ── */
  await pressUntilDialogueGone(p, 6);
  await snap(p, 'prologue_3f', '프롤로그 — 문화의집 3층 (실내)', '프롤로그');
  await gotoObj(p, 101, `function(o){return o&&o.resident}`);
  await p.keyboard.press('f'); await p.waitForTimeout(900);
  await snap(p, 'dialogue_teacher', '대화창 — 문화의집 선생님 (배지 수여)', '프롤로그');
  await pressUntilDialogueGone(p, 16);

  /* ── 필드(와우리) — 튜토리얼 스킵 ── */
  await ev(p, `(function(){['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_battle_tutorial_seen','bd_shop_tutorial_done_v75','bd_map_tuto_done'].forEach(function(k){localStorage.setItem(k,'1')});try{BD.gold=(BD.gold||0)+300;}catch(e){}fadeToStage(212,0.33,0.40,200);})()`);
  await p.waitForTimeout(2500); await pressUntilDialogueGone(p, 10);
  for (let i = 0; i < 10; i++) { const g = await ev(p, `!!window.__bdGuideOpen`); if (g !== true) break; await p.keyboard.press('Space'); await p.waitForTimeout(400); }
  await p.waitForTimeout(600);
  await snap(p, 'dami_hud', '담이 말풍선 (좌하단 HUD) — 와우리 도착 직후', '프롤로그');
  await closeAll(p);
  await snap(p, 'field_wawoo', '필드 — 와우리 (상단 메뉴·키바·미니 HUD·길안내 화살표)', '필드·HUD');
  /* ── 중반 진행 상태 시드 (빈 메뉴가 아니라 실제 쓰임새가 보이게) ── */
  const seeded = await ev(p, `(function(){try{BD.items={snack:3,drink:2,potion:1};BD.gold=805;BD.unlockedSkills=['sticker','fan','wash'];BD.equippedSkill='fan';`+
    `['ow212_trash_1','ow212_bicycle_1','ow213_bottle_1'].forEach(function(h){BD.purified[h]=1;});`+
    `['trash','bicycle','bottle','cigarette'].forEach(function(v){try{BD_codexRecord(v);}catch(e){}});`+
    `try{BD.greetedResidents=['bdnpc_seah','ow_npc_parkguard'];}catch(e){}`+
    `try{['facility_wawoo_library','facility_youth_house','facility_bongdam_library'].forEach(function(f){BD_Facility.completeActivity(f,'district_visit');});}catch(e){}`+
    `try{localStorage.setItem('bd_hzquest_v57',JSON.stringify({ow212_kickboard_1:'a'}));}catch(e){}`+
    `try{BD.questIdx=1;}catch(e){}try{if(typeof bdSave==='function')bdSave();}catch(e){}return 'ok';}catch(e){return 'ERR '+e.message;}})()`);
  log('시드: ' + seeded); await p.waitForTimeout(1200); await closeAll(p);
  await p.keyboard.press('m'); await p.waitForTimeout(900);
  await snap(p, 'map', '봉담 안전지도 (M) — 4개 리 진행률·시설 타일·위험요소', '지도');
  await closeAll(p);

  /* ── 가방 탭별 ── */
  await p.keyboard.press('e'); await p.waitForTimeout(800);
  await snap(p, 'bag_all', '가방 (E) — 기본 탭', '가방');
  const tabs = await ev(p, `(function(){return [...document.querySelectorAll('.inv-tab')].map(function(t){return (t.textContent||'').trim()});})()`);
  log('가방 탭: ' + JSON.stringify(tabs));
  if (Array.isArray(tabs)) for (let i = 0; i < tabs.length && i < 6; i++) {
    await ev(p, `(function(){var t=document.querySelectorAll('.inv-tab')[${i}];if(t)t.click();})()`); await p.waitForTimeout(500);
    await ev(p, `(function(){var c=document.querySelector('#inv-overlay .inv-slot, .inv-slot');if(c)c.click();})()`); await p.waitForTimeout(400);
    await snap(p, 'bag_tab' + i, '가방 — 탭 「' + tabs[i] + '」 (첫 칸 클릭 상세)', '가방');
  }
  await closeAll(p);

  /* ── 임무·수첩·리포트·장비·업적 ── */
  await p.keyboard.press('j'); await p.waitForTimeout(800);
  await snap(p, 'quest', '임무창 (J) — 메인 장 + 주민 부탁', '임무·기록');
  await closeAll(p);
  await ev(p, `BD_codexOpen()`); await p.waitForTimeout(800);
  await snap(p, 'codex', '안전수첩 — 배운 안전 지식 (분모 11)', '임무·기록');
  await closeAll(p);
  await ev(p, `BD_showReport()`); await p.waitForTimeout(900);
  await snap(p, 'report', '활동 리포트', '임무·기록');
  await closeAll(p);
  await ev(p, `BD_openEquipModal()`); await p.waitForTimeout(800);
  await snap(p, 'equip', '장비 창 (배지 스킬 장착·보호구)', '임무·기록');
  await closeAll(p);
  await ev(p, `BD_openAchievements()`); await p.waitForTimeout(800);
  await snap(p, 'achievements', '업적', '임무·기록');
  await closeAll(p);
  await ev(p, `BD_showPlaceCard('facility_wawoo_library')`); await p.waitForTimeout(900);
  await snap(p, 'place_card', '장소 카드 (시설 첫 방문 안내)', '시설');
  await closeAll(p);

  /* ── 시설 창·상점 ── */
  await gotoObj(p, 212, `function(o){return o&&/와우약국/.test(o.label||'')&&o.interactionX!=null}`, 0.012);
  await p.keyboard.press('f'); await p.waitForTimeout(1000);
  await snap(p, 'facility_pharmacy', '시설 창 — 와우약국 (물건 구경하기·시설 설명·닫기)', '시설');
  await ev(p, `(function(){var m=document.getElementById('bd-district-facility-modal');var b=m&&[...m.querySelectorAll('button')].find(function(x){return /물건 구경/.test(x.textContent||'')});if(b)b.click();else if(window.BD_openShop)BD_openShop();})()`);
  await p.waitForTimeout(1000);
  await snap(p, 'shop', '상점 — 물건 구경하기', '시설');
  await closeAll(p);
  await gotoObj(p, 212, `function(o){return o&&o.interactable==='bus_stop'}`, 0.012);
  await p.keyboard.press('f'); await p.waitForTimeout(900);
  await snap(p, 'bus', '버스정류장 — 리 이동', '시설');
  await closeAll(p);

  /* ── 주민 부탁 대화 ── */
  await gotoObj(p, 212, `function(o){return o&&o.resident&&o.npcName==='은지'}`);
  await p.keyboard.press('f'); await p.waitForTimeout(700); await p.keyboard.press('Space'); await p.waitForTimeout(500);
  await snap(p, 'npc_request', '주민 대화 — 은지의 부탁 (❗ 길을 막은 킥보드)', '주민·위험요소');
  await pressUntilDialogueGone(p, 12); await p.waitForTimeout(500);

  /* ── 조사 선택 → 전투 ── */
  await ev(p, `(function(){var st=STAGES[212];var o=(st.objects||[]).find(function(x){return x&&x.hazardId==='ow212_kickboard_1'});if(!o)return 'no';heroX=o.rx+(o.rw||0.04)/2;heroY=o.ry+(o.rh||0.05)+0.012;camX=heroX;camY=heroY;BD_hazardInteract(o);return 'ok';})()`);
  await p.waitForTimeout(900);
  const hasChoice = await ev(p, `!!(window.__bdChoiceState&&__bdChoiceState.open)`);
  if (hasChoice === true) { await snap(p, 'hazard_choice', '위험요소 조사 — 선택지 (조사한다 / 지나간다)', '주민·위험요소'); await p.keyboard.press('Enter'); }
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(400); if (await ev(p, `!!(window.HSR&&HSR.active)`) === true) break; await p.keyboard.press('Space'); }
  await p.waitForTimeout(1800);
  await snap(p, 'battle', '전투 — HSR식 턴제 (행동 버튼·약점·HP/SP)', '전투');
  await p.keyboard.press('e'); await p.waitForTimeout(600);
  await snap(p, 'battle_skill_cards', '전투 — 배지 스킬 카드 메뉴 (E)', '전투');
  await ev(p, `BD_closeSkillMenu&&BD_closeSkillMenu()`); await p.waitForTimeout(300);
  await ev(p, `(function(){var on=function(e){var cs=getComputedStyle(e);var r=e.getBoundingClientRect();return cs.display!=='none'&&r.height>2};var l=[...document.querySelectorAll('.hsr-act')].filter(function(e){return on(e)&&!e.disabled&&!e.classList.contains('disabled')&&!e.classList.contains('hsr-lock')});if(l[0])l[0].click();})()`);
  for (let i = 0; i < 12; i++) { await p.waitForTimeout(150); if (await ev(p, `!!document.getElementById('bd-mg-ring')`) === true) break; }
  await p.waitForTimeout(250);
  await snap(p, 'minigame_ring', '전투 — 타이밍 링 미니게임 (정화 스티커)', '전투');
  await p.keyboard.press('Space'); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await snap(p, 'battle_flee_hint', '전투 — ESC 1회: 물러나기 안내 (2회 확인)', '전투');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) { const on = await ev(p, `!!(window.HSR&&HSR.active)`); if (on !== true) break; await ev(p, `(function(){try{var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();}catch(e){}})()`); await p.waitForTimeout(700); await ev(p, `(function(){try{var b=document.querySelector('.hsr-act.hsr-flee');if(b)b.click();}catch(e){}})()`); await p.waitForTimeout(1500); }
  for (let i = 0; i < 10; i++) { const on = await ev(p, `!!(window.HSR&&HSR.active)`); if (on !== true) break; await p.keyboard.press('Space'); await p.waitForTimeout(500); }
  await pressUntilDialogueGone(p, 8); await closeAll(p);
  log('전투 종료 확인: HSR.active=' + await ev(p, `!!(window.HSR&&HSR.active)`));

  /* ── 다른 리 ── */
  for (const [sid, nm, x, y] of [[213, '상리', 0.5, 0.5], [211, '동화리', 0.5, 0.5], [210, '수영리', 0.5, 0.55]]) {
    await ev(p, `fadeToStage(${sid},${x},${y},200)`); await p.waitForTimeout(2200); await pressUntilDialogueGone(p, 8); await closeAll(p);
    await snap(p, 'field_' + sid, '필드 — ' + nm + ' (' + sid + ')', '필드·HUD');
  }
  await ev(p, `fadeToStage(212,0.33,0.40,200)`); await p.waitForTimeout(1500); await closeAll(p);
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  await snap(p, 'pause', '일시정지 (ESC) — 계속하기·저장·타이틀', '필드·HUD');
  await closeAll(p);

  /* ── 모바일 2장 ── */
  const mc = await b.newContext({ ...devices['iPhone 13'], locale: 'ko-KR' });
  const mp = await mc.newPage();
  await mp.goto(URL, { waitUntil: 'load', timeout: 180000 }); await mp.waitForTimeout(3000);
  await snap(mp, 'mobile_title', '모바일(iPhone 13) — 타이틀', '모바일');
  await mp.evaluate(() => document.getElementById('bd-title-start').click());
  for (let i = 0; i < 40; i++) { await mp.waitForTimeout(400); if (await mp.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await mp.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } });
  for (let i = 0; i < 40; i++) { await mp.waitForTimeout(500); const s = await mp.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await mp.evaluate(() => { ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75', 'bd_map_tuto_done'].forEach(k => localStorage.setItem(k, '1')); fadeToStage(212, 0.33, 0.40, 200); });
  await mp.waitForTimeout(2500); for (let i = 0; i < 8; i++) { await mp.touchscreen.tap(200, 400); await mp.waitForTimeout(250); }
  await snap(mp, 'mobile_field', '모바일 — 필드 (조이스틱·터치 버튼)', '모바일');
  await mp.evaluate(() => { try { BD_openSafetyMap(); } catch (e) { } }); await mp.waitForTimeout(900);
  await snap(mp, 'mobile_map', '모바일 — 안전지도', '모바일');

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ url: URL, at: new Date().toISOString(), shots, errors: errs.slice(0, 10) }, null, 1), 'utf8');
  console.log(shots.length + '장 저장 → ' + OUT + ' · 콘솔 오류 ' + errs.length);
  await b.close();
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
