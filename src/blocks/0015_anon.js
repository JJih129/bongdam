
// ── 암묵적 전역 변수 사전 선언 (ReferenceError 방지) ──
// currentStage 는 아래 코드에서 let/var 선언 없이 대입만 되는 암묵적 전역이라,
// 대입보다 먼저 읽히면 ReferenceError가 난다. 여기서 미리 window에 정의해 둔다.
// (camX/camY 등은 뒤에서 let 으로 선언되므로 여기서 건드리지 않는다.)
if (typeof window.currentStage === 'undefined') window.currentStage = 1;
// ── 전체화면 진입/복귀 컨트롤러 ──
(function () {
  'use strict';

  var restoreButton = null;
  var firstActivationArmed = true;
  var enteredFullscreen = false;

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement ||
           document.mozFullScreenElement || document.msFullscreenElement || null;
  }
  function isInstalledFullscreen() {
    try { return !!(window.matchMedia && matchMedia('(display-mode: fullscreen)').matches); }
    catch (e) { return false; }
  }
  function isFs() { return !!fullscreenElement() || isInstalledFullscreen(); }

  function ensureRestoreButton() {
    if (restoreButton) return restoreButton;
    var style = document.createElement('style');
    style.id = 'bd-fullscreen-style-v382';
    /* (v391) 우측상단 고정은 ⚙·☰·🎒 버튼을 가렸다(특히 iOS «홈 화면에 추가» 안내가 상주) → 상단 중앙 */
    style.textContent = '#bd-fullscreen-return{position:fixed;top:max(12px,env(safe-area-inset-top));'
      + 'left:50%;transform:translateX(-50%);z-index:2147482500;border:1px solid rgba(255,216,107,.8);'
      + 'border-radius:999px;padding:9px 14px;background:rgba(13,20,40,.94);color:#ffd86b;'
      + 'font:700 13px/1.2 sans-serif;letter-spacing:-.2px;box-shadow:0 5px 18px rgba(0,0,0,.45);'
      + 'cursor:pointer;display:none;touch-action:manipulation}'
      + '#bd-fullscreen-return:hover{background:rgba(32,44,72,.98)}'
      + '#bd-fullscreen-return:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}'
      + '@media(max-width:600px){#bd-fullscreen-return{font-size:12px;padding:8px 11px}}';
    (document.head || document.documentElement).appendChild(style);
    restoreButton = document.createElement('button');
    restoreButton.id = 'bd-fullscreen-return';
    restoreButton.type = 'button';
    restoreButton.setAttribute('aria-label', '전체화면으로 보기');
    restoreButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      requestFs();
    });
    document.body.appendChild(restoreButton);
    return restoreButton;
  }
  function offerFullscreen(label) {
    if (isFs()) return;
    var button = ensureRestoreButton();
    button.textContent = label || '⛶ 전체화면으로 보기';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
  }
  function hideFullscreenOffer() {
    if (restoreButton) restoreButton.style.display = 'none';
  }

  function requestFs() {
    try { window.scrollTo(0, 1); } catch (eScroll) { }
    if (isFs()) { hideFullscreenOffer(); return Promise.resolve(true); }
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (!fn) { offerFullscreen('⛶ 홈 화면에 추가하면 전체화면'); return Promise.resolve(false); }
    try {
      var result;
      if (fn === el.requestFullscreen) {
        try { result = fn.call(el, { navigationUI: 'hide' }); }
        catch (eOption) { result = fn.call(el); }
      } else {
        result = fn.call(el);
      }
      if (result && typeof result.then === 'function') {
        return result.then(function () {
          enteredFullscreen = true;
          firstActivationArmed = false;
          hideFullscreenOffer();
          return true;
        }).catch(function () {
          offerFullscreen('⛶ 전체화면으로 보기');
          return false;
        });
      }
      enteredFullscreen = true;
      firstActivationArmed = false;
      hideFullscreenOffer();
      return Promise.resolve(true);
    } catch (e) {
      offerFullscreen('⛶ 전체화면으로 보기');
      return Promise.resolve(false);
    }
  }

  function exitFs() {
    try {
      var ex = document.exitFullscreen || document.webkitExitFullscreen ||
               document.mozCancelFullScreen || document.msExitFullscreen;
      return ex ? ex.call(document) : null;
    } catch (e) { return null; }
  }
  function toggleFs() {
    if (fullscreenElement()) return exitFs();
    return requestFs();
  }

  window.BD_isFullscreen = isFs;
  window.BD_requestFullscreen = requestFs;
  window.BD_toggleFullscreen = toggleFs;

  /* 브라우저는 사용자 동작 없는 requestFullscreen()을 거부한다.
     그래서 PC·태블릿 모두 첫 포인터/키 입력 자체를 활성화 제스처로 사용한다. */
  function isEditableTarget(target) {
    if (!target || !target.tagName) return false;
    var tag = String(target.tagName).toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || !!target.isContentEditable;
  }
  function onFirstActivation(e) {
    if (!firstActivationArmed || isFs()) return;
    if (e.target && e.target.id === 'bd-fullscreen-return') return; // 전용 버튼의 click 핸들러가 한 번만 요청
    if (e.type === 'keydown') {
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      if (e.key === 'F11' || ((e.key === 'F' || e.key === 'f') && e.shiftKey && !e.ctrlKey && !e.altKey)) return;
      if (isEditableTarget(e.target)) return;
    }
    firstActivationArmed = false;
    requestFs();
  }
  if ('PointerEvent' in window) window.addEventListener('pointerdown', onFirstActivation, true);
  else {
    window.addEventListener('mousedown', onFirstActivation, true);
    window.addEventListener('touchend', onFirstActivation, { capture: true, passive: true });
  }
  window.addEventListener('keydown', onFirstActivation, true);

  /* F는 조사·대화 키이므로 Shift+F와 F11만 수동 토글로 사용한다. */
  document.addEventListener('keydown', function (e) {
    try {
      if (e.key === 'F11' || ((e.key === 'F' || e.key === 'f') && e.shiftKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        e.stopPropagation();
        toggleFs();
      }
    } catch (err) { }
  }, true);

  function onFullscreenChange() {
    if (isFs()) {
      enteredFullscreen = true;
      firstActivationArmed = false;
      hideFullscreenOffer();
    } else if (enteredFullscreen) {
      /* ESC로 브라우저 전체화면이 해제되는 것은 웹페이지가 막을 수 없다.
         대신 즉시 보이는 복귀 버튼으로 한 번의 입력만 요구한다. */
      offerFullscreen('⛶ 전체화면으로 돌아가기');
    }
    try { setTimeout(function () { if (typeof forceRender === 'function') forceRender(); }, 60); } catch (e) { }
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('fullscreenerror', function () { offerFullscreen('⛶ 전체화면으로 보기'); });
  document.addEventListener('webkitfullscreenerror', function () { offerFullscreen('⛶ 전체화면으로 보기'); });

  // 첫 화면에서도 가능한 동작을 명확히 보여 주고, 모바일 주소창은 최대한 접는다.
  window.addEventListener('load', function () {
    setTimeout(function () {
      try { window.scrollTo(0, 1); } catch (e) { }
      if (!isFs()) offerFullscreen('⛶ 전체화면으로 시작');
    }, 700);
  });
  function onOrient() { setTimeout(function () { try { window.scrollTo(0, 1); } catch (e) { } }, 300); }
  window.addEventListener('orientationchange', onOrient);
  window.addEventListener('resize', onOrient);
})();
// ── 파티클 생성 ──
const pc = document.getElementById('particles');
for (let i = 0; i < 24; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random() * 100 + '%';
  p.style.bottom = '-4px';
  p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
  p.style.animationDuration = (8 + Math.random() * 12) + 's';
  p.style.animationDelay = (Math.random() * 12) + 's';
  pc.appendChild(p);
}

