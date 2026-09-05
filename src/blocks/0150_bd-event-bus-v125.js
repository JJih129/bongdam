
/* (v125) 이벤트 조정자 — 시스템 간 충돌 방지
   ────────────────────────────────────────────────────────────
   문제: 담이가 안내 중인데 전투가 시작되면 대사창이 사라지고
        UI 강조만 남는 등, 여러 시스템이 동시에 화면을 차지했다.

   설계(객체지향 관점):
     · 화면을 차지하는 활동을 «점유(claim)»라는 하나의 개념으로 통일
     · 각 시스템은 자기 점유를 등록하고, 우선순위에 따라 양보/대기
     · 우선순위가 높은 이벤트(전투 등)가 오면 낮은 것은 «보류»했다가
       끝난 뒤 이어서 재생 → 사라지지 않는다

   우선순위: battle(100) > scene(80) > dialogue(60) > tutorial(40) > hint(20)
   ──────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  var PRIORITY = { battle:100, scene:80, dialogue:60, tutorial:40, hint:20 };

  var Bus = {
    _current: null,        // { kind, priority, resume }
    _pending: [],          // 보류된 활동들

    /** 지금 화면을 차지한 활동 종류 */
    current: function(){ return this._current ? this._current.kind : null; },

    /** 새 활동이 화면을 차지하려 할 때 — 허용되면 true */
    claim: function(kind, opt){
      opt = opt || {};
      var pr = PRIORITY[kind] || 10;
      var cur = this._current;
      if (cur && (PRIORITY[cur.kind] || 10) > pr){
        // 더 중요한 것이 진행 중 → 이번 활동을 보류해 두었다가 나중에 실행
        if (opt.resume) this._pending.push({ kind:kind, priority:pr, resume:opt.resume });
        return false;
      }
      if (cur && cur.kind !== kind && cur.resume){
        // 낮은 우선순위가 진행 중이었다면 «중단이 아니라 보류» — 끝나면 이어서 재생
        this._pending.push(cur);
      }
      this._current = { kind:kind, priority:pr, resume: opt.resume || null };
      return true;
    },

    /** 활동이 끝났음 — 보류된 것 중 가장 중요한 것을 이어서 재생 */
    release: function(kind){
      if (this._current && this._current.kind !== kind) return;
      this._current = null;
      if (!this._pending.length) return;
      this._pending.sort(function(a,b){ return b.priority - a.priority; });
      var next = this._pending.shift();
      var self = this;
      setTimeout(function(){
        try{
          if (self._current) { self._pending.unshift(next); return; }  // 그 사이 다른 게 잡았으면 다시 대기
          self._current = next;
          if (next.resume) next.resume();
        }catch(e){}
      }, 500);
    },

    /** 지금 이 종류가 화면을 쓸 수 있는 상태인가 */
    canRun: function(kind){
      var cur = this._current;
      if (!cur) return true;
      return (PRIORITY[kind] || 10) >= (PRIORITY[cur.kind] || 10);
    },

    debug: function(){
      return { current: this.current(), pending: this._pending.map(function(p){ return p.kind; }) };
    }
  };
  window.BD_EVENTS = Bus;

  /* ── 실제 시스템과 연결 ── */

  /* 전투: 시작하면 점유, 끝나면 해제 */
  var wasBattle = false;
  setInterval(function(){
    try{
      var inb = !!(window.HSR && HSR.active);
      if (inb && !wasBattle){ Bus.claim('battle'); }
      if (!inb && wasBattle){ Bus.release('battle'); }
      wasBattle = inb;
    }catch(e){}
  }, 200);

  /* (v135) 담이 훅 제거 —
     전투 튜토리얼은 «전투 중에» 안내해야 하는 것이라, 전투를 이유로 보류하면
     대사가 영영 안 나온다(실제로 pending 에 계속 쌓였다).
     담이는 대사창을 독점하지 않으므로 조정 대상에서 뺀다. */
})();
