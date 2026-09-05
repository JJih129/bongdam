
(function () {
  // ── 터치 기기 감지 (PC는 그대로 두고 표시 안 함) ──
  var IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (!IS_TOUCH) return;

  var tc      = document.getElementById('touch-controls');
  var joyWrap = document.getElementById('tc-joystick');
  var base    = document.getElementById('tc-joy-base');
  var knob    = document.getElementById('tc-joy-knob');
  var btnQ    = document.getElementById('tc-btn-q');
  var btnAtk  = document.getElementById('tc-btn-atk');
  var btnElem = document.getElementById('tc-btn-elem');
  var btnE    = document.getElementById('tc-btn-e');
  var btnF    = document.getElementById('tc-btn-f');
  if (!tc) return;

  tc.style.display = 'block';

  // ── 게임 화면·오버레이 상태 감지 ──
  function overlayOpen() {
    return (typeof shopOpen !== 'undefined' && shopOpen) ||
           (typeof invOpen !== 'undefined' && invOpen) ||
           (typeof questPanelOpen !== 'undefined' && questPanelOpen) ||
           (typeof window.BD_isInputBlocked === 'function' && window.BD_isInputBlocked()); // (v139) 컷신·대화창·전투 중엔 조이스틱도 숨김
  }
  function inGame() {
    var gs = document.getElementById('game-screen');
    return gs && gs.style.display === 'block';
  }
  function refreshVisibility() {
    var show = inGame() && !overlayOpen() && !window.__bdGuideOpen;
    tc.style.display = show ? 'block' : 'none';
    if (!show) resetJoystick();
  }
  // (v233) 상태는 계속 변하므로 주기 재평가 (기존엔 초기 1회뿐이라 영영 숨김이었다)
  if (window.BD_addTick) window.BD_addTick(refreshVisibility, 300);
  else setInterval(refreshVisibility, 300);
  setInterval(refreshVisibility, 150);

  // ─────────────────────────────────────────────
  //  조이스틱 — moveKeys(w/a/s/d) 제어
  // ─────────────────────────────────────────────
  var joyTouchId = null;
  var RADIUS = 52;
  var DEAD   = 0.30;
  var DIAG   = 0.38;

  function setMove(w, a, s, d) {
    if (typeof moveKeys === 'undefined') return;
    moveKeys.w = w; moveKeys.a = a; moveKeys.s = s; moveKeys.d = d;
  }

  function resetJoystick() {
    joyTouchId = null;
    if (knob) knob.style.transform = 'translate(0px, 0px)';
    if (joyWrap) joyWrap.classList.remove('active');
    setMove(false, false, false, false);
  }

  function baseCenter() {
    var r = base.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function handleJoyMove(clientX, clientY) {
    var c = baseCenter();
    var dx = clientX - c.x;
    var dy = clientY - c.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var clamped = Math.min(dist, RADIUS);
    var ang = Math.atan2(dy, dx);
    knob.style.transform = 'translate(' + Math.cos(ang) * clamped + 'px,' + Math.sin(ang) * clamped + 'px)';
    var nx = dist > 0 ? dx / dist : 0;
    var ny = dist > 0 ? dy / dist : 0;
    if (clamped / RADIUS < DEAD) { setMove(false, false, false, false); return; }
    setMove(ny < -DIAG, nx < -DIAG, ny > DIAG, nx > DIAG);
  }

  joyWrap.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (joyTouchId !== null) return;
    var t = e.changedTouches[0];
    joyTouchId = t.identifier;
    joyWrap.classList.add('active');
    handleJoyMove(t.clientX, t.clientY);
  }, { passive: false });

  joyWrap.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === joyTouchId) { handleJoyMove(t.clientX, t.clientY); break; }
    }
  }, { passive: false });

  function endJoy(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) { resetJoystick(); break; }
    }
  }
  joyWrap.addEventListener('touchend', endJoy, { passive: false });
  joyWrap.addEventListener('touchcancel', endJoy, { passive: false });

  // ─────────────────────────────────────────────
  //  액션 버튼 — Q / Z / E / F
  // ─────────────────────────────────────────────
  function bindTap(btn, fn) {
    if (!btn) return;
    btn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      try { fn(); } catch (err) {}
    }, { passive: false });
    btn.addEventListener('click', function (e) { e.preventDefault(); });
  }

  // (v233) 구세대 버튼(대시/공격/속성) 제거 — 키 이벤트 디스패치로 현행 로직과 통일
  function dispatchKey(key){
    try{
      document.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
    }catch(e){}
  }
  bindTap(btnE, function () { dispatchKey('e'); });

  // F: NPC 대화 / 상점 / 퀘스트 (게임 키 F와 동일한 우선순위)
  bindTap(btnF, function () {
    // (v233) 대화 중이면 다음 대사(Space), 아니면 조사(F) — 실제 키 경로를 그대로 탄다
    var vn = document.getElementById('dialogue-box');
    var talking = (typeof dialogueOpen !== 'undefined' && dialogueOpen)
      || (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05);
    dispatchKey(talking ? ' ' : 'f');
  });

  // ─────────────────────────────────────────────
  //  상태 폴링 — 쿨타임 / 활성화 / F근접 여부
  // ─────────────────────────────────────────────
  var qCd = btnQ ? btnQ.querySelector('.tc-cd-overlay') : null;

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  setInterval(function () {
    // Q: 대시 쿨타임
    try {
      var maxCd = (typeof getDashCooldown === 'function') ? getDashCooldown() : 0;
      var cur   = (typeof dashCooldownTimer !== 'undefined') ? dashCooldownTimer : 0;
      if (qCd) qCd.style.height = (maxCd > 0 ? clamp01(cur / maxCd) * 100 : 0) + '%';
      btnQ.classList.toggle('tc-disabled', (typeof isDashing !== 'undefined' && isDashing) || cur > 0);
    } catch (e) {}

    // 공격 버튼: 서문(stage 4)에서만 활성, 쿨다운 표시
    try {
      var inStage4 = (typeof currentStage !== 'undefined')
                  && (typeof SCARECROW_SPAWN_STAGE !== 'undefined')
                  && currentStage === SCARECROW_SPAWN_STAGE;   // (v236) 허수아비 제거 반영
      var scAlive = (typeof _scarecrow !== 'undefined') && _scarecrow.alive;
      var atkAvail = inStage4 && scAlive;
      if (btnAtk) btnAtk.classList.toggle('tc-disabled', !atkAvail);
      if (btnAtk) btnAtk.classList.toggle('tc-active-glow', atkAvail);
    } catch (e) {}

    // 속성 버튼: '마법사' 스탯 해금된 마법사일 때만 표시 + 현재 속성 아이콘 갱신
    try {
      if (btnElem) {
        var elemOn = (typeof mageElementUnlocked === 'function') && mageElementUnlocked();
        btnElem.style.display = elemOn ? 'flex' : 'none';
        if (elemOn && typeof currentMageElement === 'function' &&
            typeof MAGE_ELEMENT_INFO !== 'undefined') {
          var info = MAGE_ELEMENT_INFO[currentMageElement()];
          var ic = btnElem.querySelector('.tc-btn-icon');
          if (info && ic) ic.textContent = info.icon;
        }
      }
    } catch (e) {}

    // E: 인벤토리 열려 있으면 강조
    try {
      var iOpen = (typeof invOpen !== 'undefined') && invOpen;
      btnE.classList.toggle('tc-active-glow', iOpen);
    } catch (e) {}

    // F: 근처에 상점/퀘스트/NPC가 있을 때만 활성
    try {
      var nearShop  = (typeof isNearStore24 === 'function') && isNearStore24();
      var nearQuest = (typeof getNearQuest === 'function') && !!getNearQuest();
      var nearNpc   = (typeof getNearNPC === 'function') && !!getNearNPC();
      var nearQNpc  = (typeof getNearQuestNpc === 'function') && !!getNearQuestNpc();
      var fAvail = nearShop || nearQuest || nearNpc || nearQNpc;
      // 아이콘 동적 변경
      var icon = btnF.querySelector('.tc-btn-icon');
      if (icon) icon.textContent = (nearNpc || nearQNpc) ? '💬' : (nearQuest ? '📋' : '🏪');
      btnF.classList.toggle('tc-disabled', !fAvail);
    } catch (e) {}
  }, 120);
})();
