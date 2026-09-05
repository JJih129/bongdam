
/* ══════════════════════════════════════════════════════════════
   (v239) 맵 오브젝트 조회 API — 코드는 좌표 대신 '이름표(nameId)'만 참조한다.
   배치를 아무리 바꿔도 이 API를 쓰는 코드는 수정할 필요가 없다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  function S(){ try { return (typeof STAGES !== 'undefined') ? STAGES : null; } catch(e){ return null; } }
  function eachObj(cb){
    const st = S(); if(!st) return;
    Object.keys(st).forEach(function(sid){
      const s = st[sid];
      if(!s || !Array.isArray(s.objects) || s._archive) return;   // 보관함 제외
      s.objects.forEach(function(o, i){ if(o) cb(o, Number(sid), i, s); });
    });
  }
  function center(o){
    return { x: (o.rx || 0) + (o.rw || 0) / 2, y: (o.ry || 0) + (o.rh || 0) / 2 };
  }

  /** 이름표로 오브젝트 찾기 → {obj, stage, index} | null */
  window.BD_findObj = function(nameId){
    let found = null;
    eachObj(function(o, sid, i){ if(!found && o.nameId === nameId) found = { obj:o, stage:sid, index:i }; });
    if(!found) console.warn('[맵] 이름표를 찾을 수 없습니다:', nameId);
    return found;
  };

  /** 이름표로 중심 좌표 → {x,y,stage} | null (없으면 경고만, 크래시 없음) */
  window.BD_posOf = function(nameId, fallback){
    const f = window.BD_findObj(nameId);
    if(f){ const c = center(f.obj); c.stage = f.stage; return c; }
    if(fallback) return Object.assign({ stage:1 }, fallback);
    return null;
  };

  /** 이름표로 영역 → {rx,ry,rw,rh,stage} | null */
  window.BD_rectOf = function(nameId){
    const f = window.BD_findObj(nameId);
    if(!f) return null;
    const o = f.obj;
    return { rx:o.rx||0, ry:o.ry||0, rw:o.rw||0, rh:o.rh||0, stage:f.stage };
  };

  /** 조건으로 모두 찾기 */
  window.BD_findAll = function(pred){
    const out = [];
    eachObj(function(o, sid, i){ try{ if(pred(o, sid, i)) out.push({ obj:o, stage:sid, index:i }); }catch(e){} });
    return out;
  };

  /** 현재 등록된 이름표 전체 목록 (개발용) */
  window.BD_listIds = function(){
    const out = [];
    eachObj(function(o, sid){ if(o.nameId) out.push({ id:o.nameId, stage:sid, type:o.type, label:o.label || '' }); });
    console.table(out);
    return out;
  };

  /** 이름표 중복 검사 → 중복 목록 */
  window.BD_checkDuplicateIds = function(){
    const seen = {}, dup = [];
    eachObj(function(o, sid){
      if(!o.nameId) return;
      if(seen[o.nameId]) { dup.push({ id:o.nameId, stages:[seen[o.nameId], sid] }); }
      else seen[o.nameId] = sid;
    });
    if(dup.length) console.warn('[맵] 중복된 이름표:', dup);
    return dup;
  };
})();
