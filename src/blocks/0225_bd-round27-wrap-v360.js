
/* (v360) 와우리 3시설 지도 좌표 수동 등록 — 배치도 아트 기준 실측값 */
(function(){
  var wire = setInterval(function(){
    try{
      /* v343 렌더가 참조하는 PATCH는 클로저 — 전역 노출이 없으므로 렌더 후 DOM 보강 대신
         BD_openSafetyMap을 감싸 렌더 직후 누락 3건의 패치를 직접 그린다 */
      if (typeof window.BD_openSafetyMap !== 'function' || window.BD_openSafetyMap.__v360) return;
      clearInterval(wire);
      var MAN = [
        { key:'봉담파출소', r:[0.9117, 0.0103, 0.0772, 0.0685] },
        { key:'드림문구',   r:[0.7419, 0.2098, 0.0497, 0.0428] },
        { key:'와우약국',   r:[0.7959, 0.2098, 0.0446, 0.0428] },
      ];
      function augment(){
        try{
          var board = document.getElementById('bd-map-v342-board');
          if (!board) return;
          var mp = null; try{ mp = BD_MapProgress.region('wawoo'); }catch(e0){}
          var unlocked = ((window.BD_PROGRESS && BD_PROGRESS.story.unlockedRegionIds) || ['wawoo']).indexOf('wawoo') >= 0;
          if (!unlocked) return;
          var vmap = {};
          try{
            var FD = BD_REGISTRY.FACILITY_DEFINITIONS;
            var vis = BD_PROGRESS.facility.visitedFacilityIds || [];
            Object.keys(FD).forEach(function(fid){
              vmap[String(FD[fid].displayName).replace(/[\s_()\-·]/g,'')] = vis.indexOf(fid) >= 0;
            });
          }catch(e1){}
          var coreDone = !!(mp && mp.core);
          MAN.forEach(function(m){
            if (board.querySelector('[data-v360="' + m.key + '"]')) return;
            var tracked = (m.key in vmap) ? vmap[m.key]
              : (function(){ for (var k in vmap){ if (k.indexOf(m.key) >= 0 || m.key.indexOf(k) >= 0) return vmap[k]; } return null; })();
            /* (v373) 시설 창을 연 기록(facilityId) 우선 — 0209 와 동일 규칙 */
            var byId = false;
            try{
              var cv = (window.BD_mapConceptVisited ? BD_mapConceptVisited() : []);
              var lmm = ((STAGES[212] || {}).__v24Landmarks || []).find(function(l){ return l && l.label && String(l.label).replace(/[\s_()\-·]/g,'').indexOf(m.key) >= 0; });
              byId = !!(lmm && lmm.facilityId && cv.indexOf(lmm.facilityId) >= 0);
            }catch(eB){}
            var visited = byId || ((tracked === null) ? (false) : tracked);
            var pd = 0.004;
            var L = (m.r[0] - pd) * 100, T = (m.r[1] - pd) * 100;
            var W = (m.r[2] + pd * 2) * 100, H = (m.r[3] + pd * 2) * 100;
            var el = document.createElement('div');
            el.setAttribute('data-v360', m.key);
            if (visited){
              /* (v368) 수동 3건(파출소·드림문구·와우약국)도 외곽 글로우 + ✓ 배지 방식으로 통일 */
              el.className = 'm42-colorpatch m42-vok';
              if (window.__BD_MAP_COLOR_PATCH_STYLE) el.style.cssText = __BD_MAP_COLOR_PATCH_STYLE(m.r[0]-pd, m.r[1]-pd, m.r[2]+pd*2, m.r[3]+pd*2);
              else el.style.cssText = 'left:' + L + '%;top:' + T + '%;width:' + W + '%;height:' + H + '%';
              el.innerHTML = '<span class="m42-vbadge">✓</span>';
              el.title = m.key + ' (방문)';
            } else {
              el.className = 'm42-dimp';
              el.style.cssText = 'left:' + L + '%;top:' + T + '%;width:' + W + '%;height:' + H + '%';
              el.title = m.key + ' — 누르면 길찾기 추적';
              el.addEventListener('click', function(){
                try{
                  var o = ((STAGES[212] || {}).__v24Landmarks || []).concat((STAGES[212] || {}).objects || [])
                    .find(function(x){ return x && x.label && String(x.label).replace(/[\s_()\-·]/g,'').indexOf(m.key) >= 0; });
                  if (o) BD_mapTrackStart(212, String(o.label).replace(/['"]/g, ''), (Number(o.rx)||0)+(Number(o.rw)||0.04)/2, (Number(o.ry)||0)+(Number(o.rh)||0.05)/2);
                }catch(e){}
              });
            }
            board.appendChild(el);
          });
        }catch(e){}
      }
      var o = window.BD_openSafetyMap;
      window.BD_openSafetyMap = function(){
        var r = o.apply(this, arguments);
        setTimeout(augment, 120);
        return r;
      };
      window.BD_openSafetyMap.__v360 = true;
      setInterval(function(){
        try{
          var d = document.getElementById('bd-map-v342');
          if (d && d.classList.contains('show')) augment();
        }catch(e){}
      }, 1600);
    }catch(e){}
  }, 400);
})();
