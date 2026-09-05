
/* (v33) NPC 전용 아트 적용 — 정면 스프라이트(내장 에셋) + LD 전신(VN 입간판)
   · 기존 월드링크 NPC 6명·안내데스크 선생님의 임시 에셋을 전용 아트로 교체 (박스 세로 유지, 가로만 이미지 비율 정합)
   · 동료 3인(세아·재이·재현)을 와우리 광장에, 밴드부 4인을 문화의집 노래방 앞에 배치 — 전부 주민 시스템(F 대화)·에디터 편집 대상
   · 대화창(VN) 화자 이름과 일치하면 LD 입간판 자동 표시 (SPEAKER_PORTRAITS 병합) */
(function(){
  'use strict';
  var FRONT = {
    "npc_front_seah": "data:image/webp;base64,@@B64:ac351d58_npc_front_seah.webp@@",
    "npc_front_jaei": "data:image/webp;base64,@@B64:9a0b841c_npc_front_jaei.webp@@",
    "npc_front_jaehyun": "data:image/webp;base64,@@B64:b7327217_npc_front_jaehyun.webp@@",
    "npc_front_eunji": "data:image/webp;base64,@@B64:26914ef9_npc_front_eunji.webp@@",
    "npc_front_dohyun": "data:image/webp;base64,@@B64:dfbe6ba7_npc_front_dohyun.webp@@",
    "npc_front_seoyeon": "data:image/png;base64,@@B64:c31fae7a_npc_front_seoyeon.png@@",
    "npc_front_haneul": "data:image/webp;base64,@@B64:ac1596ac_npc_front_haneul.webp@@",
    "npc_front_eunji_mother": "data:image/webp;base64,@@B64:f0efbb4a_npc_front_eunji_mother.webp@@",
    "npc_front_pharm_doyun": "data:image/webp;base64,@@B64:86884c7a_npc_front_pharm_doyun.webp@@",
    "npc_front_culture_teacher": "data:image/webp;base64,@@B64:a9830851_npc_front_culture_teacher.webp@@",
    "npc_front_band_guitar": "data:image/png;base64,@@B64:026162ec_npc_front_band_guitar.png@@",
    "npc_front_band_bass": "data:image/png;base64,@@B64:80a0573a_npc_front_band_bass.png@@",
    "npc_front_band_keys": "data:image/png;base64,@@B64:3d3cf1ae_npc_front_band_keys.png@@",
    "npc_front_band_drum": "data:image/png;base64,@@B64:7443baf1_npc_front_band_drum.png@@"
  };
  var DIM = {
    "npc_front_seah": [140,240],
    "npc_front_jaei": [202,240],
    "npc_front_jaehyun": [152,240],
    "npc_front_eunji": [180,240],
    "npc_front_dohyun": [139,240],
    "npc_front_seoyeon": [88,240],
    "npc_front_haneul": [240,240],
    "npc_front_eunji_mother": [143,240],
    "npc_front_pharm_doyun": [143,240],
    "npc_front_culture_teacher": [240,240],
    "npc_front_band_guitar": [103,240],
    "npc_front_band_bass": [110,240],
    "npc_front_band_keys": [121,240],
    "npc_front_band_drum": [112,240]
  };
  var LD = {
    "세아": "data:image/webp;base64,@@B64:37d7e9d1_asset.webp@@",
    "재이": "data:image/webp;base64,@@B64:8620f69b_asset.webp@@",
    "재현": "data:image/webp;base64,@@B64:f3a7f270_asset.webp@@",
    "은지": "data:image/webp;base64,@@B64:54a47630_asset.webp@@",
    "사서 도현": "data:image/webp;base64,@@B64:fede8897_asset.webp@@",
    "서연": "data:image/webp;base64,@@B64:c081507a_asset.webp@@",
    "하늘": "data:image/webp;base64,@@B64:572f1eaa_asset.webp@@",
    "은지 어머니": "data:image/webp;base64,@@B64:0b6f68e1_asset.webp@@",
    "약사 도윤": "data:image/webp;base64,@@B64:ab3b23a7_asset.webp@@",
    "문화의집 선생님": "data:image/webp;base64,@@B64:8c13923f_asset.webp@@",
    "밴드부 기타 리아": "data:image/webp;base64,@@B64:b7827ebf_asset.webp@@",
    "밴드부 베이스 준": "data:image/webp;base64,@@B64:fc411355_asset.webp@@",
    "밴드부 키보드 유나": "data:image/webp;base64,@@B64:7438ca64_asset.webp@@",
    "밴드부 드럼 태오": "data:image/webp;base64,@@B64:357a3afa_asset.webp@@"
  };

  /* ── 1) 내장 에셋 등록 (BD_getAssetImage가 BD_BUILTIN_ASSETS 폴백을 지원) ── */
  window.BD_BUILTIN_ASSETS = window.BD_BUILTIN_ASSETS || {};
  Object.keys(FRONT).forEach(function(id){
    if (!window.BD_BUILTIN_ASSETS[id]) window.BD_BUILTIN_ASSETS[id] = { id:id, name:id, dataUrl: FRONT[id] };
  });

  /* ── 2) VN 입간판 병합 ── */
  var portraitsMerged = false;
  function mergePortraits(){
    if (portraitsMerged) return true;
    try{
      if (window.BD_NPC_LD_PORTRAITS) Object.keys(LD).forEach(function(k){ window.BD_NPC_LD_PORTRAITS[k] = LD[k]; });
      // 대화창이 초상 테이블을 직접 조회하는 경로에도 지정 LD를 연결 (잘못 연결된 구 초상 교체)
      try{
        var _t = window.SPEAKER_PORTRAITS || window.BD_SPEAKER_PORTRAITS;
        if (_t) Object.keys(LD).forEach(function(k){ _t[k] = LD[k]; });
        window.BD_LD_PORTRAIT = LD;
      }catch(eS){}
      // (v35) bdSpeakerPortrait 래핑 — 내부(IIFE)의 옛 SPEAKER_PORTRAITS 사본이 우선되어
      //  선생님 입간판이 옛 그림으로 나오던 문제. 신규 LD가 있으면 무조건 우선.
      if (typeof window.bdSpeakerPortrait === 'function' && !window.bdSpeakerPortrait.__v35){
        var _orig = window.bdSpeakerPortrait;
        window.bdSpeakerPortrait = function(name){
          try{ var k = String(name||'').trim(); if (LD[k]) return LD[k]; }catch(e){}
          return _orig.apply(this, arguments);
        };
        window.bdSpeakerPortrait.__v35 = true;
        portraitsMerged = true;
      }
    }catch(e){}
    return portraitsMerged;
  }

  /* ── 3) 기존 NPC 에셋 스왑 + 신규 배치 ── */
  var SWAP = {
    bdlink_ow_npc_eunji:        'npc_front_eunji',
    bdlink_ow_npc_dohyun:       'npc_front_dohyun',
    bdlink_ow_npc_seoyeon:      'npc_front_seoyeon',
    bdlink_ow_npc_haneul:       'npc_front_haneul',
    bdlink_ow_npc_eunji_mother: 'npc_front_eunji_mother',
    bdlink_ow_npc_doyun:        'npc_front_pharm_doyun'
  };
  var NEW_NPCS = [
    { sid:212, id:'bdnpc_seah',    asset:'npc_front_seah',    name:'세아', x:0.150, y:0.372, rh:0.0448,
      lines:['야! 여기서 보네. 나 세아! 앞으로 자주 보자!','이 동네 소문은 내가 제일 빨라. 궁금한 거 있으면 물어봐.'] },
    { sid:212, id:'bdnpc_jaei',    asset:'npc_front_jaei',    name:'재이', x:0.186, y:0.384, rh:0.0448,
      lines:['…탐정 재이. 이 동네, 사건의 냄새가 난다.','수상한 건 전부 기록해 두고 있어. 너도 뭔가 보면 알려 줘.'] },
    { sid:212, id:'bdnpc_jaehyun', asset:'npc_front_jaehyun', name:'재현', x:0.262, y:0.376, rh:0.0448,
      lines:['…재현이다. 별일 없지?','위험한 데는 혼자 가지 마라. 걱정하는 건 아니고.'] },
    { sid:101, id:'bdnpc_band_guitar', asset:'npc_front_band_guitar', name:'밴드부 기타 리아', x:0.435, y:0.800, rh:0.095,
      lines:['안녕! 우리 밴드부야. 지금 합주 준비 중이야~','새 합주곡이 정해지면 제일 먼저 들려줄게!'] },
    { sid:101, id:'bdnpc_band_bass', asset:'npc_front_band_bass', name:'밴드부 베이스 준', x:0.487, y:0.803, rh:0.095,
      lines:['베이스가 없으면 노래가 허전하다구.','저음이 깔려야 다들 신이 나지.'] },
    { sid:101, id:'bdnpc_band_keys', asset:'npc_front_band_keys', name:'밴드부 키보드 유나', x:0.539, y:0.800, rh:0.095,
      lines:['악보 정리 중이야. 신청곡 있어?','연습실은 언제든 열려 있으니까 놀러 와.'] },
    { sid:101, id:'bdnpc_band_drum', asset:'npc_front_band_drum', name:'밴드부 드럼 태오', x:0.592, y:0.803, rh:0.095,
      lines:['드럼은 심장 박동! 쿵. 딱. 쿵쿵. 딱!','박자 맞춰서 걸으면 어디든 신나.'] }
  ];

  function fitW(stage, rh, assetId){
    var d = DIM[assetId]; if (!d) return rh;
    var bgW = Number(stage.bgW)||1, bgH = Number(stage.bgH)||1;
    return +(rh * (d[0]/d[1]) * (bgH/bgW)).toFixed(5);
  }
  function swapArt(stage, o, assetId){
    var w0 = Number(o.rw)||0;
    o.assetId = assetId;
    o.key = 'asset:' + assetId;
    o.customImage = true;
    var w1 = fitW(stage, Number(o.rh)||0.04, assetId);
    o.rx = +((Number(o.rx)||0) + (w0-w1)/2).toFixed(5);   // 가로 중앙 유지
    o.rw = w1;
    o.__npcArtV33 = true;
  }
  function tick(){
    try{
      if (typeof STAGES === 'undefined') return;
      mergePortraits();
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){
          if (!o || o.__npcArtV33) return;
          if (o._tut2npc){ swapArt(st, o, 'npc_front_culture_teacher'); return; }
          var target = SWAP[o._editorId];
          if (target) swapArt(st, o, target);
        });
      });
      NEW_NPCS.forEach(function(n){
        var st = STAGES[n.sid]; if (!st || !Array.isArray(st.objects)) return;
        // (v50) 삭제 툼스톤 존중 — 에디터에서 지운 NPC(세아·재이·재현·밴드부 등)는 다시 만들지 않는다
        if (Array.isArray(st.deletedSysIds) && st.deletedSysIds.indexOf(n.id) >= 0) return;
        if (st.objects.some(function(o){ return o && o._editorId === n.id; })) return;
        var rw = fitW(st, n.rh, n.asset);
        st.objects.push({
          _editorId: n.id, id: n.id, type: 'prop',
          key: 'asset:' + n.asset, assetId: n.asset, customImage: true,
          resident: true, npcName: n.name, label: n.name, npcLines: n.lines.slice(),
          rx: +(n.x - rw/2).toFixed(5), ry: +(n.y - n.rh).toFixed(5), rw: rw, rh: n.rh,
          interactable: '', __npcArtV33: true
        });
      });
    }catch(e){}
  }
  tick();
  setInterval(tick, 1200);
})();
