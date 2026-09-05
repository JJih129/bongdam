/* (v37→v370 전면 개편) 가게 이용 튜토리얼 — 전투·이동 튜토와 같은 «단계형 강조(BD_TUTOR)» 방식
   흐름: 첫 정화(메인 튜토) 완료 뒤 → ① 가까운 가게 건물 강조+화살표 → ② 시설 모달 «물건 구경하기» 버튼 강조
        → ③ 상점 «구매» 버튼 강조(간식 1개) → ④ 마무리 «동네마다 가게가 있고 파는 물건이 달라요»
   (구버전은 폐기된 옛 상점 UI(shop-overlay·.shop-buy-btn)를 참조해 사실상 동작하지 않았다) */
(function(){
  'use strict';
  var DONE_KEY = 'bd_shop_tutorial_done_v75';   /* 키 유지 — 검수 하네스·기존 세이브 호환 */
  var SHOP_RX = /약국|편의점|문구|마트|슈퍼|스토어|pharmacy|convenience|stationery|mart|tongtoon/i;

  function shopLandmarks(){
    try{
      var st = STAGES[Number(currentStage)]; if (!st) return [];
      return (st.__v24Landmarks || []).filter(function(l){
        return l && !l.hidden && l.majorFacility && (SHOP_RX.test(String(l.label||'')) || SHOP_RX.test(String(l.facilityId||'')));
      });
    }catch(e){ return []; }
  }
  function nearestShop(){
    var best = null, bd = 9;
    shopLandmarks().forEach(function(l){
      var ix = Number(l.interactionX), iy = Number(l.interactionY);
      if (!isFinite(ix) || !isFinite(iy)) return;
      var d = Math.hypot(heroX - ix, heroY - iy);
      if (d < bd){ bd = d; best = l; }
    });
    return best;
  }
  function facilityModalOpenFor(label){
    try{
      var m = document.getElementById('bd-district-facility-modal');
      if (!(m && m.classList.contains('open'))) return false;
      if (!label) return true;
      var norm = function(s){ return String(s||'').replace(/[\s_()\-·]/g,''); };
      return norm(m.textContent).indexOf(norm(label)) >= 0;
    }catch(e){ return false; }
  }
  function shopModalOpen(){
    try{ var m = document.getElementById('bd-shop-modal'); return !!(m && m.classList.contains('show')); }catch(e){ return false; }
  }
  function busyNow(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.BD_TUTOR && BD_TUTOR.isRunning()) return true;
      var d = document.getElementById('dialogue-overlay');
      if (d && d.offsetHeight) return true;
      var b = document.getElementById('dialogue-box');
      if (b && b.getBoundingClientRect().height > 0) return true;
      if (window.BD_choiceOpen && BD_choiceOpen()) return true;
      if (window.__bdDamiIntroBusy || window.__bdDamiOpeningBusy) return true;
      if (window.BD_DamiArbiter && BD_DamiArbiter.pending('story')) return true;   /* (v374) 보류된 이야기 대사가 남아 있으면 대기 */
      if (window.__bdGuideOpen) return true;
      if (document.querySelector('.bd-modal.show')) return true;
      if (facilityModalOpenFor(null)) return true;
    }catch(e){}
    return false;
  }
  function itemCount(){ try{ var it = (window.BD && BD.items) || {}; return Object.keys(it).reduce(function(s,k){ return s + (Number(it[k])||0); }, 0); }catch(e){ return 0; } }
  function equipCount(){ try{ return Object.keys((window.BD && BD.equipV2 && BD.equipV2.owned) || {}).length; }catch(e){ return 0; } }

  var started = false;
  function maybeStart(){
    if (started) return;
    try{
      if (localStorage.getItem(DONE_KEY) === '1'){ started = true; return; }
      if (localStorage.getItem('bd_dami_tutorial_done') !== '1') return;      // 메인 튜토(첫 정화 포함) 먼저
      if (!(window.BD && BD.purified && BD.purified['ow212_trash_1'])) return; // 상점은 첫 정화 뒤 개방(v60)
      if (typeof currentStage === 'undefined' || Number(currentStage) !== 212) return;
      if (!window.BD_TUTOR || typeof BD_TUTOR.run !== 'function') return;
      if (busyNow()) return;
      if (!nearestShop()) return;
    }catch(e){ return; }
    started = true;
    try{ localStorage.setItem(DONE_KEY, '1'); }catch(e){}   // 재등장 방지 (시작 즉시 마킹)

    var shop = nearestShop();
    var label = String(shop.label || '가게');
    var ix = Number(shop.interactionX), iy = Number(shop.interactionY);
    // 골드 가드 — 간식(30G)을 못 사면 실습이 막힌다
    try{ if (typeof playerGold !== 'undefined' && playerGold < 30){ playerGold += 50; setTimeout(function(){ try{ bdToast('💰 담이의 용돈 +50G — 가게에서 써 봐요!'); }catch(e){} }, 1500); } }catch(e){}
    var items0 = itemCount(), eq0 = equipCount(), bought = false;

    // 화살표(길안내) — 가게 문 앞. 튜토 종료 시 해제
    var ovIv = setInterval(function(){
      try{
        var running = window.BD_TUTOR.isRunning();
        /* 시설 모달(z 9950)·상점 모달(z 1200) 위로 스포트라이트를 올리기 위한 body 클래스 (0232 css) */
        document.body.classList.toggle('bd-shop-tuto-on', !!running);
        if (!running){ clearInterval(ovIv); if (window.__bdNavOverride && window.__bdNavOverride.__shopTuto) window.__bdNavOverride = null; return; }
        var opened = facilityModalOpenFor(label) || shopModalOpen();
        if (!opened && !(window.__bdNavOverride && window.__bdNavOverride.__shopTuto)){
          window.__bdNavOverride = { rx: ix - 0.02, ry: iy - 0.03, rw: 0.04, rh: 0.04, label: '🏪 ' + label, _guideLabel: '가게 앞에서 F', __shopTuto: true };
        }
        if (opened && window.__bdNavOverride && window.__bdNavOverride.__shopTuto) window.__bdNavOverride = null;
        if (itemCount() > items0 || equipCount() > eq0) bought = true;
      }catch(e){}
    }, 250);

    window.BD_TUTOR.run([
      { id: 'shop_intro', face: 'proud', block: false,
        text: '첫 정화 완료! 잠깐 — 동네 가게 이용법도 알려드릴게요.',
        waitFor: { delay: 3000 } },
      { id: 'shop_goto', face: 'base', block: false,
        target: function(){
          try{ return window.BD_screenRectOfWorld ? BD_screenRectOfWorld(shop.rx, shop.ry, shop.rw, shop.rh) : null; }catch(e){ return null; }
        },
        text: '가까운 가게 🏪 ' + label + ' 앞으로 가서 F! 화살표를 따라가요.',
        waitFor: { predicate: function(){ return facilityModalOpenFor(label) || shopModalOpen(); }, delay: 180000 } },
      { id: 'shop_open', face: 'base', block: false,
        skipIf: function(){ return shopModalOpen(); },
        target: function(){
          try{ var m = document.getElementById('bd-district-facility-modal');
            /* 시설 창을 닫아 버렸으면 다시 가게 건물을 가리킨다 (F로 재진입) */
            if (!m || !m.classList.contains('open')) return window.BD_screenRectOfWorld ? BD_screenRectOfWorld(shop.rx, shop.ry, shop.rw, shop.rh) : null;
            var b = [...m.querySelectorAll('button')].find(function(x){ return /상점|구경/.test(x.textContent||''); });
            var r = b && b.getBoundingClientRect(); return (r && r.width) ? r : null; }catch(e){ return null; }
        },
        text: '「물건 구경하기」를 눌러 가게에 들어가요. (창을 닫았다면 가게 앞에서 다시 F)',
        waitFor: { predicate: shopModalOpen, delay: 60000 } },
      { id: 'shop_buy', face: 'surprise', block: false,
        target: function(){
          try{ var m = document.getElementById('bd-shop-modal'); if (!m || !m.classList.contains('show')) return null;
            var b = [...m.querySelectorAll('button.bd-equip-up')].find(function(x){ return !x.disabled; });
            var r = b && b.getBoundingClientRect(); return (r && r.width) ? r : null; }catch(e){ return null; }
        },
        text: '간식이나 장비를 하나 사 봐요! 산 물건은 가방(E)에서, 간식은 전투 중에도 쓸 수 있어요.',
        waitFor: { predicate: function(){ return bought || !shopModalOpen(); }, delay: 90000 } },
      { id: 'shop_done', face: 'proud', block: false,
        text: '동네마다 가게가 있고, 파는 물건이 조금씩 달라요. 새 동네에 가면 한 번씩 들러 보세요!',
        waitFor: { delay: 4200 } },
    ], null, 'shop_tuto');
  }

  /* (v374) 전투 종료 직후 결과창이 뜨기 전 틈에 시작하지 않도록 — 전투가 끝난 뒤 3초는 대기 */
  var lastBattleAt = 0;
  setInterval(function(){
    try{
      if (window.HSR && HSR.active){ lastBattleAt = Date.now(); return; }
      if (Date.now() - lastBattleAt < 3000) return;
      maybeStart();
    }catch(e){}
  }, 700);
})();
