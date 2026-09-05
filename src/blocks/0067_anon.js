
/* ══ (v208) 게시용 HTML 내보내기 ══
   에디터에서 업로드한 그림(localStorage)과 배치 데이터는 이 브라우저에만 저장된다.
   이 기능은 현재 상태(에셋 + 스테이지 편집분)를 HTML 파일 안에 "구워서" 넣은
   게시용 사본을 만들어 준다 → 웹에 올리면 방문자에게 그대로 보인다. */
(function(){
  'use strict';
  var STORAGE_KEY = 'bongdam_rpg_editor_data_v5_2_quest';
  var ASSET_KEYS = ['bongdam_rpg_editor_assets_v3', 'bongdam_rpg_editor_assets_v38',
                    'bongdam_rpg_editor_assets_v37', 'bongdam_rpg_editor_assets_v35'];
  function collectAssets(){
    var out = {};
    ASSET_KEYS.forEach(function(k){
      try{
        var raw = localStorage.getItem(k); if(!raw) return;
        var p = JSON.parse(raw); var src = p.assets || p;
        if (Array.isArray(src)) src.forEach(function(a){ if(a && a.id && !out[a.id]) out[a.id] = { dataUrl: a.dataUrl || a.src }; });
        else Object.keys(src).forEach(function(id){
          var a = src[id]; if(!a || out[id]) return;
          out[id] = { dataUrl: a.dataUrl || a.src || (typeof a === 'string' ? a : null) };
        });
      }catch(e){}
    });
    Object.keys(out).forEach(function(id){ if(!out[id].dataUrl) delete out[id]; });
    return out;
  }
  function buildInject(){
    var assets = collectAssets();
    var stageRaw = null;
    // (v262) 게시용은 '지금 화면의 메모리(STAGES)'를 직접 굽는다 — JSON 백업과 동일 소스.
    //  (저장소 경유는 브라우저별 저장 이상 시 옛 데이터가 구워지는 함정이 있었다)
    try{
      if (typeof window.__bdExportableData === 'function'){
        var __md = window.__bdExportableData();
        if (__md && __md.stages){
          if (!__md.savedAt) __md.savedAt = new Date().toISOString();
          stageRaw = JSON.stringify(__md);
        }
      }
    }catch(eM){}
    try{ if (!stageRaw) stageRaw = localStorage.getItem(STORAGE_KEY); }catch(e){}
    var js = 'window.__BD_BAKED_ASSETS = ' + JSON.stringify(assets) + ';\n';
    if (stageRaw){
      // (v244) newer-wins — 예전엔 '받는 PC에 데이터가 없을 때만' 구운 데이터를 적용해서,
      //  옛 게시용을 한 번이라도 연 PC는 그 옛 데이터에 잠겨 새 내보내기가 전부 무시됐다.
      //  이제 구운 데이터가 그 PC의 데이터보다 '더 새것'이면 갱신한다.
      //  (그 PC에서 더 나중에 직접 편집·저장한 게 있으면 그쪽을 존중해 덮지 않는다)
      var bakedAt = 0;
      try{ bakedAt = Date.parse(JSON.parse(stageRaw).savedAt) || 0; }catch(e){}
      // (v246) 미리보기(샌드박스) 폴백: localStorage가 막혀도 전역 RAW로 맵이 뜨게 한다
      // (v253) 게시용 = 스냅샷 — 열면 무조건 이 파일에 구운 배치를 보여준다.
      //  (예전 newer-wins는 '옛 내용+새 시각' 데이터가 저장소에 있으면 구운 최신 배치를
      //   이기는 함정이 있었다. 게시용의 직관: 내보낸 그대로 보인다.)
      //  덮기 전 기존 데이터는 _prev 키에 자동 백업된다.
      js += 'window.__BD_BAKED_STAGE_RAW = ' + JSON.stringify(stageRaw) + ';\n' +
            'window.__BD_BAKED_AT = ' + bakedAt + ';\n' +
            'window.__BD_PUBLISH_SNAPSHOT = true;\n' +
            /* (v339) 리별 캐릭터 배율·스테이지 배율도 내보내기에 실어 받은 PC에 적용 */
            'try{ localStorage.setItem("bd_hero_scale_v98", ' + JSON.stringify(localStorage.getItem('bd_hero_scale_v98') || '{}') + '); }catch(e){}\n' +
            'try{ localStorage.setItem("bd_char_scales_v332", ' + JSON.stringify(localStorage.getItem('bd_char_scales_v332') || '{}') + '); }catch(e){}\n' +
            (window.__bdReleaseExport ? 'window.__BD_RELEASE_BUILD = true;\n' : '') +
            // (v263) 게시용 = '처음 1회만 스냅샷 적용' — 받는 사람은 내보낸 그대로 보고,
            //  그 파일에서 이어서 한 편집·JSON 복원은 껐다 켜도 유지된다.
            //  (v260의 완전 고정(FORCE)은 게시용을 작업 파일로 이어 쓰는 실사용과 충돌해 철회)
            'try{ var __bk = ' + JSON.stringify(STORAGE_KEY) + ';\n' +
            '  var __gk = __bk + "_bakeGen";\n' +
            '  var __done = 0; try{ __done = Number(localStorage.getItem(__gk)) || 0; }catch(eG){}\n' +
            // (v264) 좀비 창 자동 복구 — 다른(옛) 창이 이 스냅샷보다 과거 데이터를 덮어썼다면
            //  세대 마커와 무관하게 스냅샷을 재적용한다. (내보낸 뒤의 정상 편집은 더 새것이라 유지됨)
            '  var __curAt2 = 0; try{ var __c2 = JSON.parse(localStorage.getItem(__bk) || "null"); if(__c2) __curAt2 = Date.parse(__c2.savedAt) || 0; }catch(eC2){}\n' +
            // (v48) 정책 교정 — 내보낸 파일도 '편집 저장 시각이 스냅샷보다 최신이면 절대 덮지 않음'.
            //  (기존: 파일마다 다른 적용 마킹 불일치만으로 덮어써서, 파일을 번갈아 열면 편집이 리셋)
            '  if(__curAt2 < window.__BD_BAKED_AT){\n' +
            '    try{ var __old = localStorage.getItem(__bk);\n' +
            '      if(__old && __old !== window.__BD_BAKED_STAGE_RAW) localStorage.setItem(__bk + "_prev", __old);\n' +
            '    }catch(e2){}\n' +
            '    localStorage.setItem(__bk, window.__BD_BAKED_STAGE_RAW); window.__BD_BAKE_APPLIED = true;\n' +
            '    try{ localStorage.setItem(__gk, String(window.__BD_BAKED_AT)); }catch(eG2){}\n' +
            '  }\n' +
            '}catch(e){}\n';
      // (v245) 에셋을 실제 로더(v38)가 읽는 '배열' 형식으로 기록 — 예전엔 v3(dict)에만 써서
      //  v38 데이터가 있는 PC에선 새 이미지가 에디터에 안 떴다. 구키(v3)도 호환 유지.
      js += 'try{\n' +
            '  var __arr = Object.keys(window.__BD_BAKED_ASSETS).map(function(id){ var a = window.__BD_BAKED_ASSETS[id]; return { id: id, dataUrl: a.dataUrl }; });\n' +
            '  var __ak38 = "bongdam_rpg_editor_assets_v38";\n' +
            '  if(window.__BD_BAKE_APPLIED || !localStorage.getItem(__ak38)) localStorage.setItem(__ak38, JSON.stringify(__arr));\n' +
            '  var __ak = "bongdam_rpg_editor_assets_v3";\n' +
            '  if(window.__BD_BAKE_APPLIED || !localStorage.getItem(__ak)) localStorage.setItem(__ak, JSON.stringify({assets: window.__BD_BAKED_ASSETS}));\n' +
            '}catch(e){}\n';
    }
    return js.replace(/<\//g, '<\\/');   // script 닫는 태그 조기 종료 방지
  }
  // 마커 문자열은 반드시 조합으로 만든다 — 소스에 리터럴로 존재하면
  // 재내보내기의 제거 정규식이 이 모듈 코드를 블록으로 오인해 잘라낼 수 있다.
  var MK = '__BD_BAKED_';
  var M_SLOT  = '/*' + MK + 'SLOT__*/';
  var M_BEGIN = '/*' + MK + 'BEGIN__*/';
  var M_END   = '/*' + MK + 'END__*/';
  function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function doExport(file){
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var src = String(reader.result || '');
        if (src.indexOf(M_SLOT) < 0){
          alert('선택한 파일에서 베이크 슬롯을 찾지 못했어요.\n봉담지킴이 v208 이상 게임 HTML 파일을 선택해 주세요.');
          return;
        }
        // 이전에 구운 블록 제거 (재내보내기 지원)
        src = src.replace(new RegExp(esc(M_BEGIN) + '[\\s\\S]*?' + esc(M_END)), '');
        var inject = M_BEGIN + '\n' + buildInject() + M_END;
        src = src.replace(M_SLOT, inject + '\n' + M_SLOT);
        var blob = new Blob([src], { type: 'text/html' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        var ver = (document.title.match(/v(\d+)/) || [,'x'])[1];
        // (v240m) 파일명에 맵 데이터 저장 시각 각인 — 게시용이 여러 개 쌓였을 때
        // 어느 것이 최신인지 파일명만으로 구분되게 한다.
        var stamp = '';
        try {
          var sd = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').savedAt;
          if (sd) { var d = new Date(sd);
            var p2 = function(n){ return (n<10?'0':'')+n; };
            stamp = '_' + p2(d.getMonth()+1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()); }
        } catch(e){}
        a.download = '\uBD09\uB2F4\uC9C0\uD0B4\uC774_\uAC8C\uC2DC\uC6A9_v' + ver + stamp + '.html';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        try{ if(typeof bdToast === 'function') bdToast('\uD83C\uDF10 \uAC8C\uC2DC\uC6A9 HTML \uC0DD\uC131 \uC644\uB8CC \u2014 \uB2E4\uC6B4\uB85C\uB4DC \uD3F4\uB354 \uD655\uC778'); }catch(e){}
      }catch(err){
        alert('내보내기 실패: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  }
  function openPicker(){
    // (v240l) 내보내기 직전 강제 최신 저장 — 배치 직후 자동 저장(0.7초 디바운스)이
    //  끝나기 전에 내보내면 마지막 배치가 빠진 채 구워지던 문제 방지
    try { if (window.BongdamEditor && BongdamEditor.save) BongdamEditor.save(false); } catch(e){}
    var n = Object.keys(collectAssets()).length;
    var ok = confirm('게시용 HTML을 만듭니다.\n\n' +
      '⚠ 다음 파일 선택 창에서 반드시\n' +
      '   "지금 열려 있는 이 게임 HTML 파일"을 선택하세요.\n' +
      '   (취소하거나 다른 파일을 고르면 게시용이 만들어지지 않습니다)\n\n' +
      '업로드한 그림 ' + n + '개와 맵 배치 데이터(마지막 저장분 포함)를 구워 넣은\n' +
      '게시용 사본을 다운로드합니다. (원본은 그대로 둡니다)\n\n계속할까요?');
    if(!ok) return;
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.html,text/html';
    inp.id = 'bge-web-export-file';
    inp.style.display = 'none';
    inp.addEventListener('change', function(){ if(inp.files && inp.files[0]) doExport(inp.files[0]); inp.remove(); });
    document.body.appendChild(inp);
    inp.click();
  }
  function bind(){
    var b = document.getElementById('bge-web-export');
    if (b && !b.__bdBound){ b.__bdBound = true; b.addEventListener('click', openPicker); }
  }
  window.BD_addTick(bind, 1000); bind();
  window.BD_exportForWeb = openPicker;                   // 콘솔에서도 실행 가능
  window.__BD_buildBakedInject = buildInject;            // 테스트용
})();
