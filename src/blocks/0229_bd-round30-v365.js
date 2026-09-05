
/* (v365) 안전 수칙 카드 + 지역 경계 칩 — 상세는 패치 주석 */
(function(){
  'use strict';

  /* ── A2 정화 직후 안전 수칙 ── */
  var SAFE = {
    trash:      '쓰레기는 함부로 만지지 말고, 분리해서 버리거나 담당자(어른)에게 알려요.',
    cigarette:  '담배 연기는 피해서 지나가고, 흡연 구역이 아닌 곳은 어른에게 알려요.',
    kickboard:  '길을 막은 킥보드는 직접 옮기다 다칠 수 있어요 — 관리 번호로 신고해요.',
    bicycle:    '쓰러진 자전거는 어른과 함께 세우고, 통행로는 항상 비워 두어요.',
    glass:      '깨진 유리는 절대 손대지 않고, 주변 친구들에게 알린 뒤 어른에게 말해요.',
    bottle:     '방치된 병은 만지지 말고 피해서 다녀요. 위치를 어른에게 알리면 최고!',
    graffiti:   '낙서를 발견하면 지우려 하지 말고, 학교나 주민센터에 알려요.',
    noise_bat:  '큰 소음이 계속되면 참지 말고 어른이나 관리실에 도움을 요청해요.',
    dark_alley: '어두운 길은 혼자 다니지 말고, 밝은 큰길로 돌아가는 게 안전해요.',
    streetlight:'고장 난 가로등은 번호를 확인해 어른과 함께 신고할 수 있어요.',
    road_crack: '갈라진 길은 뛰지 말고 천천히 피해서 걸어요. 위험 표시가 있으면 지켜요.',
    sign_ghost: '떨어질 것 같은 표지판 아래로는 지나가지 말고 멀리 돌아가요.',
    _default:   '위험을 발견하면 만지지 말고, 먼저 어른에게 알리는 것이 지킴이의 첫걸음!'
  };
  setInterval(function(){
    try{
      var m = document.getElementById('bd-result-modal');
      if (!m || !m.classList.contains('show')){ if (m) m.__bd365 = false; return; }
      if (m.__bd365) return;
      m.__bd365 = true;
      var v = (window.__bdLastHz && __bdLastHz.hazardVariant) || null;
      var tip = SAFE[v] || SAFE._default;
      var btn = m.querySelector('button');
      var html = '<div class="bd-safetip">🛡 <b>오늘의 안전 수칙</b><br>' + tip + '</div>';
      if (btn) btn.insertAdjacentHTML('beforebegin', html);
      else (m.firstElementChild || m).insertAdjacentHTML('beforeend', html);
    }catch(e){}
  }, 500);

  /* ── A5 지역 경계 칩 ── */
  var NAMES = { 210:'수영리', 211:'동화리', 212:'와우리', 213:'상리' };
  function chip(id){
    var d = document.getElementById(id);
    if (!d){
      d = document.createElement('div');
      d.id = id; d.className = 'bd-gatechip';
      document.body.appendChild(d);
    }
    return d;
  }
  setInterval(function(){
    try{
      var show = { left:null, right:null, top:null, bottom:null };
      var ok = !(window.HSR && HSR.active) && !document.querySelector('.bd-modal.show');
      if (ok && typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined'){
        var st = STAGES[Number(currentStage)];
        var gates = (st && st.districtGates) || [];
        gates.forEach(function(g){ /* bd365chipfix */
          if (!g || !g.side) return;
          var nm = g.label || NAMES[g.nextStage] || NAMES[g.next];
          if (!nm) return;
          var band = true;
          if (typeof g.at === 'number'){
            var pos = (g.side === 'left' || g.side === 'right') ? heroY : heroX;
            band = Math.abs(pos - g.at) <= 0.14;
          }
          if (!band) return;
          if (g.side === 'right' && heroX > 0.8) show.right = nm;
          if (g.side === 'left' && heroX < 0.2) show.left = nm;
          if (g.side === 'top' && heroY < 0.16) show.top = nm;
          if (g.side === 'bottom' && heroY > 0.84) show.bottom = nm;
        });
      }
      var arrows = { left:'◀ ', right:'', top:'▲ ', bottom:'▼ ' };
      ['left','right','top','bottom'].forEach(function(s){
        var d = chip('bd-gate-' + s);
        if (show[s]){
          d.textContent = (s === 'right') ? (show[s] + ' ▶') : (arrows[s] + show[s]);
          d.style.display = 'flex';
        } else d.style.display = 'none';
      });
    }catch(e){}
  }, 400);
})();
