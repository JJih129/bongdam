/* (v388) 튜토리얼 단계 게이트 — «안내가 나오기 전에 그 행동을 먼저 해버려서» 단계가 꼬이는 것을 막는다.
   배경 ①: 담이가 «저기 쓰레기가 방치돼 있어요» 라고 말하기도 전에 쓰레기를 조사해 전투에 들어가면
        이동·임무 안내 스텝이 통째로 skipIf 로 건너뛰어지고, 남은 안내가 엉뚱한 시점에 재생됐다.
        v315 가 «move/guide 스텝 중에는 조사 잠금»으로 임시 대응했지만, 스텝 id 두 개를 하드코딩한
        방식이라 그 앞뒤 구간(바깥 오프닝 재생 중·지도 튜토리얼 진행 중)에는 여전히 뚫려 있었다.
   배경 ②: 가게 튜토리얼(0110) 진행 중에 옆 주민과 대화하거나 위험요소를 조사해 버리면
        «가게 앞으로 가서 F» 실습이 겉돌았다 — 가게 튜토 중에는 가게만 상호작용되게 한다.
   방식: «어떤 행동(action)이 어떤 규칙(rule)들을 모두 통과해야 허용되는가»를 표로 선언하고 한 곳에서 판정한다.
        닫혀 있으면 해당 조작을 소비하고 이유를 토스트로 알려 준다.
   안전장치: 잠금이 영영 안 풀리면 진행이 막히므로(데드락) 규칙마다 스스로 열리는 시간 상한을 둔다. */
