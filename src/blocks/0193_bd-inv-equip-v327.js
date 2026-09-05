
/* (v327) 가방 «장비» 탭 — 구매 장비(BD.equipV2.owned)가 안 보이던 문제.
   렌더 후 보유 장비를 그리드에 덧붙이고, 클릭하면 장비 창(3슬롯)이 열린다. */
(function(){
  'use strict';
  function append(){
    try{
      if (window.__bdToyV375) return;   /* (v375) 가방 리디자인(0242)이 장비 항목을 직접 그린다 — 중복 방지 */
      /* currentInvTab 은 클로저 변수라 접근 불가 — 활성 탭 버튼에서 파싱 */
      var btnA = document.querySelector('.inv-tab.active');
      var oc = (btnA && btnA.getAttribute('onclick')) || '';
      var tab = oc.indexOf("'equip'") >= 0 ? 'equip' : (oc.indexOf("'all'") >= 0 || !oc) ? 'all'
        : oc.indexOf("'consumable'") >= 0 ? 'consumable' : 'other';
      if (tab !== 'equip' && tab !== 'all') return;
      var grid = document.getElementById('inv-grid');
      var shop = window.BD_EQUIP_SHOP;
      if (!grid || !shop || !window.BD) return;
      var owned = (BD.equipV2 && BD.equipV2.owned) || {};
      var keys = Object.keys(shop).filter(function(k){ return owned[k]; });
      if (!keys.length) return;
      // 기존 «없어요» 빈 메시지 제거
      var empty = grid.querySelector('.inv-empty');
      if (empty) empty.remove();
      keys.forEach(function(k){
        var e = shop[k];
        var on = BD.equipV2[e.slot] === e.val;
        var slot = document.createElement('div');
        slot.className = 'inv-slot bd-inv-equip' + (on ? ' selected' : '');
        slot.title = e.name + ' — ' + e.desc + (on ? ' (장착 중)' : '');
        slot.innerHTML = '<div class="inv-slot-icon">' + e.icon + '</div>'
          + (on ? '<div class="inv-slot-count" style="background:#2e7d32">착용</div>' : '');
        slot.onclick = function(){
          try{
            var d = document.getElementById('inv-detail');
            if (d) d.innerHTML = '<div style="padding:10px 12px">'
              + '<div style="font-weight:800;margin-bottom:4px">' + e.icon + ' ' + e.name + (on ? ' <span style="color:#7ee2a8;font-size:12px">장착 중</span>' : '') + '</div>'
              + '<div style="font-size:13px;color:#b9c2d8;margin-bottom:8px">' + e.desc + '</div>'
              + '<button class="bd-equip-up" onclick="try{closeInventory()}catch(e){};window.BD_openEquipModal&&BD_openEquipModal()">🔧 장비 창에서 관리</button>'
              + '</div>';
          }catch(err){}
        };
        grid.appendChild(slot);
      });
    }catch(e){}
  }
  var iv = setInterval(function(){
    if (typeof window.renderInventory !== 'function' || window.renderInventory.__v327) return;
    var orig = window.renderInventory;
    window.renderInventory = function(){ var r = orig.apply(this, arguments); try{ append(); }catch(e){} return r; };
    window.renderInventory.__v327 = true;
    clearInterval(iv);
  }, 400);
})();
