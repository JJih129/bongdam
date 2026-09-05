
/* (v375) 가방·상점 개편
   ① 상점 렌더러 교체(BD_openShop) — 가게 종류별로 다른 품목: 약국(회복 간식·보호구) / 마트(도시락·구급팩·기념품) /
      문구점(장난감·문구·간식). 지역 품목은 옛 0134 데이터를 계승. 구 #shop-overlay 는 제거됨.
   ② 가방(E) 리디자인 — 카드형 칸(그림+이름+수량), 탭별 클릭 상세(효과·설명·행동 버튼), 「🧸 물건」 탭 추가,
      보호구·기념품(equipV2)도 장비 탭에서 보고 장착/해제.
   ③ 장난감 놀이 효과 — 말랑이·요요·뽑기 캡슐·봉담 산책 지도·줄넘기·샤프·노트 세트 각각 다른 재미 효과.
   0016 의 전역 함수(renderInventory·showInvDetail·useSelectedItem)를 같은 이름으로 덮어써 동작시킨다. */
(function(){
  'use strict';
  window.__bdToyV375 = true;   /* 0202 공용 «가지고 놀기» 버튼 대체 */
  function G(){ return (typeof playerGold !== 'undefined') ? playerGold : 0; }
  function setGold(v){ try{ playerGold = v; }catch(e){} }
  function toast(t){ try{ bdToast(t); }catch(e){} }
  function save(){ try{ bdSave(); }catch(e){} try{ if (typeof autoSave === 'function') autoSave('구매'); }catch(e){} }
  function pool(id){ try{ return ITEM_POOL.find(function(i){ return i.id === id; }) || null; }catch(e){ return null; } }

  /* ══════════ ① 상점 ══════════ */
  var CONS = {   /* BD.items 키 기반 회복 소모품 — 가게별 이름·가격·설명만 다르다 */
    snack:  { icon:'🍪', heal:40 }, drink: { icon:'🥤', heal:25 }, potion: { icon:'🧪', heal:60 }
  };
  var STORES = {
    /* 약국 — 회복·보호구 */
    pharmacy: { title:'약국', cons:[
        { key:'snack',  name:'초코 간식',   price:30,  desc:'체력 40 회복 · 가볍게 한 입' },
        { key:'drink',  name:'이온 음료',   price:25,  desc:'체력 25 회복 · 시원하게 한 모금' },
        { key:'potion', name:'구급 회복약', price:60,  desc:'체력 60 회복 · 다친 데 있을 때' } ],
      equip:['prot_W','prot_G','prot_M'], toys:[] },
    /* 마트 — 든든한 먹을거리·기념품 */
    mart: { title:'마트', cons:[
        { key:'snack',  name:'즉석 도시락', price:35,  desc:'체력 40 회복 · 든든하게' },
        { key:'potion', name:'종합 구급팩', price:55,  desc:'체력 60 회복 · 밤길 대비' } ],
      equip:['memo_hp'], toys:['rope','map_scroll'] },
    /* 문구점 — 장난감·문구 */
    stationery: { title:'문구점', cons:[
        { key:'snack',  name:'문구점 젤리', price:20,  desc:'체력 40 회복 · 달콤한 한 봉지' } ],
      equip:[], toys:['squishy','yoyo_toy','capsule_toy','iron_sword','rope','map_scroll'] },
    /* 편의점·기타 */
    conv: { title:'가게', cons:[
        { key:'snack',  name:'삼각김밥',   price:25,  desc:'체력 40 회복 · 한 끼 때우기' },
        { key:'drink',  name:'에너지 음료', price:25,  desc:'체력 25 회복 · 시원하게' } ],
      equip:[], toys:['capsule_toy'] }
  };
  /* 지역별 약국 품목 이름 편차 (옛 0134 계승) */
  var REGION_PH = {
    212: [ { key:'snack', name:'초코 간식', price:30, desc:'체력 40 회복 · 가볍게 한 입' }, { key:'drink', name:'이온 음료', price:25, desc:'체력 25 회복 · 시원하게 한 모금' } ],
    213: [ { key:'potion', name:'구급 회복약', price:60, desc:'체력 60 회복 · 도서관 자율학습 필수품' }, { key:'snack', name:'견과 바', price:32, desc:'체력 40 회복 · 오래 앉아 있을 때' } ],
    211: [ { key:'potion', name:'파스 세트', price:55, desc:'체력 60 회복 · 청소 뒤 뻐근할 때' }, { key:'drink', name:'비타민 음료', price:25, desc:'체력 25 회복 · 시원하게 한 모금' } ],
    210: [ { key:'snack', name:'즉석 도시락', price:35, desc:'체력 40 회복 · 든든하게' }, { key:'potion', name:'종합 구급팩', price:60, desc:'체력 60 회복 · 밤길 대비' } ]
  };
  function storeKind(fid, label){
    var s = String(fid || '') + ' ' + String(label || '');
    if (/stationery|문구|통툰|tongtoon/i.test(s)) return 'stationery';
    if (/mart|마트/i.test(s)) return 'mart';
    if (/pharmacy|약국/i.test(s)) return 'pharmacy';
    if (/편의점|convenience|store/i.test(s)) return 'conv';
    return 'pharmacy';
  }
  function nearestStore(){
    try{
      var nf = (typeof window.BD_v24NearestFacility === 'function') ? BD_v24NearestFacility() : null;
      if (nf) return { fid: nf.facilityId, label: nf.label };
    }catch(e){}
    try{ if (window.__bdShopStore) return { fid:'', label: window.__bdShopStore }; }catch(e){}
    return { fid:'', label:'' };
  }
  function buyCons(def){
    if (G() < def.price){ toast('소지금이 부족해요'); return false; }
    setGold(G() - def.price);
    BD.items = BD.items || {}; BD.items[def.key] = (BD.items[def.key] || 0) + 1;
    save(); toast('🛒 ' + def.name + ' 구매! 가방(E)·전투 아이템에서 쓸 수 있어요');
    try{ bdSubQuestProgress && bdSubQuestProgress('npc_haneul'); }catch(e){}
    return true;
  }
  function buyToy(id){
    var it = pool(id); if (!it) return false;
    if (G() < it.price){ toast('소지금이 부족해요'); return false; }
    setGold(G() - it.price);
    try{ addToInventory(it, 1); }catch(e){}
    save(); toast(it.icon + ' ' + it.name + ' 샀다! 가방(E) 🧸 물건 탭에서 놀아 봐요');
    return true;
  }
  window.BD_buyCons = buyCons; window.BD_buyToy = buyToy;

  function render(){
    var m = document.getElementById('bd-shop-modal');
    if (!m){ m = document.createElement('div'); m.id = 'bd-shop-modal'; m.className = 'bd-modal'; document.body.appendChild(m); }
    var st = nearestStore(), kind = storeKind(st.fid, st.label), S = STORES[kind];
    var sid = Number(typeof currentStage !== 'undefined' ? currentStage : 0);
    var cons = (kind === 'pharmacy' && REGION_PH[sid]) ? REGION_PH[sid] : S.cons;
    var items = (window.BD && BD.items) || {};
    var title = (st.label || S.title);
    var html = '<div class="bd-modal-box bd-shop375">'
      + '<div class="bd-modal-title">🛒 ' + title + ' · 소지금 ' + G() + 'G</div>';
    /* 회복 소모품 */
    html += '<div class="bd-shop-sec">— 먹을거리 · 회복 —</div>';
    cons.forEach(function(d){
      var c = CONS[d.key] || { icon:'🍪' };
      html += '<div class="bd-equip-row"><span class="bd-equip-ic">' + c.icon + '</span>'
        + '<span class="bd-equip-nm">' + d.name + ' <small class="bd-shop-have">보유 ' + (items[d.key] || 0) + '</small><br><small>' + d.desc + '</small></span>'
        + '<button class="bd-equip-up" data-cons="' + d.key + '">구매 (' + d.price + 'G)</button></div>';
    });
    /* 보호구·기념품 */
    if (S.equip.length && window.BD_EQUIP_SHOP){
      html += '<div class="bd-shop-sec">— 장비 (종류별 1회) —</div>';
      S.equip.forEach(function(k){
        var e = BD_EQUIP_SHOP[k]; if (!e) return;
        var owned = !!(BD.equipV2 && BD.equipV2.owned && BD.equipV2.owned[k]);
        var locked = (BD.questIdx || 0) < (e.unlockQ || 0);
        html += '<div class="bd-equip-row' + (owned ? ' bd-shop-owned' : '') + '"><span class="bd-equip-ic">' + e.icon + '</span>'
          + '<span class="bd-equip-nm">' + e.name + (owned ? ' <b class="bd-shop-have">보유</b>' : '') + '<br><small>' + e.desc + '</small></span>'
          + (owned ? '<button class="bd-equip-up" disabled>보유 중</button>'
             : locked ? '<button class="bd-equip-up" disabled>다음 장 이후</button>'
             : '<button class="bd-equip-up" data-equip="' + k + '">구매 (' + e.price + 'G)</button>') + '</div>';
      });
    }
    /* 장난감·문구 */
    if (S.toys.length){
      html += '<div class="bd-shop-sec">— 장난감 · 문구 —</div>';
      S.toys.forEach(function(id){
        var it = pool(id); if (!it) return;
        var have = (typeof playerInventory !== 'undefined' && playerInventory[id]) ? playerInventory[id].count : 0;
        html += '<div class="bd-equip-row"><span class="bd-equip-ic">' + it.icon + '</span>'
          + '<span class="bd-equip-nm">' + it.name + (have ? ' <small class="bd-shop-have">보유 ' + have + '</small>' : '') + '<br><small>' + it.desc + '</small></span>'
          + '<button class="bd-equip-up" data-toy="' + id + '">구매 (' + it.price + 'G)</button></div>';
      });
    }
    html += '<button class="bd-modal-close" id="bd-shop-close">닫기</button></div>';
    m.innerHTML = html;
    m.classList.add('show');
    m.querySelectorAll('[data-cons]').forEach(function(b){ b.onclick = function(){ var d = cons.find(function(x){ return x.key === b.getAttribute('data-cons'); }); if (d && buyCons(d)) render(); }; });
    m.querySelectorAll('[data-equip]').forEach(function(b){ b.onclick = function(){ if (window.BD_buyEquip && BD_buyEquip(b.getAttribute('data-equip'))) render(); }; });
    m.querySelectorAll('[data-toy]').forEach(function(b){ b.onclick = function(){ if (buyToy(b.getAttribute('data-toy'))) render(); }; });
    m.querySelectorAll('.bd-equip-row').forEach(function(r){ r.__bd353 = true; });   /* 0217 «품절 편차» 제외 — 품목은 가게 종류가 결정 */
    var cl = m.querySelector('#bd-shop-close'); if (cl) cl.onclick = function(){ m.classList.remove('show'); };
    return true;
  }
  function installShop(){
    if (window.BD_openShop && window.BD_openShop.__v375) return;
    var prev = window.BD_openShop;
    window.BD_openShop = function(){ try{ render(); }catch(e){ try{ if (prev) return prev.apply(this, arguments); }catch(e2){} } };
    window.BD_openShop.__v375 = true;
    window.BD_openShop.__v353 = true;   /* 0217 래퍼 불필요 (지점명은 여기서 직접) */
  }
  installShop();
  setInterval(installShop, 1000);

  /* ══════════ ③ 장난감 놀이 효과 ══════════ */
  var TOY = {
    squishy:     { btn:'🧸 조물조물', fx:function(){ squishFX(); toast('🧸 말랑말랑… 마음이 말랑해졌다 (체력 +3)'); try{ heal(3); }catch(e){} }, consume:false },
    yoyo_toy:    { btn:'🪀 요요 던지기', fx:function(){ yoyoFX(); toast('🪀 휙— 하고 돌아왔다!'); }, consume:false },
    capsule_toy: { btn:'🎁 뽑기!', fx:function(){ return capsuleFX(); }, consume:true },
    map_scroll:  { btn:'🗺️ 지도 펼치기', fx:function(){ try{ closeInventory(); }catch(e){} setTimeout(function(){ try{ BD_openSafetyMap(); }catch(e){} }, 150); }, consume:false },
    rope:        { btn:'🪢 줄넘기 하기', fx:function(){ jumpFX(); window.__bdSpeedBuffUntil = Date.now() + 20000; toast('🪢 열 번 넘었다! 발이 가벼워졌다 (이동속도 +20% · 20초)'); }, consume:false },
    iron_sword:  { btn:'✏️ 수첩 펴기', fx:function(){ try{ closeInventory(); }catch(e){} setTimeout(function(){ try{ if (window.BD_codexOpen) BD_codexOpen(); else toast('✏️ 오늘 배운 걸 적어 두자.'); }catch(e){} }, 150); }, consume:false },
    guardian_badge: { btn:'🛡️ 배지 보기', fx:function(){ try{ if (window.BD_DAMI) BD_DAMI.show('저예요! 배지에 깃든 마음, 담이. 언제든 저를 눌러 지도를 볼 수 있어요', { face:'proud', channel:'tip' }); }catch(e){} }, consume:false },
    gold_bookmark:  { btn:'🎫 자세히', fx:function(){ toast('🎫 문화상품권 — 편의점·문화의집에서 쓸 수 있다고 적혀 있다.'); }, consume:false }
  };
  function heal(v){ try{ heroHP = Math.min(getMaxHP(), heroHP + v); if (window.BD_syncHP) BD_syncHP(heroHP, true); }catch(e){} }
  function cssOnce(){
    if (document.getElementById('bd-toyfx-css')) return;
    var st = document.createElement('style'); st.id = 'bd-toyfx-css';
    st.textContent = '@keyframes bdSquish{0%,100%{transform:scale(1)}30%{transform:scale(1.06,.94)}60%{transform:scale(.96,1.05)}}'
      + '@keyframes bdYoyo{0%{transform:translateY(0) rotate(0)}50%{transform:translateY(110px) rotate(540deg)}100%{transform:translateY(0) rotate(1080deg)}}'
      + '@keyframes bdJump{0%,100%{transform:translateY(0)}50%{transform:translateY(-26px)}}'
      + '@keyframes bdCapsule{0%{transform:scale(.3) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(8deg);opacity:1}100%{transform:scale(1) rotate(0)}}'
      + '.bd-toy-float{position:fixed;z-index:100040;font-size:38px;pointer-events:none;text-shadow:0 4px 10px rgba(0,0,0,.5)}'
      + '.bd-capsule-card{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:100041;background:#fffaf0;border:3px solid #f5b342;border-radius:18px;padding:18px 26px;text-align:center;font-family:"Noto Serif KR",serif;box-shadow:0 14px 40px rgba(0,0,0,.45);animation:bdCapsule .6s cubic-bezier(.2,1.4,.4,1) both}'
      + '.bd-capsule-card b{display:block;font-size:34px;margin-bottom:6px}.bd-capsule-card span{font-size:15px;color:#6b4a12;font-weight:800}';
    document.head.appendChild(st);
  }
  function heroScreen(){
    try{
      var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}
      var r = BD_screenRectOfWorld(heroX - 0.01, heroY - 0.03, 0.02, 0.03); if (r) return { x: (r.left + r.width / 2) / z, y: r.top / z };
    }catch(e){}
    return { x: innerWidth / 2, y: innerHeight / 2 };
  }
  function squishFX(){ cssOnce(); var p = document.getElementById('inv-panel') || document.body; p.style.animation = 'bdSquish .7s ease'; setTimeout(function(){ p.style.animation = ''; }, 750); }
  function floatEmoji(ch, anim, ms){
    cssOnce(); var h = heroScreen(); var d = document.createElement('div'); d.className = 'bd-toy-float'; d.textContent = ch;
    d.style.left = (h.x - 19) + 'px'; d.style.top = (h.y - 40) + 'px'; d.style.animation = anim + ' ' + ms + 'ms ease-in-out';
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, ms + 50);
  }
  function yoyoFX(){ try{ closeInventory(); }catch(e){} setTimeout(function(){ floatEmoji('🪀', 'bdYoyo', 1400); }, 120); }
  function jumpFX(){ try{ closeInventory(); }catch(e){} setTimeout(function(){ var n = 0; var iv = setInterval(function(){ floatEmoji('🪢', 'bdJump', 420); if (++n >= 4) clearInterval(iv); }, 430); }, 120); }
  function capsuleFX(){
    cssOnce();
    var r = Math.random(); var prize;
    if (r < 0.45){ var g = 5 + Math.floor(Math.random() * 26); setGold(G() + g); prize = { ic:'💰', t:'소지금 +' + g + 'G' }; }
    else if (r < 0.75){ BD.items = BD.items || {}; BD.items.snack = (BD.items.snack || 0) + 1; prize = { ic:'🍪', t:'간식 1개!' }; }
    else if (r < 0.9){ var it = pool('squishy'); if (it) addToInventory(it, 1); prize = { ic:'🧸', t:'미니 말랑이!' }; }
    else { try{ if (window.BD_addSafetyXP) BD_addSafetyXP(5); }catch(e){} prize = { ic:'✨', t:'안전 포인트 +5!' }; }
    var c = document.createElement('div'); c.className = 'bd-capsule-card'; c.innerHTML = '<b>' + prize.ic + '</b><span>달칵! ' + prize.t + '</span>';
    document.body.appendChild(c); setTimeout(function(){ c.remove(); }, 1900);
    try{ if (window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
    save();
    return true;
  }

  /* ══════════ ② 가방 리디자인 ══════════ */
  var TAB_NAME = { consumable:'소모품', equip:'장비', misc:'물건', achieve:'업적', safety:'안전도' };
  function equipEntries(){   /* equipV2 보호구·기념품 → 가상 항목 */
    var out = [];
    try{
      var ES = window.BD_EQUIP_SHOP || {}, EV = (BD.equipV2 || { owned:{} });
      Object.keys(ES).forEach(function(k){
        if (!EV.owned || !EV.owned[k]) return;
        var e = ES[k];
        out.push({ item: { id:'eq:' + k, tab:'equip', icon:e.icon, name:e.name, desc:e.desc, __eq:k, __slot:e.slot, __val:e.val, __on:(EV[e.slot] === e.val) }, count:1 });
      });
    }catch(e){}
    return out;
  }
  function addTabOnce(){
    var tabs = document.getElementById('inv-tabs'); if (!tabs || tabs.querySelector('[data-v375-misc]')) return;
    var b = document.createElement('button'); b.className = 'inv-tab'; b.setAttribute('data-v375-misc', '1'); b.textContent = '🧸 물건';
    b.onclick = function(){ switchInvTab('misc', b); };
    var eq = tabs.querySelectorAll('.inv-tab')[2]; if (eq && eq.nextSibling) tabs.insertBefore(b, eq.nextSibling); else tabs.appendChild(b);
  }
  function effectLine(item){
    var id = item.id;
    if (item.__eq) return (item.__on ? '장착 중 · ' : '') + '보호구/기념품 — 전투 피해 감소·최대 HP';
    var H = { snack:'체력 +40', drink:'체력 +25', potion:'체력 +60', hp_potion:'체력 +50', rice_ball:'체력 +20', bandage:'체력 +5', elixir:'체력 전부 회복', coffee:'이동속도 +20% (60초)', boots:'이동속도 +10% (10분)' };
    if (H[id]) return '효과 · ' + H[id];
    if (TOY[id]) return '놀이 · ' + TOY[id].btn.replace(/^[^\s]+\s/, '') + (TOY[id].consume ? ' (1개 소모)' : '');
    return '';
  }
  window.renderInventory = function(){
    var grid = document.getElementById('inv-grid'); if (!grid) return;
    addTabOnce();
    grid.innerHTML = '';
    var entries = Object.values(playerInventory).filter(function(e){ return currentInvTab === 'all' ? true : e.item.tab === currentInvTab; });
    if (currentInvTab === 'all' || currentInvTab === 'equip') entries = entries.concat(equipEntries());
    entries.sort(function(a, b){ return (b.item.featured ? 1 : 0) - (a.item.featured ? 1 : 0); });
    if (!entries.length){
      grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">' + ({ consumable:'회복 아이템이 없어요. 약국·마트에서 살 수 있어요.', equip:'장비가 없어요. 약국(보호구)·마트(기념품)에서 살 수 있어요.', misc:'장난감·물건이 없어요. 문구점에 들러 봐요!' }[currentInvTab] || '보유한 아이템이 없어요.') + '</div>';
      resetInvDetail(); return;
    }
    entries.forEach(function(en){
      var item = en.item, count = en.count;
      var slot = document.createElement('div');
      slot.className = 'inv-slot inv-card375' + (selectedInvItemId === item.id ? ' selected' : '') + (item.featured ? ' inv-cell-featured' : '') + (item.__on ? ' inv-eq-on' : '');
      slot.title = item.name;
      slot.innerHTML = '<div class="inv-slot-icon">' + item.icon + '</div><div class="inv-slot-name">' + item.name + '</div>'
        + (count > 1 ? '<div class="inv-slot-count">×' + count + '</div>' : '') + (item.__on ? '<div class="inv-slot-on">장착</div>' : '');
      slot.onclick = function(){ selectedInvItemId = item.id; window.__bdInvVirtual = item.__eq ? item : null; window.renderInventory(); };
      grid.appendChild(slot);
    });
    var sel = selectedInvItemId && (playerInventory[selectedInvItemId] ? playerInventory[selectedInvItemId].item : (window.__bdInvVirtual && window.__bdInvVirtual.id === selectedInvItemId ? window.__bdInvVirtual : null));
    if (sel) window.showInvDetail(sel); else resetInvDetail();
  };
  window.showInvDetail = function(item){
    var ic = document.getElementById('inv-detail-icon'), nm = document.getElementById('inv-detail-name'), ds = document.getElementById('inv-detail-desc'), btn = document.getElementById('inv-use-btn');
    if (!ic) return;
    ic.textContent = item.icon; nm.textContent = item.name;
    var eff = effectLine(item);
    ds.innerHTML = '<div class="inv-eff">' + eff + '</div><div>' + (item.desc || '') + '</div>';
    var label = null;
    if (item.__eq) label = item.__on ? '장착 해제' : '장착하기';
    else if (item.tab === 'consumable' || item.id === 'boots') label = '사용하기';
    else if (TOY[item.id]) label = TOY[item.id].btn;
    if (label){ btn.style.display = 'block'; btn.textContent = label; } else btn.style.display = 'none';
  };
  var origUse = window.useSelectedItem;
  window.useSelectedItem = function(){
    try{
      if (!selectedInvItemId) return;
      var v = window.__bdInvVirtual;
      if (v && v.id === selectedInvItemId && v.__eq){
        if (window.HSR && HSR.active){ toast('전투 중에는 장비를 바꿀 수 없어요'); return; }
        try{ BD_setEquipV2(v.__slot, v.__on ? '' : v.__val); }catch(e){}
        try{ document.getElementById('bd-equip-modal') && document.getElementById('bd-equip-modal').classList.remove('show'); }catch(e){}
        toast(v.__on ? '장비를 벗었어요' : '🎒 ' + v.name + ' 장착!');
        window.__bdInvVirtual = null; selectedInvItemId = null; window.renderInventory(); return;
      }
      var entry = playerInventory[selectedInvItemId]; if (!entry) return;
      var t = TOY[entry.item.id];
      if (t){
        var ok = t.fx();
        if (entry.item.id !== 'capsule_toy'){ try{ if (window.BD_toyPlay) BD_toyPlay(entry.item, document.getElementById('inv-use-btn')); }catch(eB){} }
        if (t.consume && ok !== false){ entry.count--; if (entry.count <= 0){ delete playerInventory[selectedInvItemId]; selectedInvItemId = null; } }
        try{ document.getElementById('inv-gold-amount').textContent = playerGold; }catch(e){}
        save(); window.renderInventory(); return;
      }
    }catch(e){}
    return origUse.apply(this, arguments);
  };
})();
