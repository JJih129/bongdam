
/* (v77) 가방(E)에서 회복 아이템 직접 사용 — 상점에서 산 기능 아이템을 전투 밖에서도 쓸 수 있게 */
(function(){
  'use strict';
  var USABLE = {
    snack:  { name:'간식',      icon:'🍪', use:function(){ return healHero(40); } },
    drink:  { name:'음료',      icon:'☕', use:function(){ return healHero(25); } },
    potion: { name:'회복약',    icon:'🧪', use:function(){ return healHero(60); } }
  };
  function heroMax(){ try{ if (typeof getMaxHP === 'function') return getMaxHP(); if (window.BD && BD.maxHp) return BD.maxHp; }catch(e){} return 100; }
  function healHero(v){
    try{
      if (typeof heroHP === 'undefined') return false;
      if (heroHP >= heroMax()) { toast('이미 체력이 가득해요'); return false; }
      heroHP = Math.min(heroMax(), heroHP + v);
      if (typeof window.BD_syncHP === 'function') BD_syncHP(heroHP, true);
      if (typeof bdSave === 'function') bdSave();
      return true;
    }catch(e){ return false; }
  }
  function toast(t){ try{ if (typeof bdToast==='function') bdToast(t); }catch(e){} }
  function count(key){ try{ return (window.BD && BD.items && BD.items[key]) || 0; }catch(e){ return 0; } }

  window.BD_bagUse = function(key){
    var d = USABLE[key]; if (!d) return false;
    if (count(key) <= 0){ toast('가지고 있지 않아요'); return false; }
    if (window.HSR && HSR.active){ toast('전투 중에는 전투 화면에서 사용해 주세요'); return false; }
    if (!d.use()) return false;
    try{ BD.items[key] = Math.max(0, count(key) - 1); }catch(e){}
    toast(d.icon + ' ' + d.name + '을(를) 사용했어요! 체력 ' + heroHP + '/' + heroMax());
    render();
    return true;
  };

  /* 가방 패널 하단에 '사용' 목록을 붙인다 (기존 UI는 건드리지 않음) */
  function render(){
    /* (v287) 인벤토리 통합으로 폐지 — 지역 상점 아이템은 가방 목록에서 직접 사용 */
    try{ var _bx = document.getElementById('bd-bag-use'); if (_bx) _bx.remove(); }catch(_e){}
    if (true) return;
    try{
      var panel = document.getElementById('inv-panel');
      if (!panel || !panel.offsetParent) return;
      var box = document.getElementById('bd-bag-use');
      if (!box){
        box = document.createElement('div');
        box.id = 'bd-bag-use';
        box.style.cssText = 'margin:10px 14px 14px;padding:10px 12px;border-radius:12px;'
          + 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);';
        panel.appendChild(box);
      }
      var html = '<div style="font-size:13px;font-weight:800;color:#ffd86b;margin-bottom:8px;">바로 사용하기</div>';
      var any = false;
      Object.keys(USABLE).forEach(function(k){
        var c = count(k); if (c <= 0) return;
        any = true;
        html += '<button data-bd-use="' + k + '" style="margin:4px 6px 0 0;padding:7px 12px;border-radius:9px;'
             + 'border:1px solid rgba(255,255,255,.2);background:#2b3550;color:#fff;font-weight:700;cursor:pointer;">'
             + USABLE[k].icon + ' ' + USABLE[k].name + ' ×' + c + '</button>';
      });
      if (!any) html += '<div style="font-size:12px;color:#b9c2d6;">사용할 수 있는 회복 아이템이 없어요. 가게에서 사 둘 수 있어요.</div>';
      box.innerHTML = html;
      box.querySelectorAll('[data-bd-use]').forEach(function(b){
        b.onclick = function(){ window.BD_bagUse(b.getAttribute('data-bd-use')); };
      });
    }catch(e){}
  }
  setInterval(render, 300);   // (v86) 구매 직후에도 즉시 반영되도록 주기 단축
  // 가방을 여는 순간 바로 그리기
  document.addEventListener('keydown', function(e){
    if (e.key === 'e' || e.key === 'E') setTimeout(render, 120);
  }, true);
})();
