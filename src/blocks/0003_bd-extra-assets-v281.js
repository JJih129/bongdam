
/* (v281c) 신규 배치 스프라이트 11종 — 마젠타 배경 제거판.
   · 구운 에셋(__BD_BAKED_ASSETS)에 병합 + 에디터 로컬 저장소(v3/v38)에 반영.
   · v281c: 같은 id의 이전(마젠타) 데이터는 localStorage에서도 이 판으로 교체한다. */
(function(){
  var EXTRA = {"nb_park1":{"dataUrl":"data:image/webp;base64,@@B64:a6a79858_dataUrl.webp@@","name":"공원1","label":"공원1"},"nb_park2":{"dataUrl":"data:image/webp;base64,@@B64:4152879d_dataUrl.webp@@","name":"공원2","label":"공원2"},"nb_park3":{"dataUrl":"data:image/webp;base64,@@B64:3e447b31_dataUrl.webp@@","name":"공원3","label":"공원3"},"nb_parking1":{"dataUrl":"data:image/webp;base64,@@B64:67c64585_dataUrl.webp@@","name":"주차장1","label":"주차장1"},"fb_flower_shop":{"dataUrl":"data:image/png;base64,@@B64:1479973f_dataUrl.png@@","name":"꽃집·식물가게","label":"꽃집·식물가게"},"fb_local_cafe":{"dataUrl":"data:image/png;base64,@@B64:1c951d3d_dataUrl.png@@","name":"동네카페","label":"동네카페"},"fb_park_deulnyeok":{"dataUrl":"data:image/webp;base64,@@B64:f3ac4d26_dataUrl.webp@@","name":"들녘오름공원","label":"들녘오름공원"},"fb_park_life_sports":{"dataUrl":"data:image/webp;base64,@@B64:34c5661f_dataUrl.webp@@","name":"생활운동공원","label":"생활운동공원"},"fb_park_playground":{"dataUrl":"data:image/webp;base64,@@B64:57efa040_dataUrl.webp@@","name":"어린이놀이터공원","label":"어린이놀이터공원"}};
  var REV = 'v281c';
  try{
    window.__BD_BAKED_ASSETS = window.__BD_BAKED_ASSETS || {};
    Object.keys(EXTRA).forEach(function(id){
      window.__BD_BAKED_ASSETS[id] = EXTRA[id];   // 배경 제거판으로 무조건 갱신
    });
  }catch(e){}
  try{
    var done = localStorage.getItem('bd_extra_assets_rev') === REV;
    if (!done){
      var K3 = 'bongdam_rpg_editor_assets_v3';
      var raw = localStorage.getItem(K3);
      var data = raw ? JSON.parse(raw) : {};
      var map = data.assets || data;
      var byId = {};
      if (Array.isArray(map)) map.forEach(function(a){ if(a && a.id) byId[a.id] = a; });
      else byId = map || {};
      Object.keys(EXTRA).forEach(function(id){
        byId[id] = { id:id, name:EXTRA[id].name, dataUrl:EXTRA[id].dataUrl };
      });
      localStorage.setItem(K3, JSON.stringify(byId));
      var K38 = 'bongdam_rpg_editor_assets_v38';
      var raw38 = localStorage.getItem(K38);
      var arr = raw38 ? JSON.parse(raw38) : [];
      if (!Array.isArray(arr)) arr = [];
      var have = {}; arr.forEach(function(a){ if(a && a.id && EXTRA[a.id]) a.dataUrl = EXTRA[a.id].dataUrl; if(a && a.id) have[a.id]=1; });
      Object.keys(EXTRA).forEach(function(id){
        if (!have[id]) arr.push({ id:id, dataUrl:EXTRA[id].dataUrl });
      });
      localStorage.setItem(K38, JSON.stringify(arr));
      localStorage.setItem('bd_extra_assets_rev', REV);
    }
  }catch(e){}
})();
