/* (v399e) 갤러리 검수 반영 2차 — 키 안내 바 접기 · 모달 열림 중 담이 흐림 · 창 5종 공통 줄바꿈/대비 · 전투 카드 텍스트 ·
 *  안전도 탭 크림 톤 · 지도 헤더 · 모바일(≤600px) HUD 배치·지도 머리 줄바꿈 · 가방 업적/안전도 탭 우측 안내 정리
 *  기존 함수 재정의 없음(래퍼·CSS·인터벌). */
(function(){
  'use strict';
  var css = ''
    /* 창 공통 — 한글 단어 중간 줄바꿈 금지 */
    + '#inv-overlay,#quest-overlay,#bd-codex,#bd-report,#bd-equip-modal .bd-modal-box,#bd-achieve-modal .bd-modal-box,#bd-settings-modal .bd-modal-box,#bd-district-facility-modal,#bd-place-card{word-break:keep-all;overflow-wrap:anywhere}'
    + '#bd-codex .bd-cdx-head span:nth-child(2){white-space:nowrap}#bd-codex .bd-cdx-fam{white-space:nowrap}'
    + '#bd-menu-btns button{white-space:nowrap}html.bd-inv-special #inv-detail{display:none!important}'
    /* 업적 대비 */
    + '#bd-achieve-modal .bd-modal-box{color:#e7ecf5}#bd-achieve-modal .bd-modal-box small,#bd-achieve-modal .bd-modal-box .ach-sub{color:#c3cede}'
    /* 안전도 탭 — 크림 톤(모달 전체와 통일) */
    + '#inv-safety-panel #safety-header{background:#fff8ea;border-color:#e3d2b0}#inv-safety-panel #safety-level-text{color:#5b4127}#inv-safety-panel #safety-point-text{color:#7a5c38}'
    + '#inv-safety-panel .safety-skill{background:#fffdf7;border-color:#e6dcc7}#inv-safety-panel .safety-skill.unlocked{background:#f7f0dc;border-color:#d9c48f}#inv-safety-panel .safety-skill.max-level{background:#fdf3d2}'
    + '#inv-safety-panel .safety-skill-name{color:#8a7a5e}#inv-safety-panel .safety-skill.unlocked .safety-skill-name,#inv-safety-panel .safety-skill.max-level .safety-skill-name{color:#3a2c18}'
    + '#inv-safety-panel .safety-skill-desc{color:#6b5233}#inv-safety-panel .safety-skill-stat{color:#7a5c38}#inv-safety-panel .safety-skill-level{color:#5b4127}#inv-safety-panel .safety-group-title{color:#7a5c38}'
    /* 전투 — 카드 텍스트·튜토 겹침 */
    /* 정화 스티커 카드에 ✨ 아이콘 — 배지 스킬 카드와 같은 메달 아트라 구분이 안 됐다 */
    + '.hsr-act.hsr-basic{position:relative}.hsr-act.hsr-basic .hsr-ai{display:block!important;position:absolute;top:24px;left:50%;transform:translateX(-50%);font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}'
    /* 리포트 통계 타일 6개 — 4열이면 2행이 절반 비어 보인다 → 3열 */
    + '#bd-report .grid{grid-template-columns:repeat(3,1fr)!important}'
    + '.hsr-act{word-break:keep-all}body:has(#hsr-skill-menu) #bd-spot,body:has(#hsr-skill-menu) #bd-guide-tip,body:has(#hsr-skill-menu) #bd-spot-block{display:none!important}'
    /* 모달 열림 중 담이 말풍선 흐림 */
    + 'html.bd-modal-open #bd-dami-hud{opacity:.22;pointer-events:none;transition:opacity .2s}'
    /* 키 안내 바 접기 */
    + 'html.bd-keybar-mini #bd-keybar,html.bd-pc.bd-keybar-mini #bd-keybar.bd-pc-show{display:none!important}'
    + '#bd-keybar-chip{position:fixed;right:12px;bottom:10px;z-index:902;display:none;background:rgba(16,24,44,.9);color:#e7ecf5;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:4px 11px;font-size:12px;cursor:pointer;font-family:inherit}'
    + 'html.bd-pc.bd-keybar-mini #bd-keybar-chip{display:block}#bd-keybar-chip kbd{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:4px;padding:0 5px;margin-right:4px}'
    /* 모바일(≤600px) */
    + '@media (max-width:600px){html.bd-touch-mode #bd-menu-btns{top:60px;right:6px;gap:4px}html.bd-touch-mode #bd-menu-btns button{padding:5px 7px!important;font-size:11px!important}'
    + 'html.bd-touch-mode #bd-quest-hud{display:none!important}html.bd-touch-mode #bd-menu-btns{top:60px!important;right:6px!important}'
    + '#bd-map-v342 .m42-head{flex-wrap:wrap}#bd-map-v342 .m42-tip{flex:1 1 100%;order:3;white-space:normal;word-break:keep-all;font-size:12px}#bd-map-v342 .m42-title{font-size:16px}#bd-map-v342 .m42-panel{padding:10px 10px 8px}}';
  var st = document.createElement('style'); st.id = 'bd-ui-polish2-v399'; st.textContent = css; document.head.appendChild(st);

  var vis = function(e){ if (!e) return false; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  /* 모달 열림 판정 → html.bd-modal-open */
  setInterval(function(){
    try{
      var open = false;
      ['inv-overlay','quest-overlay','bd-codex-ov','bd-report','bd-map-v342','bd-district-facility-modal','bd-bus-modal','shop-overlay','bd-settings-modal','bd-equip-modal','bd-achieve-modal'].forEach(function(id){ var e = document.getElementById(id); if (e && vis(e)) open = true; });
      if (!open){ var m = document.querySelector('.bd-modal.show'); if (m && vis(m)) open = true; }
      document.documentElement.classList.toggle('bd-modal-open', open);
    }catch(e){}
  }, 250);

  /* 키 안내 바 — 75초 또는 조작 6회 뒤 접기, 칩·? 키로 토글 */
  var KEY = 'bd_keybar_mini_v399', acts = 0, t0 = Date.now(), manual = false;
  function mini(on){ document.documentElement.classList.toggle('bd-keybar-mini', !!on); try{ localStorage.setItem(KEY, on ? '1' : '0'); }catch(e){} }
  function chip(){
    var c = document.getElementById('bd-keybar-chip');
    if (!c){ c = document.createElement('button'); c.id = 'bd-keybar-chip'; c.type = 'button'; c.innerHTML = '<kbd>?</kbd>조작키'; c.title = '키 안내 펼치기 (?)'; c.onclick = function(){ manual = true; mini(false); }; document.body.appendChild(c); }
    return c;
  }
  try{ if (localStorage.getItem(KEY) === '1') mini(true); }catch(e){}
  window.addEventListener('keydown', function(e){
    try{
      if (e.key === '?' && !(window.HSR && HSR.active)){ var on = !document.documentElement.classList.contains('bd-keybar-mini'); manual = !on; mini(on); return; }
      if (/^(f|e|j|m|F|E|J|M)$/.test(e.key)) acts++;
    }catch(err){}
  }, true);
  setInterval(function(){
    try{
      chip();
      if (document.documentElement.classList.contains('bd-keybar-mini') || manual) return;
      if (!(window.BD && BD.questIdx > 0) && Date.now() - t0 < 75000 && acts < 6) return;   /* 프롤로그·초반은 펼쳐 둠 */
      if (Date.now() - t0 >= 75000 || acts >= 6) mini(true);
    }catch(e){}
  }, 1000);

  /* 가방 — 업적·안전도 탭에서는 우측 아이템 안내를 숨긴다(0241 재렌더가 다시 보이던 문제) */
  setInterval(function(){
    try{
      var ov = document.getElementById('inv-overlay'); if (!ov || !vis(ov)){ document.documentElement.classList.remove('bd-inv-special'); return; }
      var tab = (typeof currentInvTab !== 'undefined') ? currentInvTab : (window.currentInvTab || 'all');
      var d = document.getElementById('inv-detail'); if (!d) return;
      var special = (tab === 'achieve' || tab === 'safety' || tab === 'skill');
      document.documentElement.classList.toggle('bd-inv-special', !!special);
    }catch(e){}
  }, 300);
})();