// ── 모달 제어 ──
function openModal(id) {
  document.getElementById('modal-' + id).classList.add('active');
  if (id === 'new') { setTimeout(_initCharSelect, 80); }
}
function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('active');
}

// 오버레이 배경 클릭 시 닫기
document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', e => {
    if (e.target === o) o.classList.remove('active');
  });
});

// ESC 키 닫기 (게임 화면 실행 중에는 게임 키 리스너가 처리하므로 제외)
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var gs = document.getElementById('game-screen');
  if (gs && gs.style.display === 'block') {
    if (!window._gameSaved) { openModal('esc-warn'); } else { forceExitGame(); }
    return;
  }
  document.querySelectorAll('.overlay.active').forEach(function(o){ o.classList.remove('active'); });
});

// ── 슬롯 불러오기 ──
// ━━ 저장/불러오기 시스템 ━━
var SAVE_KEY = 'fantasyRPG_save';
window._gameSaved = true;
window._exitAfterSave = false;

function getSlotData(slot) {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    var all = JSON.parse(raw);
    return all[String(slot)] || null;
  } catch(e) { return null; }
}

function buildSaveData() {
  var stageName = (typeof STAGES !== 'undefined' && STAGES[currentStage]) ? STAGES[currentStage].name : '';
  var inv = {};
  Object.keys(playerInventory || {}).forEach(function(id){ inv[id] = playerInventory[id].count; });
  var skillSnap = {};
  Object.keys(safetySkillLevels).forEach(function(k){ skillSnap[k] = safetySkillLevels[k]; });
  return {
    sv: (window.BD_SAVE_VERSION || 1),
    hero: heroName||'지킴이', charId: selectedCharacter||1, savedAt: Date.now(),   // (v270) heroClass 저장 중단
    stage: currentStage||1, location: stageName, heroX: heroX||0.5, heroY: heroY||0.8,
    hp: heroHP||100, level: safetyLevel||1, exp: safetyXP||0, expMax: safetyXP_MAX||100,
    points: safetyPoints||0, skillLevels: skillSnap, gold: playerGold||0, inventory: inv,
    facility: (window.BD_PROGRESS ? JSON.parse(JSON.stringify(BD_PROGRESS.facility)) : undefined),
    safety: (window.BD_PROGRESS ? JSON.parse(JSON.stringify(BD_PROGRESS.safety)) : undefined),
    story: (window.BD_PROGRESS ? JSON.parse(JSON.stringify(BD_PROGRESS.story)) : undefined),
    questState: (typeof quest_state !== 'undefined' ? quest_state : 'offer'),
    questObj: (typeof QUEST_DEF !== 'undefined' ? QUEST_DEF.objectives.map(function(o){return o.cur;}) : [])
  };
}

