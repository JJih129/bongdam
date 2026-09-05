
/* ══════════════════════════════════════════════════════════════
   (v239) NPC 레지스트리
   기존 임현지(NPC_X/Y)·도현(QNPC_X/Y)은 전역 변수 2개로 하드코딩돼 있어
   세 번째 NPC를 놓을 수 없었다. 레지스트리로 통합하되, 기존 32곳의
   참조를 건드리지 않도록 두 명은 '거울(getter/setter)'로 연결한다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const REG = [];

  function mirror(entry, getX, setX, getY, setY){
    // 기존 전역 변수를 그대로 읽고 쓰는 거울 속성 — 32곳의 참조를 건드리지 않는다
    Object.defineProperty(entry, 'x', { enumerable:true, get:getX, set:setX });
    Object.defineProperty(entry, 'y', { enumerable:true, get:getY, set:setY });
    return entry;
  }

  // ── 기존 두 명 (거울 연결) ──
  REG.push(mirror(
    { id:'npc_hyunji', name:'임현지', stage:1, r:0.07, role:'quest', portrait:'hyunji', legacy:true },
    function(){ return (typeof NPC_X !== 'undefined') ? NPC_X : 0.42; },
    function(v){ try { NPC_X = Number(v); } catch(e){} },
    function(){ return (typeof NPC_Y !== 'undefined') ? NPC_Y : 0.78; },
    function(v){ try { NPC_Y = Number(v); } catch(e){} }
  ));

  REG.push(mirror(
    { id:'npc_dohyun', name:'사서 도현', stage:1, r:0.062, role:'quest', portrait:'dohyun', legacy:true },
    function(){ return (typeof QNPC_X !== 'undefined') ? QNPC_X : 0.58; },
    function(v){ try { QNPC_X = Number(v); } catch(e){} },
    function(){ return (typeof QNPC_Y !== 'undefined') ? QNPC_Y : 0.80; },
    function(v){ try { QNPC_Y = Number(v); } catch(e){} }
  ));

  window.BD_NPCS = REG;

  /** id로 NPC 조회 */
  window.BD_npcGet = function(id){
    for(let i=0;i<REG.length;i++){ if(REG[i].id === id) return REG[i]; }
    return null;
  };

  /** NPC 추가 (에디터·스크립트 공용). 같은 id가 있으면 갱신 */
  window.BD_npcAdd = function(def){
    if(!def || !def.id) return null;
    const cur = window.BD_npcGet(def.id);
    if(cur){ Object.keys(def).forEach(function(k){ if(k!=='id') cur[k] = def[k]; }); return cur; }
    const e = Object.assign({ stage:1, r:0.065, role:'talk' }, def);
    REG.push(e);
    return e;
  };

  window.BD_npcRemove = function(id){
    for(let i=REG.length-1;i>=0;i--){ if(REG[i].id===id && !REG[i].legacy) REG.splice(i,1); }
  };

  /** 특정 스테이지의 NPC 목록 */
  window.BD_npcsOnStage = function(stage){
    return REG.filter(function(n){ return Number(n.stage) === Number(stage); });
  };

  /** 주인공 좌표 기준 상호작용 가능한 NPC (가장 가까운 하나) */
  window.BD_npcNear = function(hx, hy, stage){
    let best = null, bestD = Infinity;
    REG.forEach(function(n){
      if(Number(n.stage) !== Number(stage)) return;
      const dx = hx - n.x, dy = hy - n.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if(d <= (n.r || 0.065) && d < bestD){ best = n; bestD = d; }
    });
    return best;
  };

  /** 스테이지에 배치된 type:'npc' 오브젝트를 레지스트리에 흡수 */
  window.BD_npcSyncFromStages = function(){
    try {
      if(typeof STAGES === 'undefined') return 0;
      let n = 0;
      Object.keys(STAGES).forEach(function(sid){
        const st = STAGES[sid];
        if(!st || !Array.isArray(st.objects) || st._archive) return;
        st.objects.forEach(function(o){
          if(!o || o.type !== 'npc') return;
          const id = o.nameId || o.npcId;
          if(!id) return;
          window.BD_npcAdd({
            id: id,
            name: o.label || o.name || id,
            stage: Number(sid),
            x: (o.rx || 0) + (o.rw || 0) / 2,
            y: (o.ry || 0) + (o.rh || 0) / 2,
            r: o.npcRadius || 0.065,
            role: o.npcRole || 'talk',
            portrait: o.portrait || null,
            dialogKey: o.dialogKey || o.note || null,
            _obj: o
          });
          n++;
        });
      });
      return n;
    } catch(e){ return 0; }
  };

  // 부팅 시 1회 흡수 (에디터 데이터 로드 이후를 노려 지연 실행)
  setTimeout(function(){ try{ window.BD_npcSyncFromStages(); }catch(e){} }, 1200);
})();
