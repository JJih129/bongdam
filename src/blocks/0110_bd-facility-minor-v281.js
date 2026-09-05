
/* (v281) 전 시설 상호작용 — 배경 랜드마크 23곳을 '보조 시설(minorFacility)'로 승격.
   위험요소 조사처럼 F를 누르면 선택 버튼(💗 휴식 / 🏪 상점 / 📖 시설 설명)이 뜨지만,
   스탬프·수집률·챕터 진행에는 잡히지 않는다 (openFacility·rebuildRegistries의 v281 분기와 한 세트).
   v39 승격 패치와 같은 '런타임 재적용(tick 600ms)' 패턴 — 세이브 로드·에디터 조작 후에도 자동 복구. */
(function(){
  'use strict';
  // facilityId → 액션 (rest: 안내+휴식 / shop: 안내+휴식+상점 / fit: 안내+운동(스탯 단련, 회복 없음))
  var MINOR = {
    210: { tongtoon:'rest', uri_home_mart:'shop' },
    211: { smile_forest:'fit', bongdam1_fountain:'fit', clear_spring_cafe:'rest',
           the_holic_cafe:'rest', boardking_cafe:'rest',
           donghwa_pharmacy:'shop', jeongdaun_pharmacy:'shop' },
    212: { wauri_culture_park:'fit', dream_stationery:'shop',
           wawoo_pharmacy:'shop', university_pharmacy:'shop' },
    213: { coffee_book_nono:'rest', doran_doran_park:'fit', bongdam_lake_park:'fit',
           eoullim_park:'fit', bongdam2_ecosports:'fit', sambong_neighborhood_park:'fit',
           deulnyeok_oreum_park:'fit', sangri_pharmacy:'shop', bongdam_admin_pharmacy:'shop',
           alpha_stationery:'shop' }
  };
  window.BD_MINOR_FACILITY_ACTION = {};   // facilityId → 액션 (openFacility 모달 분기에서 사용)

  // (v281b) 공원별 운동 콘텐츠 — 공원마다 다른 활동·스탯. 공원당 1회 영구 보너스,
  //  이후 반복은 연출만 (스탯 파밍 방지). 회복 기능은 공원에서 제거 — 휴식은 카페·상점 몫.
  var FIT = {
    wauri_culture_park:        { btn:'🏃 광장 조깅하기',        stat:'hp',  amt:5, done:'광장을 한 바퀴 더 가볍게 돌았다. 상쾌하다!' },
    smile_forest:              { btn:'🌲 숲길 걷기 운동',        stat:'hp',  amt:5, done:'나무 사이를 걸으며 숨을 골랐다. 마음이 맑아진다!' },
    bongdam1_fountain:         { btn:'🤸 분수광장 스트레칭',     stat:'atk', amt:1, done:'분수 앞에서 몸을 쭉쭉 늘였다. 개운하다!' },
    doran_doran_park:          { btn:'🤾 놀이터에서 몸풀기',     stat:'hp',  amt:3, done:'철봉에 매달려 몸을 풀었다. 가뿐하다!' },
    bongdam_lake_park:         { btn:'🏃 호수 한 바퀴 조깅하기', stat:'hp',  amt:5, done:'호수 둘레를 달렸다. 바람이 시원하다!' },
    eoullim_park:              { btn:'🚶 산책로 파워워킹',       stat:'hp',  amt:5, done:'씩씩하게 산책로를 걸었다. 다리가 튼튼해지는 기분!' },
    bongdam2_ecosports:        { btn:'💪 운동기구 트레이닝',     stat:'atk', amt:1, done:'운동기구로 팔다리를 단련했다. 힘이 솟는다!' },
    sambong_neighborhood_park: { btn:'🏃 숲 계단 오르기',        stat:'hp',  amt:5, done:'계단을 오르내리며 땀을 흘렸다. 뿌듯하다!' },
    deulnyeok_oreum_park:      { btn:'🛹 X게임장 보드 연습',     stat:'atk', amt:1, done:'보드 위에서 균형을 잡았다. 몸놀림이 가벼워졌다!' }
  };
  window.BD_MINOR_FIT = FIT;   // openFacility 버튼 라벨·완료 표시에서 사용

  function promoteMinor(o, action){
    if (!o) return;
    // 기존 스탬프 시설(수영약국 등)이 이미 major로 승격돼 있으면 절대 건드리지 않는다
    if (o.majorFacility && !o.minorFacility) return;
    o.majorFacility = true;      // 기존 상호작용 파이프라인(F판정·모달·라벨)에 태운다
    o.minorFacility = true;      // 단, 수집률·스탬프에서는 제외 (rebuildRegistries v281 분기)
    o.conceptFacility = true;
    o.conceptLandmark = false;
    o.collectible = false;
    o.visualOnly = false;
    if (o.locked) o.locked = false;
    window.BD_MINOR_FACILITY_ACTION[o.facilityId] = action;
  }

  function tick(){
    try{
      if (typeof STAGES === 'undefined') return;
      Object.keys(MINOR).forEach(function(sid){
        var st = STAGES[sid]; if (!st) return;
        var map = MINOR[sid];
        [(st.objects || []), (st.__v24Landmarks || [])].forEach(function(list){
          list.forEach(function(o){
            if (o && o.facilityId && map[o.facilityId]) promoteMinor(o, map[o.facilityId]);
          });
        });
      });
    }catch(e){}
  }
  tick();
  setInterval(tick, 600);

  /* ── 🏃 공원 운동 — 공원당 1회 영구 스탯 단련, 반복은 연출만 (회복 없음) ── */
  window.BD_minorFit = function(landmark){
    try{
      var fid = landmark && landmark.facilityId;
      var f = fid && FIT[fid]; if (!f) return;
      var label = String(landmark.label || '공원');
      if (!window.BD) return;
      BD._fitDone = BD._fitDone || {};
      var first = !BD._fitDone[fid];
      if (first){
        BD._fitDone[fid] = true;
        if (f.stat === 'hp'){
          BD._parkBonus = (BD._parkBonus || 0) + f.amt;   // recalcStats가 maxHp에 합산·세이브에 저장됨
        } else {
          BD._fitAtk = (BD._fitAtk || 0) + f.amt;         // recalcStats(v281b)가 atk에 합산
        }
        if (typeof recalcStats === 'function') recalcStats();
        else if (typeof window.BD_recalcStats === 'function') BD_recalcStats();
        if (typeof bdSave === 'function') bdSave();
        var rw = (f.stat === 'hp' ? '최대 HP +' : '공격력 +') + f.amt;
        try{ if (typeof bdToast === 'function') bdToast('🏅 ' + label + ' 단련 완료! ' + rw + ' (영구)'); }catch(eT){}
        if (typeof showDialog === 'function'){
          showDialog('나', ['(' + label + '에서 ' + f.btn.replace(/^[^ ]+ /,'') + ' — 열심히 몸을 움직였다!)',
                            '(몸이 한층 단단해진 기분이다. ' + rw + '!)']);
        }
      } else {
        if (typeof showDialog === 'function'){
          showDialog('나', ['(' + f.done + ')']);
        } else if (typeof bdToast === 'function'){
          bdToast('🏃 ' + label + ' — 오늘도 가볍게 몸을 풀었다!');
        }
      }
      setTimeout(function(){ try{
        var ov = document.getElementById('dialogue-overlay');
        if (ov && ov.offsetHeight && !(window.HSR && HSR.active)) ov.click();
      }catch(eA){} }, 6000);
    }catch(e){}
  };

  /* ── 💗 휴식 — 기존 문화시설 휴식(F)과 같은 연출로 전체 회복 ── */
  window.BD_minorRest = function(landmark){
    try{
      var mx = (typeof maxHP === 'function') ? maxHP()
             : (typeof getMaxHP === 'function') ? getMaxHP() : 100;
      var full = (typeof heroHP !== 'undefined') && heroHP >= mx;
      heroHP = mx;
      try{ if (window.BD){ BD.hp = BD.maxHp || BD.hp; } }catch(eB){}
      if (typeof window.BD_syncHP === 'function') BD_syncHP(heroHP, false);
      var label = String((landmark && landmark.label) || '시설');
      var isPark = /공원|광장|놀이숲|산책/.test(label);
      var isShop = /약국|마트|문구|슈퍼|편의점/.test(label);
      if (typeof showDialog === 'function'){
        showDialog('나', full
          ? ['(' + label + '에서 잠시 쉬었다. 몸도 마음도 가뿐해!)']
          : isPark ? ['(' + label + ' 벤치에 앉아 바람을 쐬며 쉬었다.)', '(체력이 모두 회복됐다!)']
          : isShop ? ['(' + label + ' 앞 의자에서 잠깐 숨을 돌렸다.)', '(사장님이 시원한 물 한 잔을 건네주셨다 — 체력이 모두 회복됐다!)']
          : ['(' + label + '에서 편안히 휴식을 즐겼다!)', '(체력이 모두 회복됐다!)']);
        setTimeout(function(){ try{
          var ov = document.getElementById('dialogue-overlay');
          if (ov && ov.offsetHeight && !(window.HSR && HSR.active)) ov.click();
        }catch(eA){} }, 6000);
      } else if (typeof bdToast === 'function'){
        bdToast('💗 ' + label + '에서 쉬었어요 — 체력 회복!');
      }
    }catch(e){}
  };
})();