/** 자동 저장 — 'auto' 슬롯에 조용히 덮어쓰기 (전투 진입/이동/구매 시 호출) */
function autoSave(reason) {
  try {
    // 게임 화면이 아직 시작되지 않았으면 저장하지 않음
    var gs = document.getElementById('game-screen');
    if (!gs || gs.style.display !== 'block') return;
    var raw = localStorage.getItem(SAVE_KEY);
    var all = raw ? JSON.parse(raw) : {};
    var __snap = buildSaveData();
    all['auto'] = __snap;
    // (v93) 최상위(bdLoad가 읽는 자리)에도 최신 값을 반영해 두 저장 계열을 일치시킨다
    try{
      ['gold','hp','stage','heroX','heroY','level','exp','savedAt','hero','charId','location']
        .forEach(function(k){ if (typeof __snap[k] !== 'undefined') all[k] = __snap[k]; });
    }catch(eSy){}
    all['auto'].auto = true;
    all['auto'].autoReason = reason || '';
    localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    window._gameSaved = true;
  } catch(e) { /* 자동 저장 실패는 조용히 무시 */ }
}
window.autoSave = autoSave;

function saveToSlot(slot) {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    var all = raw ? JSON.parse(raw) : {};
    all[String(slot)] = buildSaveData();
    localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    window._gameSaved = true;
    var btn = document.getElementById('save-btn');
    if (btn) { btn.textContent='✅ 저장됨'; setTimeout(function(){ btn.textContent='💾 저장'; }, 1500); }
    if (window._exitAfterSave) { window._exitAfterSave=false; forceExitGame(); }
    closeModal('save-slot');
  } catch(e) { alert('저장 실패: '+e.message); }
}

