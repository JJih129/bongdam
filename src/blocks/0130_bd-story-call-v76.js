
/* (v76) 지역 클리어 연출 — "~리 주민들 문제는 다 해결했네" 마무리 → 친구에게서 전화
   · 우측 상단 문자 카드 대신 대화창으로 연출한다(전화 UI 폐기)
   · 전화를 건 친구는 그 지역에서 함께한 동료 → 다음 지역으로 자연스럽게 유도 */
(function(){
  'use strict';
  var SCENE = {
    ch1: { done:'와우리', caller:'세아', next:'상리',
           friend:'서연', trouble:'도서관 앞 골목에 술병이 나뒹굴어서 밤길이 무섭다고' },
    ch2: { done:'상리', caller:'재이', next:'동화리',
           friend:'재현', trouble:'벽에 지워지지 않는 낙서 때문에 혼자 애먹고 있다고' },
    ch3: { done:'동화리', caller:'재현', next:'수영리',
           friend:'은지 어머니', trouble:'어두운 골목 때문에 아이 하교가 걱정된다고' },
    ch4: { done:'수영리', caller:'재이', next:null }
  };
  // (v76a) 한글 조사 자동 선택 — "상리으로", "서연이(가)" 같은 어색함 제거
  function hasJong(w){
    var t = String(w||'').trim(); if (!t) return false;
    var c = t.charCodeAt(t.length-1);
    if (isNaN(c) || c < 0xAC00 || c > 0xD7A3) return false;
    return ((c - 0xAC00) % 28) !== 0;
  }
  function josa(w, withJong, withoutJong){ return w + (hasJong(w) ? withJong : withoutJong); }
  function ro(w){
    var t = String(w||'').trim();
    var c = t.charCodeAt(t.length-1);
    var j = (!isNaN(c) && c >= 0xAC00 && c <= 0xD7A3) ? (c - 0xAC00) % 28 : 0;
    return t + ((j === 0 || j === 8) ? '로' : '으로');
  }
  /* (v147) 지역 클리어 연출은 고정 시간(1.2초 → 6.2초 → 9.2초 → 13.5초)에 맞춰 대사를 띄웠다.
     플레이어가 앞 대사를 아직 읽고 있으면 다음 대사가 그대로 «덮어써져»
     이야기가 뚝 끊기거나 «대화 중에 다른 대사가 튀어나오는» 것처럼 보였다.
     → 순서대로 쌓아 두고, 대화창이 비었을 때 한 줄씩 내보낸다. */
  var _sayQ = [], _sayBusy = false;
  function _dlgUp(){
    try{
      if (window.__bdSceneActive) return true;
      if (window.HSR && HSR.active) return true;
      var b = document.getElementById('dialogue-box');
      if (b){
        var cs = getComputedStyle(b), r = b.getBoundingClientRect();
        if (cs.display !== 'none' && +cs.opacity > 0.05 && r.height > 2) return true;
      }
      var d = document.getElementById('bd-dialog');
      if (d && d.classList.contains('show')) return true;
    }catch(e){}
    return false;
  }
  function _pump(){
    try{
      if (_sayBusy || !_sayQ.length || _dlgUp()) return;
      /* (v321) 전투 중에는 전화·마무리 독백을 보류 — 전투 위로 열려 진행을 막던 문제 (350ms 재시도로 종전 직후 재생) */
      if (window.HSR && HSR.active) return;
      _sayBusy = true;
      var job = _sayQ.shift();
      if (typeof showDialog === 'function') showDialog(job.n, job.l);
      setTimeout(function(){ _sayBusy = false; }, 700);
    }catch(e){ _sayBusy = false; }
  }
  setInterval(_pump, 350);
  function say(name, lines){ _sayQ.push({ n:name, l:lines }); _pump(); }
  window.BD_regionClearScene = function(qid){
    var s = SCENE[qid]; if (!s) return;
    // ① 마무리 독백
    setTimeout(function(){
      say('나', [
        '(' + s.done + ' 주민들의 부탁은… 이걸로 다 해결한 것 같네.)',
        '(휴— 동네가 조금은 편안해진 기분이야.)'
      ]);
    }, 1200);
    if (!s.next){
      /* (v370) 최종장 연결은 «배지 반짝임» 한 갈래로 — 담이(ch4_done: «배지가 자꾸 반짝여요. 문화의집 쪽인가…»)와 같은 신호를 내가 받아 잇는다 */
      setTimeout(function(){
        say('나', [
          '(네 곳 모두 돌았어. …그런데 배지가 아까부터 계속 반짝인다.)',
          '(처음 받았던 곳, 문화의집 쪽이야. 선생님께 돌아가 봐야겠어.)'
        ]);
      }, 6000);
      return;
    }
    // (v116) 전화에서 지목한 친구를 화살표 목표로 기록한다.
    //  ("내 친구 서연이…"라고 해 놓고 화살표는 엉뚱한 주민을 가리키던 문제)
    try{ if (s.friend) window.__bdStoryTargetNpc = s.friend; }catch(eT){}

    // ② 친구 전화 (대화창 연출)
    setTimeout(function(){
      say('— ' + s.caller + '에게서 전화가 온다 —', ['📞 …따르릉.']);
    }, 6200);
    setTimeout(function(){
      say(s.caller, [
        '야, 뭐 해? 지금 혹시 도와줄 수 있어…?',
        '내 친구 ' + josa(s.friend, '이', '가') + ' ' + s.next + '에서 ' + s.trouble + ' 하더라고.',
        '너라면 어떻게든 해 줄 것 같아서. 부탁해도 될까?'
      ]);
    }, 9200);
    setTimeout(function(){
      say('나', ['(당연하지. ' + ro(s.next) + ' 가 보자.)']);
      try{ bdToast('🗺️ ' + s.next + ' 지역이 열렸어요!', 4200); }catch(e){}
    }, 13500);
  };

  /* 우측 상단 문자 카드 UI 폐기 — 스토리는 대화창으로 일원화 */
  try{
    if (window.BD_Message) window.BD_Message.show = function(){ /* (v76) 비활성 */ };
  }catch(e){}
  setInterval(function(){
    try{
      var m = document.getElementById('bd-msg');
      if (m && m.classList.contains('show')) m.classList.remove('show');
    }catch(e){}
  }, 600);
})();