(function () {
  'use strict';

  var STALE_MS = 45000;       /* 튜토리얼이 끝내 시작되지 않을 때 스스로 열리기까지 */
  var FOCUS_MAX_MS = 120000;  /* 가게 튜토 «집중 모드» 최대 지속 — 플레이어가 계속 무시해도 풀린다 */

  /* ── 튜토리얼 상태 추적 ── */
  var idleSince = 0;    /* 튜토가 돌지도 끝나지도 않은 «빈 구간»의 시작 */
  var shopSince = 0;    /* 가게 튜토리얼이 시작된 시각 */

  function tutorIdleMs() { return idleSince ? Date.now() - idleSince : 0; }
  function runningTag() {
    try {
      var T = window.BD_TUTOR;
      if (!T || !T.isRunning || !T.isRunning()) return null;
      return (T.runningTag && T.runningTag()) || null;
    } catch (e) { return null; }
  }

  setInterval(function () {
    try {
      var T = window.BD_TUTOR;
      if (!T) return;
      var tag = runningTag();
      if (tag === 'shop_tuto') { if (!shopSince) shopSince = Date.now(); }
      else shopSince = 0;

      /* 프롤로그(문화의집 3층) 중에는 메인 튜토리얼이 «아직 시작할 차례»가 아니다.
         여기서 유예 시간을 세면 대사·수여식·가방 안내만으로 45초를 넘겨,
         밖으로 나오기도 전에 안전장치가 게이트를 열어 버린다(실측 56초). */
      var prologueDone = false;
      try { prologueDone = localStorage.getItem('bd_tut2_done') === '1'; } catch (e2) { }
      if (!prologueDone) { idleSince = 0; return; }

      var busy = (T.isRunning && T.isRunning()) || (T.done && T.done());
      if (busy) { idleSince = 0; return; }
      if (!idleSince) idleSince = Date.now();
    } catch (e) { }
  }, 500);

  function staleUnlock(key) {
    if (tutorIdleMs() <= STALE_MS) return false;
    if (!staleUnlock['__w_' + key]) {
      staleUnlock['__w_' + key] = true;
      try { console.info('[v388] 튜토리얼이 시작되지 않아 단계 게이트를 해제합니다: ' + key); } catch (e) { }
    }
    return true;
  }

  /* ── 규칙표 ── open(): 지금 허용되는가 · hint: 막혔을 때 안내 ── */
  var RULES = {
    /* 첫 위험요소 조사 — 담이의 «저기 쓰레기가 방치돼 있어요»(hazard 스텝)부터 열린다.
       그 전 구간(바깥 오프닝·지도 튜토리얼)에서는 조사 자체가 성립하지 않는다. */
    first_hazard: {
      open: function () {
        var T = window.BD_TUTOR;
        if (!T) return true;                                  /* 튜토 엔진이 없으면 간섭하지 않는다 */
        if (T.done && T.done()) return true;                  /* 완료·건너뛰기 → 자유 */
        if (T.isRunning && T.isRunning()) {
          /* 메인 튜토리얼이면 hazard 스텝 도달 후 개방.
             지도 튜토리얼처럼 hazard 스텝이 없는 실행 중에는 계속 잠금. */
          return !!(T.reached && T.reached('hazard'));
        }
        return staleUnlock('first_hazard');                   /* 아직 아무 튜토도 시작 전 */
      },
      hint: '💠 담이의 이야기를 먼저 들어봐요!'
    },

    /* 가게 튜토리얼 집중 — 진행 중에는 가게(시설 모달·상점)만 상호작용된다.
       가게는 facility/landmark 경로라 이 규칙에 걸리지 않으므로 그대로 이용할 수 있다. */
    shop_focus: {
      open: function () {
        if (runningTag() !== 'shop_tuto') return true;
        if (shopSince && Date.now() - shopSince > FOCUS_MAX_MS) return true;   /* 상한 초과 — 스스로 해제 */
        return false;
      },
      hint: '🏪 지금은 가게 이용법을 배우는 중이에요 — 화살표를 따라가 봐요!'
    }
  };

  /* ── 행동 → 통과해야 하는 규칙들 ── */
  var ACTIONS = {
    hazard: ['first_hazard', 'shop_focus'],   /* 위험요소 조사 */
    npc: ['shop_focus']                       /* 주민 대화 */
  };

  function allowRule(key) {
    try { var r = RULES[key]; return r ? !!r.open() : true; }
    catch (e) { return true; }
  }
  /** 막고 있는 첫 규칙 (없으면 null) */
  function blockedBy(action) {
    var keys = ACTIONS[action] || [];
    for (var i = 0; i < keys.length; i++) if (!allowRule(keys[i])) return keys[i];
    return null;
  }

  var lastHintAt = {};
  function nudgeRule(key) {
    try {
      var r = RULES[key]; if (!r || !r.hint) return;
      if (Date.now() - (lastHintAt[key] || 0) < 4000) return;   /* 토스트 스팸 방지 */
      lastHintAt[key] = Date.now();
      if (typeof bdToast === 'function') bdToast(r.hint);
    } catch (e) { }
  }

  window.BD_TUTGATE = {
    /** 규칙 단위 판정 (모르는 key 는 항상 허용) */
    allow: allowRule,
    /** 행동 단위 판정 — 걸린 규칙이 하나라도 있으면 false */
    allowAction: function (action) { return !blockedBy(action); },
    /** 막힌 이유를 토스트로 알린다 */
    nudge: nudgeRule,
    nudgeAction: function (action) { var k = blockedBy(action); if (k) nudgeRule(k); },
    /** 규칙 추가·교체 — 새 단계를 잠그고 싶을 때 */
    define: function (key, rule, actions) {
      if (!key || !rule || typeof rule.open !== 'function') return;
      RULES[key] = rule;
      (actions || []).forEach(function (a) {
        ACTIONS[a] = ACTIONS[a] || [];
        if (ACTIONS[a].indexOf(key) < 0) ACTIONS[a].push(key);
      });
    },
    /** 진단용 현재 상태 */
    state: function () {
      var out = { rules: {}, actions: {} };
      Object.keys(RULES).forEach(function (k) { out.rules[k] = allowRule(k); });
      Object.keys(ACTIONS).forEach(function (a) { out.actions[a] = !blockedBy(a); });
      out.__idleMs = tutorIdleMs();
      out.__shopMs = shopSince ? Date.now() - shopSince : 0;
      try {
        out.__step = window.__bdTutStepId || '';
        out.__tag = runningTag();
      } catch (e) { }
      return out;
    }
  };

  /* ── 적용 ①: 위험요소 조사 ──
     BD_hazardInteract 는 F 키·화면 탭·길안내 자동조사가 모두 지나는 단일 통로다.
     보스는 자체 개방 조건(BD_hazardLocked)이 따로 있으므로 건드리지 않는다. */
  function wrapHazard() {
    var f = window.BD_hazardInteract;
    if (typeof f !== 'function' || f.__tutgate388) return false;
    window.BD_hazardInteract = function (obj) {
      try {
        /* 전투 중 호출은 이중 진입 차단(v375) 등 기존 레이어의 소관 — 게이트가 끼어들지 않는다 */
        if (window.HSR && HSR.active) return f.apply(this, arguments);
        if (obj && !obj.isBoss && !window.BD_TUTGATE.allowAction('hazard')) {
          window.BD_TUTGATE.nudgeAction('hazard');
          return true;                                        /* 입력을 소비 — 조사창을 열지 않는다 */
        }
      } catch (e) { }
      return f.apply(this, arguments);
    };
    window.BD_hazardInteract.__tutgate388 = true;
    return true;
  }

  /* ── 적용 ②: 주민 대화 ──
     0055 의 F 핸들러는 `const r = nearResident(); if(!r) return;` 로 시작한다.
     BD_nearResident 가 null 을 주면 대화가 열리지 않고, 0250 의 «💬 대화» 프롬프트와
     모바일 F 버튼도 같은 함수를 보므로 표시까지 한 번에 정리된다. */
  function wrapResident() {
    var f = window.BD_nearResident;
    if (typeof f !== 'function' || f.__tutgate388) return false;
    var raw = f;
    window.BD_nearResident = function () {
      try { if (!window.BD_TUTGATE.allowAction('npc')) return null; } catch (e) { }
      return raw.apply(this, arguments);
    };
    window.BD_nearResident.__tutgate388 = true;
    window.BD_nearResident.__raw = raw;                        /* 안내 토스트 판정용 원본 */
    return true;
  }

  /* 잠긴 동안 F 를 누르면 «왜 안 되는지»는 알려 준다 (대화 자체는 위에서 이미 차단됨) */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'f' && e.key !== 'F') return;
    try {
      if (window.HSR && HSR.active) return;
      if (window.BD_TUTGATE.allowAction('npc')) return;
      var raw = window.BD_nearResident && window.BD_nearResident.__raw;
      if (raw && raw()) window.BD_TUTGATE.nudgeAction('npc');
    } catch (err) { }
  }, true);

  /* 두 대상은 정의 시점이 다르다 — 각각 독립적으로 감싸고, 둘 다 걸린 뒤에 폴링을 멈춘다
     (&& 로 묶으면 먼저 성공한 쪽 때문에 나머지가 영영 설치되지 않는다) */
  function installed() {
    return !!(window.BD_hazardInteract && window.BD_hazardInteract.__tutgate388)
        && !!(window.BD_nearResident && window.BD_nearResident.__tutgate388);
  }
  function install() { wrapHazard(); wrapResident(); return installed(); }
  install();
  var iv = setInterval(function () { if (install()) clearInterval(iv); }, 300);
})();