function openSaveSlotModal(exitAfter) {
  window._exitAfterSave = exitAfter||false;
  var list = document.getElementById('save-slot-list');
  list.innerHTML = '';

  // ── Auto Save 슬롯 (맨 위, 안내용) ──
  (function(){
    var d = getSlotData('auto');
    if (!d) return;
    var div = document.createElement('div');
    div.className = 'save-slot';
    div.style.borderColor = 'rgba(96,165,250,.55)';
    div.style.cursor = 'default';
    var dt = new Date(d.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    div.innerHTML = '<div><div style="font-weight:700;color:#7dd3fc">🔄 Auto Save <span style="font-size:11px;opacity:.7">(자동)</span></div>'
      +'<div style="font-size:12px;opacity:0.7">Lv.'+(d.level||1)+' · '+(d.location||'스테이지 '+(d.stage||1))+' · HP '+(d.hp||100)+' · '+(d.gold||0)+'G</div></div>'
      +'<div style="font-size:12px;color:var(--parchment-dark)">'+dt+'</div>';
    list.appendChild(div);
  })();

  for (var s=1; s<=3; s++) {
    (function(n){
      var d = getSlotData(n);
      var div = document.createElement('div');
      if (d) {
        div.className = 'save-slot';
        var dt = new Date(d.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
        div.innerHTML = '<div><div style="font-weight:700;color:var(--gold-bright)">슬롯'+n+' — '+(d.hero||'지킴이')+'</div>'
          +'<div style="font-size:12px;opacity:0.7">Lv.'+(d.level||1)+' · '+(d.location||'스테이지 '+(d.stage||1))+' · HP '+(d.hp||100)+' · '+(d.gold||0)+'G</div></div>'
          +'<div style="font-size:12px;color:var(--parchment-dark)">'+dt+'</div>';
        div.onclick = function(){
          document.getElementById('overwrite-msg').innerHTML = '슬롯'+n+' ('+( d.hero||'지킴이')+')<br>데이터를 덮어씌우겠습니까?';
          document.getElementById('overwrite-yes-btn').onclick = function(){ closeModal('save-overwrite'); saveToSlot(n); };
          closeModal('save-slot'); openModal('save-overwrite');
        };
      } else {
        div.className = 'save-slot'; div.style.opacity='0.6';
        div.innerHTML = '<div>슬롯'+n+' — 비어 있음</div>';
        div.onclick = function(){ saveToSlot(n); };
      }
      list.appendChild(div);
    })(s);
  }
  openModal('save-slot');
}

function openContinueModal() {
  var list = document.getElementById('continue-slots');
  if (!list) return;
  list.innerHTML = '';
  var hasAny = false;

  // ── Auto Save 슬롯 (맨 위) ──
  (function(){
    var d = getSlotData('auto');
    var div = document.createElement('div');
    if (d) {
      hasAny = true;
      div.className = 'save-slot';
      div.style.borderColor = 'rgba(96,165,250,.55)';
      var dt = new Date(d.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
      div.innerHTML = '<div><div style="font-weight:700;color:#7dd3fc">🔄 Auto Save</div>'
        +'<div style="font-size:12px;opacity:0.7">Lv.'+(d.level||1)+' · '+(d.location||'스테이지 '+(d.stage||1))+' · HP '+(d.hp||100)+' · '+(d.gold||0)+'G</div></div>'
        +'<div style="font-size:12px;color:var(--parchment-dark)">'+dt+'</div>';
      div.onclick = function(){ loadFromSlot('auto'); };
      list.appendChild(div);
    }
  })();

  for (var s=1; s<=3; s++) {
    (function(n){
      var d = getSlotData(n);
      var div = document.createElement('div');
      if (d) {
        hasAny = true;
        div.className = 'save-slot';
        var dt = new Date(d.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
        div.innerHTML = '<div><div style="font-weight:700;color:var(--gold-bright)">슬롯'+n+' — '+(d.hero||'지킴이')+'</div>'
          +'<div style="font-size:12px;opacity:0.7">Lv.'+(d.level||1)+' · '+(d.location||'스테이지 '+(d.stage||1))+' · HP '+(d.hp||100)+' · '+(d.gold||0)+'G</div></div>'
          +'<div style="font-size:12px;color:var(--parchment-dark)">'+dt+'</div>';
        div.onclick = function(){ loadFromSlot(n); };
      } else {
        div.className = 'save-slot'; div.style.opacity='0.55';
        div.innerHTML = '<div>슬롯'+n+' — 비어 있음</div>';
        div.onclick = function(){ closeModal('continue'); openModal('new'); };
      }
      list.appendChild(div);
    })(s);
  }
  openModal('continue');
}

function loadFromSlot(slot) {
  var d = getSlotData(slot);
  if (!d) return;
  d = (window.BD_migrateSave || function(x){return x;})(d);   // (v215) 세이브 버전 마이그레이션
  closeModal('continue');
  currentStage = d.stage||1;
  heroX = d.heroX||0.5; heroY = d.heroY||0.8;
  heroClass = 'warrior';   // (v270) 직업 제거 — 항상 전사 동작 세트, 능력치 동일
  // (v270) v4 진행 상태 복원
  try {
    if (window.BD_PROGRESS) {
      if (d.facility) BD_PROGRESS.facility = Object.assign(BD_PROGRESS.facility, d.facility);
      if (d.safety) BD_PROGRESS.safety = Object.assign(BD_PROGRESS.safety, d.safety);
      if (d.story) BD_PROGRESS.story = Object.assign(BD_PROGRESS.story, d.story);
    }
  } catch (eP4) { }
  selectedCharacter = d.charId||1;
  heroHP = d.hp||100;
  safetyLevel = d.level||1;
  safetyXP = d.exp||0;
  safetyXP_MAX = d.expMax||100;
  safetyPoints = d.points||0;
  // safetySkillLevels는 const → 내부값만 교체
  Object.keys(safetySkillLevels).forEach(function(k){ delete safetySkillLevels[k]; });
  Object.assign(safetySkillLevels, d.skillLevels||{});
  playerGold = d.gold||0;
  playerInventory = {};
  try {
    if (d.inventory) {
      Object.keys(d.inventory).forEach(function(id){
        var cnt = d.inventory[id];
        var item = ITEM_POOL.find(function(it){ return it.id===id; });
        if (item && cnt>0) playerInventory[id] = {item:item, count:cnt};
      });
    }
  } catch(e) {}
  // 퀘스트 상태 복원
  try {
    // (v240g) 사서 데모 퀘스트 비활성 — 세이브에 남은 옛 상태도 무시하고 항상 'done'
    if (typeof quest_state !== 'undefined') quest_state = 'done';
    if (typeof QUEST_DEF !== 'undefined' && Array.isArray(d.questObj)) {
      QUEST_DEF.objectives.forEach(function(o, i){ if (typeof d.questObj[i] === 'number') o.cur = d.questObj[i]; });
    }
  } catch(e) {}
  window._gameSaved = true;
  setTimeout(function(){ enterGameScreen(d.hero, true); }, 150);
}

function handleBackToMenu() {
  if (!window._gameSaved) { openModal('esc-warn'); } else { forceExitGame(); }
}
function forceExitGame() { window._gameSaved=true; exitGame(); }

// ── 캐릭터 선택 UI ──
function selectCharacter(n) {
  selectedCharacter = n;
  var c1 = document.getElementById('char-card-1');
  var c2 = document.getElementById('char-card-2');
  if (!c1 || !c2) return;
  if (n === 1) {
    c1.style.border = '3px solid var(--gold)';
    c1.style.background = 'rgba(200,144,42,0.18)';
    c2.style.border = '2px solid rgba(200,144,42,0.35)';
    c2.style.background = 'rgba(0,0,0,0.18)';
  } else {
    c2.style.border = '3px solid var(--gold)';
    c2.style.background = 'rgba(200,144,42,0.18)';
    c1.style.border = '2px solid rgba(200,144,42,0.35)';
    c1.style.background = 'rgba(0,0,0,0.18)';
  }
}

function _initCharSelect() {
  var img1 = document.getElementById('char-img-1');
  if (img1 && _sprImgs['front'] && _sprImgs['front'][0]) {
    img1.src = _sprImgs['front'][0].src;
  }
  var img2 = document.getElementById('char-img-2');
  if (img2) {
    img2.src = (typeof MALE_FRONT_STILL !== 'undefined') ? MALE_FRONT_STILL
             : (_maleImgs['front'] && _maleImgs['front'][0] ? _maleImgs['front'][0].src : '');
  }
  selectCharacter(selectedCharacter || 1);
}

// ── 새 게임 시작 ──
function createNewGame() {
  const name = document.getElementById('hero-name').value.trim() || '이름 없는 지킴이';
  // (v128) 직업·난이도 선택 제거 — 내부 기본값(warrior)만 조용히 유지 (필드 탐험 스킬 시스템 호환용)
  heroClass = 'warrior';
  closeModal('new');
  setTimeout(() => enterGameScreen(name), 150);
}

// ── 옵션 탭 전환 ──
function switchTab(name, btn) {
  document.querySelectorAll('.opt-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.opt-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).style.display = 'block';
  btn.classList.add('active');
  if (name === 'keys') renderKeyList();
}

// ── 키 배치 데이터 ──
const DEFAULT_KEYS = [
  { id:'move_up',    label:'위로 이동',       cat:'이동', key:'W', kbId:'kb-up' },
  { id:'move_down',  label:'아래 이동',       cat:'이동', key:'S', kbId:'kb-down' },
  { id:'move_left',  label:'왼쪽 이동',       cat:'이동', key:'A', kbId:'kb-left' },
  { id:'move_right', label:'오른쪽 이동',     cat:'이동', key:'D', kbId:'kb-right' },
  // (v239) 좌클릭 평타 제거에 따라 키 설정에서도 삭제
  { id:'mage_elem',  label:'마법사 속성 전환', cat:'스킬', key:'R'  },
  { id:'hw_skill',   label:'하드웨어 스킬',   cat:'스킬', key:'Z'  },
  { id:'interact',   label:'상호작용',        cat:'기타', key:'F'  },
  { id:'inventory',  label:'인벤토리',        cat:'기타', key:'E'  },
  { id:'menu',       label:'메뉴 / 종료',     cat:'기타', key:'Escape', display:'ESC' },
];
let currentKeys = DEFAULT_KEYS.map(k => ({ ...k }));
let listeningId = null;

// 키보드 시각화 초기화
function initKbVisual() {
  const map = { 'kb-up':'kb-up','kb-down':'kb-down','kb-left':'kb-left','kb-right':'kb-right' };
  currentKeys.forEach(b => {
    if (b.kbId) {
      const el = document.getElementById(b.kbId);
      if (el) {
        el.textContent = b.display || b.key;
        el.innerHTML = (b.display || b.key) + `<span class="key-label">${b.label}</span>`;
      }
    }
  });
}

// 키 목록 렌더링
function renderKeyList() {
  initKbVisual();
  const container = document.getElementById('key-list');
  const cats = [...new Set(currentKeys.map(k => k.cat))];
  container.innerHTML = '';

  const conflicts = getConflicts();

  cats.forEach(cat => {
    const header = document.createElement('div');
    header.className = 'key-section-header';
    header.textContent = '— ' + cat + ' —';
    container.appendChild(header);

    currentKeys.filter(k => k.cat === cat).forEach(binding => {
      const row = document.createElement('div');
      row.className = 'key-row';
      row.id = 'row-' + binding.id;

      const isConflict = conflicts.includes(binding.id);
      const badge = `<div class="key-badge${isConflict?' conflict':''}" id="badge-${binding.id}"
        onclick="startListening('${binding.id}')">${binding.display || binding.key}</div>`;

      row.innerHTML = `
        <span class="key-action">${binding.label}</span>
        <span class="key-category">${cat}</span>
        ${badge}`;
      container.appendChild(row);
    });
  });

  // 현재 listening 상태 복원
  if (listeningId) setListeningStyle(listeningId, true);
}

function getConflicts() {
  const seen = {}, conflicts = [];
  currentKeys.forEach(k => {
    if (seen[k.key]) conflicts.push(k.id, seen[k.key]);
    else seen[k.key] = k.id;
  });
  return conflicts;
}

// 키 입력 대기 시작
function startListening(id) {
  if (listeningId) setListeningStyle(listeningId, false);
  listeningId = id;
  setListeningStyle(id, true);
  document.getElementById('key-hint').textContent = '🎯 새로운 키를 누르세요... (ESC = 취소)';
  highlightKbKey(id, true);
}

function setListeningStyle(id, on) {
  const badge = document.getElementById('badge-' + id);
  const row   = document.getElementById('row-' + id);
  if (badge) { if(on) badge.classList.add('editing'); else badge.classList.remove('editing'); badge.textContent = on ? '...' : (currentKeys.find(k=>k.id===id)?.display || currentKeys.find(k=>k.id===id)?.key || '?'); }
  if (row)   { if(on) row.classList.add('listening'); else row.classList.remove('listening'); }
}

function highlightKbKey(id, on) {
  const binding = currentKeys.find(k => k.id === id);
  if (binding && binding.kbId) {
    const el = document.getElementById(binding.kbId);
    if (el) { if(on) el.classList.add('highlight'); else el.classList.remove('highlight'); }
  }
}

// 글로벌 keydown 리스너
document.addEventListener('keydown', function(e) {
  if (!listeningId) return;
  e.preventDefault();
  e.stopPropagation();

  const cancelKeys = ['Escape'];
  const prevId = listeningId;

  if (cancelKeys.includes(e.key) && currentKeys.find(k=>k.id===listeningId)?.key !== 'Escape') {
    // ESC = 취소 (단, ESC 자체를 바인딩 중이면 허용)
    document.getElementById('key-hint').textContent = '❌ 변경 취소됨';
    highlightKbKey(prevId, false);
    setListeningStyle(prevId, false);
    listeningId = null;
    setTimeout(() => { if(document.getElementById('key-hint')) document.getElementById('key-hint').textContent=''; }, 1500);
    return;
  }

  const displayMap = {
    ' ': 'SPACE', 'ArrowUp':'↑', 'ArrowDown':'↓', 'ArrowLeft':'←', 'ArrowRight':'→',
    'Control':'CTRL', 'Shift':'SHIFT', 'Alt':'ALT', 'Tab':'TAB', 'Enter':'ENTER',
    'Backspace':'BACK', 'Delete':'DEL'
  };
  const rawKey    = e.key === ' ' ? 'Space' : e.key;
  if (!e.key) return;   // (v222) key 없는 합성 이벤트 방어
  const displayKey = displayMap[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key.toUpperCase());

  const binding = currentKeys.find(k => k.id === prevId);
  if (binding) {
    binding.key = rawKey;
    binding.display = displayKey;
    if (binding.kbId) {
      const el = document.getElementById(binding.kbId);
      if (el) el.innerHTML = displayKey + `<span class="key-label">${binding.label}</span>`;
    }
  }

  const conflicts = getConflicts();
  const msg = conflicts.includes(prevId)
    ? `⚠️ [${displayKey}] 키 충돌! 다른 동작과 겹칩니다.`
    : `✅ [${displayKey}] 로 변경되었습니다.`;
  document.getElementById('key-hint').textContent = msg;

  highlightKbKey(prevId, false);
  setListeningStyle(prevId, false);
  listeningId = null;
  renderKeyList();
  setTimeout(() => { if(document.getElementById('key-hint')) document.getElementById('key-hint').textContent=''; }, 2000);
});

// 기본값 복원
function resetKeys() {
  currentKeys = DEFAULT_KEYS.map(k => ({ ...k }));
  listeningId = null;
  document.getElementById('key-hint').textContent = '🔄 기본 키 배치로 복원되었습니다.';
  renderKeyList();
  setTimeout(() => { if(document.getElementById('key-hint')) document.getElementById('key-hint').textContent=''; }, 2000);
}

// ── 옵션 저장 ──
function updateVal(input, id) {
  document.getElementById(id).textContent = input.value + '%';
}
function saveOptions() {
  closeModal('options');
  listeningId = null;
}

// ── 게임 종료 ──
function quitGame() {
  closeModal('quit');
  document.body.style.transition = 'opacity 1s';
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center;
                  height:100vh; font-family:'Noto Serif KR',serif;
                  color:#c8902a; font-size:22px; letter-spacing:4px;
                  text-shadow: 0 0 20px #c8902a;">
        또 만나요, 지킴이! 🛡️
      </div>`;
    document.body.style.opacity = '1';
  }, 1000);
}
