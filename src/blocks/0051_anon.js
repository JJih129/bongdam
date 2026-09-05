
(function(){
'use strict';

// 직업별 스프라이트/약점/궁극기 정의
const CLASS_INFO = {
  // emoji: 정면(적/커맨드 아이콘용) / backEmoji: 주인공 뒷모습(포켓몬식 등 뒤 구도)
  /* (v381) 직업 제거 — heroClass 는 v270부터 'warrior' 고정(0015). 모든 조회는 || warrior 폴백 */
  warrior: { emoji:'⚔️',  backEmoji:'🧑‍🦱', name:'전사',   element:'physical', ultName:'대회전',   ultIcon:'🌀' },
};

// 직업별 색상 (뒷모습 실루엣용)
const CLASS_COLOR = {
  warrior: { body:'#b45309', hair:'#3f2a1a', gear:'#9ca3af' },
};

/** 주인공 뒷모습(포켓몬식 등 뒤 구도) SVG 생성 */
// ── (v194) 주인공 전투 LD 스프라이트 (뒷모습 대기/공격, 남녀별) ──
// selectedCharacter: 1=여자, 2=남자
const BD_HERO_BATTLE_IMGS = {
  1: { idle: "data:image/webp;base64,@@B64:8a1f7569_idle.webp@@", atk: "data:image/webp;base64,@@B64:2ac255e8_atk.webp@@" },
  2: { idle: "data:image/webp;base64,@@B64:893877c2_idle.webp@@", atk: "data:image/webp;base64,@@B64:1dae4850_atk.webp@@" },
};
function bdHeroBattleImgs(){
  const cid = (typeof selectedCharacter!=='undefined' && BD_HERO_BATTLE_IMGS[selectedCharacter]) ? selectedCharacter : 1;
  return BD_HERO_BATTLE_IMGS[cid];
}
function bdHeroBattleSpriteHTML(cls){
  const im = bdHeroBattleImgs();
  if(!im || !im.idle) return heroBackSVG(cls);   // 폴백: 기존 SVG
  return '<img id="hsr-hero-img" src="'+im.idle+'" alt="주인공" draggable="false">';
}
// 공격 순간 공격 포즈로 전환했다가 복귀
// (v240h) 납품 포즈 컷 우선: hero.pose.<성별f/m>.<kind> 슬롯이 있으면 그걸 쓴다.
//  kind: sticker/fan/wash/light/cheer/ult/hit — 없으면 기존 atk 컷 폴백.
let _bdHeroPoseTimer = null;
function bdHeroPoseSlot(kind){
  try{
    const g = (typeof selectedCharacter !== 'undefined' && selectedCharacter === 2) ? 'm' : 'f';
    return (window.BD_ASSETS && BD_ASSETS.get('hero.pose.' + g + '.' + kind)) || null;
  }catch(e){ return null; }
}
function bdHeroAtkPose(ms, kind){
  try{
    const img = document.getElementById('hsr-hero-img');
    const im = bdHeroBattleImgs();
    if(!img) return;
    // (v120) 제공된 전투 공격 컷을 최우선으로 쓴다 (없을 때만 기존 슬롯/폴백)
    var newAtk = null;
    try{ newAtk = (typeof window.BD_battleAtkSrc === 'function') ? BD_battleAtkSrc() : null; }catch(eA){}
    const slot = newAtk || bdHeroPoseSlot(kind || 'sticker');
    const src = slot || (im && im.atk);
    if(!src) return;
    var newIdle = null;
    try{ newIdle = (typeof window.BD_battleIdleSrc === 'function') ? BD_battleIdleSrc() : null; }catch(eI){}
    const restore = newIdle || (im && im.idle) || img.src;
    img.src = src;
    // (v119) 공격 포즈가 금방 사라지던 문제 —
    //  전투 UI가 다시 그려질 때(refreshHeroUI 등) 기본 이미지로 덮어써 포즈가 400ms 만에 풀렸다.
    //  포즈 유지 구간 동안에는 다시 칠해도 공격 컷을 되돌려 준다.
    window.__bdHeroPoseUntil = Date.now() + (ms || 520);
    window.__bdHeroPoseSrc = src;
    if (!window.__bdHeroPoseKeeper){
      window.__bdHeroPoseKeeper = setInterval(function(){
        try{
          if (!window.__bdHeroPoseUntil || Date.now() > window.__bdHeroPoseUntil) return;
          const cur = document.getElementById('hsr-hero-img');
          if (cur && window.__bdHeroPoseSrc && cur.src !== window.__bdHeroPoseSrc){
            cur.src = window.__bdHeroPoseSrc;      // 덮어쓰기 되돌리기
          }
        }catch(e){}
      }, 60);
    }
    if(_bdHeroPoseTimer) clearTimeout(_bdHeroPoseTimer);
    _bdHeroPoseTimer = setTimeout(()=>{
      window.__bdHeroPoseUntil = 0;
      window.__bdHeroPoseSrc = null;
      const g2 = document.getElementById('hsr-hero-img');
      if(g2) g2.src = restore;
      _bdHeroPoseTimer = null;
    }, ms || 520);
  }catch(e){}
}
/** (v240h) 피격 순간 움찔 포즈 */
function bdHeroHitPose(ms){
  try{
    const img = document.getElementById('hsr-hero-img');
    if(!img) return;
    const slot = bdHeroPoseSlot('hit');
    if(!slot) return;
    const im = bdHeroBattleImgs();
    // (v138) 피격 컷이 거의 안 보이던 문제 —
    //  대기 컷을 유지하는 감시(v120)가 곧바로 idle 로 되돌리고 있었다.
    //  공격 포즈와 같은 보호 플래그를 세워 유지 시간을 확보한다.
    var __dur = ms || 1600;
    try{
      window.__bdHeroPoseUntil = Date.now() + __dur;
      window.__bdHeroPoseSrc = slot;
    }catch(eP){}
    var newIdle = null;
    try{ newIdle = (typeof window.BD_battleIdleSrc === 'function') ? BD_battleIdleSrc() : null; }catch(eI){}
    const restore = newIdle || (im && im.idle) || img.src;
    img.src = slot;
    if(_bdHeroPoseTimer) clearTimeout(_bdHeroPoseTimer);
    _bdHeroPoseTimer = setTimeout(()=>{
      const g2 = document.getElementById('hsr-hero-img');
      if(g2) g2.src = restore;
      _bdHeroPoseTimer = null;
          try{ window.__bdHeroPoseUntil = 0; window.__bdHeroPoseSrc = null; }catch(e){}
    }, __dur);
  }catch(e){}
}
window.bdHeroHitPose = bdHeroHitPose;
window.bdHeroAtkPose = bdHeroAtkPose;
window.bdHeroBattleImgs = bdHeroBattleImgs;

function heroBackSVG(cls){
  const c = CLASS_COLOR[cls] || CLASS_COLOR.warrior;
  // 뒤통수(머리) + 어깨/등 + 직업별 등짐(장비)
  let gear = '';
  if(cls==='archer'){
    // 등에 멘 화살통 + 활
    gear = '<rect x="70" y="52" width="14" height="46" rx="6" fill="'+c.gear+'" transform="rotate(18 77 75)"/>'+
           '<line x1="78" y1="48" x2="90" y2="58" stroke="#5b3a1a" stroke-width="3"/>'+
           '<path d="M96 40 Q112 78 96 116" stroke="#7c4a1e" stroke-width="4" fill="none"/>';
  } else if(cls==='mage'){
    // 등에 멘 지팡이 + 후드 끝
    gear = '<line x1="86" y1="34" x2="104" y2="120" stroke="#5b3a1a" stroke-width="5"/>'+
           '<circle cx="105" cy="30" r="8" fill="'+c.gear+'"/>'+
           '<path d="M40 44 L64 26 L60 52 Z" fill="'+c.body+'" opacity=".85"/>';
  } else if(cls==='paladin'){
    // 등에 멘 방패
    gear = '<path d="M74 56 Q92 50 110 56 L110 84 Q92 102 74 84 Z" fill="'+c.gear+'" stroke="#94a3b8" stroke-width="2"/>'+
           '<line x1="92" y1="58" x2="92" y2="94" stroke="#94a3b8" stroke-width="2"/>';
  } else if(cls==='rogue'){
    // 후드 + 등의 교차 단검
    gear = '<path d="M46 40 Q64 20 82 40 L78 58 Q64 48 50 58 Z" fill="'+c.hair+'"/>'+
           '<line x1="66" y1="56" x2="92" y2="96" stroke="'+c.gear+'" stroke-width="4"/>'+
           '<line x1="92" y1="56" x2="66" y2="96" stroke="'+c.gear+'" stroke-width="4"/>';
  } else {
    // 전사: 등에 멘 대검
    gear = '<line x1="64" y1="40" x2="98" y2="112" stroke="'+c.gear+'" stroke-width="7"/>'+
           '<line x1="58" y1="46" x2="74" y2="54" stroke="'+c.gear+'" stroke-width="5"/>'+
           '<rect x="60" y="30" width="10" height="16" rx="3" fill="#6b7280"/>';
  }
  return '<svg viewBox="0 0 148 148" width="128" height="128" xmlns="http://www.w3.org/2000/svg">'+
      // 등/몸통 (뒤에서 본 어깨~허리)
      '<path d="M40 92 Q40 66 74 62 Q108 66 108 92 L112 138 L36 138 Z" fill="'+c.body+'"/>'+
      // 어깨 라인
      '<path d="M40 92 Q74 80 108 92" stroke="rgba(0,0,0,.25)" stroke-width="3" fill="none"/>'+
      // 뒤통수(머리)
      '<ellipse cx="74" cy="44" rx="24" ry="26" fill="'+c.hair+'"/>'+
      // 머리카락 결
      '<path d="M56 34 Q74 24 92 34" stroke="rgba(255,255,255,.12)" stroke-width="3" fill="none"/>'+
      '<path d="M74 22 L74 60" stroke="rgba(0,0,0,.2)" stroke-width="2"/>'+
      // 목
      '<rect x="66" y="62" width="16" height="10" rx="4" fill="'+c.hair+'" opacity=".7"/>'+
      gear+
    '</svg>';
}

/** 맵에 있던 허수아비 외형을 그대로 전투 스프라이트로 렌더 (오프스크린 캔버스 → dataURL) */
let _scarecrowImgCache = null;
function makeScarecrowSprite(){
  if(_scarecrowImgCache) return _scarecrowImgCache;
  // 맵의 _drawScarecrowShape 을 그대로 재사용해 동일한 외형을 그린다.
  if(typeof _drawScarecrowShape !== 'function') return null;
  const S = 8;              // 스케일 (전투용 확대 — 큰 스프라이트에서도 선명하게)
  const cw = 150*S, ch = 150*S;
  const cvs = document.createElement('canvas');
  cvs.width = cw; cvs.height = ch;
  const cx = cvs.getContext('2d');
  const baseX = cw/2;
  const baseY = ch - 18*S;
  try{
    _drawScarecrowShape(cx, baseX, baseY, S);
  }catch(e){ return null; }
  _scarecrowImgCache = cvs.toDataURL('image/png');
  return _scarecrowImgCache;
}

// ── (v158) 계열별 몬스터 도형 그리기 ──
//  좌표 규약은 _drawScarecrowShape 과 동일: (cx,cy)=바닥 중심, sc=스케일, 위로(-y) 그림.
//  '그림자'라는 컨셉에 맞춰 계열별 실루엣 + 상징 아이콘 형태로 표현.
function _drawShadowBase(ctx, cx, cy, sc, bodyColor, glowColor){
  // 바닥 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 2*sc, 20*sc, 6*sc, 0, 0, Math.PI*2); ctx.fill();
  // 은은한 오라
  const g = ctx.createRadialGradient(cx, cy-45*sc, 4*sc, cx, cy-45*sc, 46*sc);
  g.addColorStop(0, glowColor); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy-45*sc, 46*sc, 0, Math.PI*2); ctx.fill();
  // 몸통 실루엣 (물방울/유령 형태)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy-92*sc);
  ctx.bezierCurveTo(cx+34*sc, cy-84*sc, cx+30*sc, cy-18*sc, cx+16*sc, cy-8*sc);
  // 아래 물결(유령 자락)
  ctx.lineTo(cx+8*sc, cy-16*sc); ctx.lineTo(cx, cy-6*sc);
  ctx.lineTo(cx-8*sc, cy-16*sc); ctx.lineTo(cx-16*sc, cy-8*sc);
  ctx.bezierCurveTo(cx-30*sc, cy-18*sc, cx-34*sc, cy-84*sc, cx, cy-92*sc);
  ctx.closePath(); ctx.fill();
  // 눈 (두 개)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx-9*sc, cy-58*sc, 5*sc, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+9*sc, cy-58*sc, 5*sc, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx-9*sc, cy-57*sc, 2.4*sc, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+9*sc, cy-57*sc, 2.4*sc, 0, Math.PI*2); ctx.fill();
}
// 연기·소음 계열: 흐릿한 회색 연기 실루엣 + 소용돌이
function _drawSmokeShape(ctx, cx, cy, sc){
  _drawShadowBase(ctx, cx, cy, sc, 'rgba(120,124,140,0.92)', 'rgba(170,180,200,0.35)');
  ctx.strokeStyle = 'rgba(230,235,245,0.55)'; ctx.lineWidth = 2.4*sc;
  for(let k=0;k<3;k++){
    ctx.beginPath();
    ctx.arc(cx, cy-(96+k*12)*sc, (6+k*3)*sc, Math.PI*0.15, Math.PI*1.15);
    ctx.stroke();
  }
}
// 오염·정리 계열: 탁한 녹갈색 덩어리 + 방울
function _drawPolluteShape(ctx, cx, cy, sc){
  _drawShadowBase(ctx, cx, cy, sc, 'rgba(96,120,72,0.95)', 'rgba(150,190,110,0.30)');
  ctx.fillStyle = 'rgba(70,92,52,0.95)';
  [[-12,-40,5],[10,-34,4],[2,-24,6],[-6,-30,3.5]].forEach(([dx,dy,r])=>{
    ctx.beginPath(); ctx.arc(cx+dx*sc, cy+dy*sc, r*sc, 0, Math.PI*2); ctx.fill();
  });
}
// 어둠 계열: 짙은 남보라 실루엣 + 별빛
function _drawDarkShape(ctx, cx, cy, sc){
  _drawShadowBase(ctx, cx, cy, sc, 'rgba(48,44,78,0.96)', 'rgba(120,90,200,0.35)');
  ctx.fillStyle = 'rgba(220,220,255,0.85)';
  [[-16,-78],[14,-70],[0,-92],[-4,-40],[12,-48]].forEach(([dx,dy])=>{
    const x=cx+dx*sc, y=cy+dy*sc, r=1.8*sc;
    ctx.beginPath();
    ctx.moveTo(x, y-r*2); ctx.lineTo(x+r, y); ctx.lineTo(x, y+r*2); ctx.lineTo(x-r, y);
    ctx.closePath(); ctx.fill();
  });
}
const _FAMILY_DRAW = { smoke:_drawSmokeShape, pollute:_drawPolluteShape, dark:_drawDarkShape };
const _monsterImgCache = {};
// 현재 적(계열)에 맞는 전투 스프라이트 dataURL 생성 (계열별 캐시)
function makeMonsterSprite(){
  let fam = 'pollute';
  try{ const m = currentMonster(); if(m && m.fam) fam = m.fam; }catch(e){}
  if(fam === 'boss') fam = 'dark';                 // 보스는 어둠 실루엣 사용
  const drawFn = _FAMILY_DRAW[fam];
  if(typeof drawFn !== 'function') return makeScarecrowSprite();  // 폴백: 허수아비
  if(_monsterImgCache[fam]) return _monsterImgCache[fam];
  const S = 8;
  const cw = 150*S, ch = 150*S;
  const cvs = document.createElement('canvas');
  cvs.width = cw; cvs.height = ch;
  const cx = cvs.getContext('2d');
  const baseX = cw/2, baseY = ch - 18*S;
  try{ drawFn(cx, baseX, baseY, S); }catch(e){ return makeScarecrowSprite(); }
  _monsterImgCache[fam] = cvs.toDataURL('image/png');
  return _monsterImgCache[fam];
}
window.makeMonsterSprite = makeMonsterSprite;

// ── (v193) 최종 보스 「쌓여있던 위험들」 전용 3부위 스프라이트 ──
//  본체 + 양팔을 하나의 캔버스에 그리고, 팔 파괴/그로기 상태를 시각적으로 반영한다.
//  상태별 캐시(팔 생존 여부 × 그로기)로 프레임당 재생성 없음.
const _bossImgCache = {};
function _drawBossShape(c, cx, cy, sc, rDead, lDead, groggy){
  // 바닥 그림자
  c.fillStyle = 'rgba(0,0,0,0.30)';
  c.beginPath(); c.ellipse(cx, cy + 3*sc, 48*sc, 9*sc, 0, 0, Math.PI*2); c.fill();
  // 짙은 보라 오라
  const g = c.createRadialGradient(cx, cy-62*sc, 8*sc, cx, cy-62*sc, 72*sc);
  g.addColorStop(0, 'rgba(150,90,255,0.40)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy-62*sc, 72*sc, 0, Math.PI*2); c.fill();
  // ── 팔 (본체보다 먼저 = 뒤에 깔림) ──
  const drawArm = function(side, dead){
    const sx = cx + side*30*sc, sy = cy - 70*sc;      // 어깨
    if(dead){
      // 파괴된 팔: 어깨 잔해 + 흩어진 파편
      c.fillStyle = 'rgba(70,55,110,0.85)';
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(sx+side*10*sc, sy+6*sc); c.lineTo(sx+side*4*sc, sy+14*sc); c.lineTo(sx-side*4*sc, sy+9*sc);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,95,180,0.55)';
      [[14,20,3],[22,34,2.4],[10,42,2],[26,52,1.6]].forEach(function(p){
        c.beginPath(); c.arc(sx+side*p[0]*sc, sy+p[1]*sc, p[2]*sc, 0, Math.PI*2); c.fill();
      });
      return;
    }
    // 살아있는 팔: 굵은 곡선 팔뚝 + 세 갈래 발톱 + 붉은 눈
    c.strokeStyle = 'rgba(56,42,96,0.97)'; c.lineWidth = 14*sc; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy);
    c.bezierCurveTo(sx+side*30*sc, sy-6*sc, sx+side*46*sc, sy+18*sc, sx+side*50*sc, sy+46*sc);
    c.stroke();
    const hx = sx + side*50*sc, hy = sy + 46*sc;      // 손
    c.fillStyle = 'rgba(56,42,96,0.97)';
    c.beginPath(); c.arc(hx, hy, 11*sc, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(170,150,220,0.95)';
    for(let k=-1;k<=1;k++){
      c.beginPath();
      c.moveTo(hx + k*6*sc, hy + 6*sc);
      c.lineTo(hx + k*9*sc + side*3*sc, hy + 20*sc);
      c.lineTo(hx + k*6*sc + side*6*sc, hy + 7*sc);
      c.closePath(); c.fill();
    }
    // 팔뚝의 붉은 눈
    c.fillStyle = '#ff5a5a';
    c.beginPath(); c.arc(sx+side*38*sc, sy+14*sc, 3.2*sc, 0, Math.PI*2); c.fill();
    c.fillStyle = '#2a0d0d';
    c.beginPath(); c.arc(sx+side*38*sc, sy+14*sc, 1.4*sc, 0, Math.PI*2); c.fill();
  };
  drawArm(1, rDead);    // 오른팔 (화면 오른쪽)
  drawArm(-1, lDead);   // 왼팔
  // ── 본체: 대형 그림자 실루엣 ──
  c.fillStyle = 'rgba(40,32,66,0.97)';
  c.beginPath();
  c.moveTo(cx, cy-118*sc);
  c.bezierCurveTo(cx+44*sc, cy-108*sc, cx+40*sc, cy-22*sc, cx+22*sc, cy-8*sc);
  c.lineTo(cx+12*sc, cy-18*sc); c.lineTo(cx+4*sc, cy-6*sc);
  c.lineTo(cx-4*sc, cy-18*sc); c.lineTo(cx-12*sc, cy-6*sc); c.lineTo(cx-22*sc, cy-8*sc);
  c.bezierCurveTo(cx-40*sc, cy-22*sc, cx-44*sc, cy-108*sc, cx, cy-118*sc);
  c.closePath(); c.fill();
  // 양팔 파괴 시: 본체 균열 (분노 상태 시각화)
  if(rDead && lDead){
    c.strokeStyle = 'rgba(190,120,255,0.85)'; c.lineWidth = 2.2*sc; c.lineCap = 'round';
    [[[0,-112],[8,-96],[2,-84]], [[-14,-100],[-8,-84],[-16,-70]], [[16,-92],[10,-76],[18,-62]]].forEach(function(seg){
      c.beginPath(); c.moveTo(cx+seg[0][0]*sc, cy+seg[0][1]*sc);
      c.lineTo(cx+seg[1][0]*sc, cy+seg[1][1]*sc); c.lineTo(cx+seg[2][0]*sc, cy+seg[2][1]*sc);
      c.stroke();
    });
  }
  // 왕관 스파이크
  c.fillStyle = 'rgba(88,64,140,0.97)';
  [[-24,-104,-30,-126],[-12,-112,-14,-136],[0,-116,0,-144],[12,-112,14,-136],[24,-104,30,-126]].forEach(function(p){
    c.beginPath();
    c.moveTo(cx+(p[0]-5)*sc, cy+p[1]*sc);
    c.lineTo(cx+p[2]*sc, cy+p[3]*sc);
    c.lineTo(cx+(p[0]+5)*sc, cy+p[1]*sc);
    c.closePath(); c.fill();
  });
  c.fillStyle = 'rgba(200,160,255,0.9)';
  [[-30,-126],[-14,-136],[0,-144],[14,-136],[30,-126]].forEach(function(p){
    c.beginPath(); c.arc(cx+p[0]*sc, cy+p[1]*sc, 2*sc, 0, Math.PI*2); c.fill();
  });
  // ── 눈 ──
  if(groggy){
    // 그로기: X자 눈 + 어지럼 소용돌이
    c.strokeStyle = '#ffd54a'; c.lineWidth = 3*sc; c.lineCap='round';
    [[-14,-86],[14,-86]].forEach(function(p){
      const ex = cx+p[0]*sc, ey = cy+p[1]*sc, r = 5*sc;
      c.beginPath(); c.moveTo(ex-r,ey-r); c.lineTo(ex+r,ey+r); c.stroke();
      c.beginPath(); c.moveTo(ex+r,ey-r); c.lineTo(ex-r,ey+r); c.stroke();
    });
    c.strokeStyle = 'rgba(255,213,74,0.8)'; c.lineWidth = 2.4*sc;
    c.beginPath(); c.arc(cx, cy-132*sc, 8*sc, 0, Math.PI*1.5); c.stroke();
  } else {
    // 중앙 대형 눈
    c.fillStyle = '#efe6ff';
    c.beginPath(); c.ellipse(cx, cy-88*sc, 12*sc, 9.5*sc, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = '#7a3cff';
    c.beginPath(); c.arc(cx, cy-88*sc, 5.6*sc, 0, Math.PI*2); c.fill();
    c.fillStyle = '#150a26';
    c.beginPath(); c.arc(cx, cy-88*sc, 2.6*sc, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(cx-3*sc, cy-91*sc, 1.6*sc, 0, Math.PI*2); c.fill();
    // 좌우 소형 붉은 눈
    c.fillStyle = '#ff6b6b';
    [[-20,-72],[20,-72]].forEach(function(p){
      c.beginPath(); c.arc(cx+p[0]*sc, cy+p[1]*sc, 3.4*sc, 0, Math.PI*2); c.fill();
    });
    c.fillStyle = '#2a0d0d';
    [[-20,-72],[20,-72]].forEach(function(p){
      c.beginPath(); c.arc(cx+p[0]*sc, cy+p[1]*sc, 1.5*sc, 0, Math.PI*2); c.fill();
    });
  }
  // 흡수된 위험의 기운 (연기·오염·어둠 3속성 구슬)
  [['rgba(190,195,215,0.85)',-40,-118],['rgba(150,190,110,0.85)',0,-152],['rgba(150,110,230,0.85)',40,-118]].forEach(function(p){
    const og = c.createRadialGradient(cx+p[1]*sc, cy+p[2]*sc, 0.5*sc, cx+p[1]*sc, cy+p[2]*sc, 5*sc);
    og.addColorStop(0, p[0]); og.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = og;
    c.beginPath(); c.arc(cx+p[1]*sc, cy+p[2]*sc, 5*sc, 0, Math.PI*2); c.fill();
  });
}
function makeBossSprite(){
  let rDead=false, lDead=false, groggy=false;
  try{
    if(window.HSR && HSR.bossParts){
      const r = HSR.bossParts.find(function(p){return p.id==='rarm';});
      const l = HSR.bossParts.find(function(p){return p.id==='larm';});
      rDead = !!(r && r.dead); lDead = !!(l && l.dead);
      groggy = !!(HSR.enemy && HSR.enemy._groggy > 0);
    }
  }catch(e){}
  const key = 'b'+(rDead?1:0)+(lDead?1:0)+(groggy?1:0);
  if(_bossImgCache[key]) return _bossImgCache[key];
  const S = 8, cw = 150*S, ch = 150*S;
  const cvs = document.createElement('canvas');
  cvs.width = cw; cvs.height = ch;
  const c = cvs.getContext('2d');
  try{ _drawBossShape(c, cw/2, ch - 10*S, S*0.82, rDead, lDead, groggy); }
  catch(e){ return makeMonsterSprite(); }
  _bossImgCache[key] = cvs.toDataURL('image/png');
  return _bossImgCache[key];
}
window.makeBossSprite = makeBossSprite;
// 보스 스프라이트 갱신 (팔 파괴·그로기 반영)
function bdRenderBossSprite(){
  try{
    if(!window.HSR || !HSR._isBoss || !el || !el.enemySprite) return;
    const img = el.enemySprite.querySelector('img');
    if(img) img.src = makeBossSprite();
    if(el.uEnemy){
      if(HSR.enemy && HSR.enemy._groggy > 0) el.uEnemy.classList.add('bd-boss-groggy');
      else el.uEnemy.classList.remove('bd-boss-groggy');
    }
  }catch(e){}
}
window.BD_renderBossSprite = bdRenderBossSprite;
// 전투 화면 흔들림 (big=강한 흔들림)
function bdArenaShake(big){
  try{
    const a = document.getElementById('hsr-arena');
    if(!a) return;
    const cls = big ? 'bd-arena-shake-big' : 'bd-arena-shake';
    a.classList.remove('bd-arena-shake','bd-arena-shake-big');
    void a.offsetWidth;   // 애니메이션 재시작
    a.classList.add(cls);
    setTimeout(function(){ a.classList.remove(cls); }, big?750:550);
  }catch(e){}
}
window.BD_arenaShake = bdArenaShake;
// 부위 파괴 폭발 링
function bdPartBoomFx(){
  try{
    const host = (el && el.uEnemy) || document.getElementById('hsr-u-enemy');
    if(host){
      const b = document.createElement('div');
      b.className = 'bd-part-boom';
      host.appendChild(b);
      setTimeout(function(){ try{ b.remove(); }catch(e){} }, 850);
    }
  }catch(e){}
  bdArenaShake(true);
}
// 보스 등장 배너
function bdBossIntro(){
  try{
    const old = document.getElementById('bd-boss-banner');
    if(old) old.remove();
    const b = document.createElement('div');
    b.id = 'bd-boss-banner';
    b.innerHTML = '<div class="bd-boss-banner-sub">— 최종 보스 —</div>'
      + '<div class="bd-boss-banner-name">👑 쌓여있던 위험들</div>'
      + '<div class="bd-boss-banner-tip">양팔을 부수면 본체가 그로기 상태가 된다!</div>';
    document.body.appendChild(b);
    setTimeout(function(){ bdArenaShake(true); }, 350);
    setTimeout(function(){ try{ b.remove(); }catch(e){} }, 3200);
  }catch(e){}
}
window.BD_bossIntro = bdBossIntro;

// 속성 아이콘
const ELEM_ICON = {
  fire:'🔥', ice:'❄️', lightning:'⚡', wind:'🌪', quantum:'🌑', physical:'💥', water:'💧',
  W:'💨', G:'🌿', M:'🔧', N:'✨',   // (v238) 봉담 속성 아이콘 — 약점/오답 버튼 표시용 (v375) 아이 친화 아이콘
};
const ELEM_NAME = {
  fire:'화염', ice:'얼음', lightning:'번개', wind:'바람', quantum:'양자', physical:'물리', water:'물',
  W:'바람', G:'자연', M:'시설', N:'정화',   // (v238) (v375) 우리말 한 단어
};

// 허수아비의 약점 속성 (스타레일: 약점 속성으로 때리면 인성 깎임 → BREAK)
const ENEMY_WEAKNESS = ['fire','lightning','quantum'];

// ── 로스팅 개선: 계열별 몬스터 데이터 (이름·공격대사·정화 후 교육 메시지) ──
//  bdFamily(smoke/pollute/dark)에 따라 전투 연출과 교육 메시지가 달라짐
const HAZARD_MONSTERS = {
  smoke: {
    name: '담배 연기의 그림자',
    icon: '💨',
    attacks: ['{n}가 매캐한 연기를 내뿜는다!', '{n}가 돌풍을 일으킨다!', '{n}가 콜록이게 만든다!'],
    breakMsg: '{n}의 연기가 흩어졌다!',
    edu: '담배 연기는 간접흡연으로 주변 사람의 건강도 해쳐요. 특히 자라나는 청소년에게 더 위험하답니다.',
  },
  pollute: {
    name: '쓰레기 더미의 그림자',
    icon: '🗑️',
    attacks: ['{n}가 오물을 뿌린다!', '{n}가 악취를 풍긴다!', '{n}가 끈적한 것을 던진다!'],
    breakMsg: '{n}가 깨끗이 치워졌다!',
    edu: '깨진 유리나 방치된 쓰레기는 다치게 하거나 병을 옮길 수 있어요. 쓰레기는 꼭 분리수거함에 버려요.',
  },
  dark: {
    name: '어둠의 그림자',
    icon: '🌑',
    attacks: ['{n}가 섬광을 터뜨린다!', '{n}가 그림자로 덮친다!', '{n}가 시야를 가린다!'],
    breakMsg: '{n}가 빛에 사라졌다!',
    edu: '어두운 골목이나 고장난 가로등이 있는 길은 위험해요. 밝은 길로 다니고, 위험한 곳은 어른께 알려요.',
  },
  boss: {
    name: '쌓여있던 위험들',
    icon: '👑',
    attacks: ['{n}가 강력한 일격을 날린다!', '{n}가 모든 불안을 끌어모은다!', '{n}가 어둠을 퍼뜨린다!'],
    breakMsg: '{n}의 힘이 약해졌다!',
    edu: '작은 위험도 방치하면 큰 불안이 돼요. 여러분이 하나씩 정화한 덕분에 봉담이 안전해졌어요!',
  },
};
// ── 개선: 지역별 세부 위험 요소 (variant) — 기획서 10번 ──
//  같은 계열이라도 오브젝트가 hazardVariant를 지정하면 고유 이름·아이콘·교육 메시지가 나옴.
//  각 variant는 fam(계열)을 상속. 에디터에서 지정, 없으면 계열 대표 몹 사용.
// ── (v158) 변종 9종 완전 개별화 ──
//  각 variant가 고유한 [약점 weakness / 스탯 hp·spd·lv·atk·tough / 스킬 skills / 특성 trait]를 가진다.
//  · weakness : 약점 속성 배열 (없으면 계열 기본값)
//  · skills   : 적의 행동 목록. 각 skill = { name, w(가중치), power(atk배수), msg,
//               kind('atk'|'heal'|'guard'|'debuff'|'multi'), hits(연타수),
//               heal(회복%), toughUp(인성회복), tellHp(HP% 이하에서만 사용) }
//  · trait    : 패시브 특성 { id, name, desc } — enemyTrait()에서 효과 적용
const HAZARD_VARIANTS = {
  // ── 연기·소음 계열 (smoke): 회피/교란형, 약점=바람·불 ──
  cigarette: {
    fam:'smoke', name:'담배 연기의 그림자', icon:'🚬',
    weakness:['W'], hp:90, spd:98, lv:5, atk:5, tough:90,   /* (v303) 시연 밸런스 */
    trait:{ id:'smokescreen', name:'연막', desc:'HP 50% 이하가 되면 한 번 짙은 연막으로 다음 공격의 피해를 25% 줄인다.' },
    skills:[
      { name:'매캐한 연기', w:3, power:0.9, kind:'atk', msg:'{n}가 매캐한 연기를 내뿜는다!' },
      { name:'기침 유발',   w:2, power:0.6, kind:'atk', msg:'{n}가 콜록이게 만든다!' },
      { name:'짙은 연막',   w:1, power:0,   kind:'guard', toughUp:30, msg:'{n}가 몸을 연막으로 감싼다! (다음 공격을 견딘다)' },
    ],
    edu:'담배 연기는 간접흡연으로 주변 사람의 건강도 해쳐요. 청소년에게 특히 위험해요.' },
  // (v239) 소음 박쥐 → 먼지 회오리. 'W 부채질=환기'가 정답이 되도록 테마를 맞춤.
  //  기존 맵 데이터 호환을 위해 id(noise_bat)는 그대로 두고 dust 별칭을 아래에서 연결한다.
  noise_bat: {
    fam:'smoke', name:'먼지 회오리', icon:'🌫️',
    weakness:['W'], hp:75, spd:120, lv:5, atk:5, tough:70,   /* (v303) 시연 밸런스 */
    trait:{ id:'swift', name:'흩날림', desc:'가볍게 떠다녀 행동 순서가 자주 돌아온다.' },
    skills:[
      { name:'먼지 폭풍', w:3, power:0.8, kind:'atk', msg:'{n}가 먼지를 확 일으킨다!' },
      { name:'연속 흩날리기', w:2, power:0.5, kind:'multi', hits:2, msg:'{n}가 두 번 몰아친다!' },
    ],
    edu:'쌓인 먼지는 기침과 알레르기를 일으켜요. 창문을 열어 환기하고 자주 닦아내요.' },

  // (v239) 신규 배치용 별칭 — noise_bat 과 동일 개체
  get dust(){ return this.noise_bat; },

  // ── 오염·정리 계열 (pollute): 맷집형, 약점=물·물리 ──
  trash: {
    fam:'pollute', name:'쓰레기 더미의 그림자', icon:'🗑️',
    weakness:['G'], hp:95, spd:82, lv:5, atk:4, tough:120,   /* (v303) 시연 밸런스 */   /* (v291) 첫 전투 체감 완화 */
    trait:{ id:'sturdy', name:'무더기', desc:'덩치가 커서 체력이 높고 잘 무너지지 않는다.' },
    skills:[
      { name:'오물 투척',   w:3, power:0.9, kind:'atk', msg:'{n}가 오물을 뿌린다!' },
      { name:'악취',        w:2, power:0.6, kind:'atk', msg:'{n}가 악취를 풍긴다!' },
      { name:'끈적한 덩어리',w:1, power:1.2, kind:'atk', msg:'{n}가 끈적한 것을 던진다!' },
    ],
    edu:'방치된 쓰레기는 병을 옮길 수 있어요. 쓰레기는 꼭 분리수거함에 버려요.' },
  glass: {
    fam:'dark', name:'깨진 유리 조각', icon:'🔪',
    weakness:['M'], hp:70, spd:100, lv:5, atk:7, tough:60,   /* (v303) 시연 밸런스 */
    trait:{ id:'sharp', name:'날카로움', desc:'공격력이 높지만 몸이 약하다. 반격 시 자신도 조금 다친다.' },
    skills:[
      { name:'베기',       w:3, power:1.2, kind:'atk', msg:'{n}가 날카롭게 벤다!' },
      { name:'파편 튀기기', w:2, power:0.7, kind:'multi', hits:2, msg:'{n}가 유리 파편을 흩뿌린다!' },
    ],
    edu:'깨진 유리는 크게 다칠 수 있어요. 발견하면 만지지 말고 어른께 알려요.' },
  bottle: {
    fam:'dark', name:'방치된 술병', icon:'🍾',
    weakness:['M'], hp:80, spd:90, lv:5, atk:5, tough:80,   /* (v303) 시연 밸런스 */
    trait:{ id:'shatter', name:'깨짐', desc:'유리병이라 강한 충격에 약하다.' },
    skills:[
      { name:'굴러 부딪치기', w:3, power:0.9, kind:'atk', msg:'{n}가 데굴데굴 굴러 부딪친다!' },
      { name:'깨진 병 휘두르기',w:2, power:1.1, kind:'atk', msg:'{n}가 깨진 병으로 위협한다!' },
    ],
    edu:'길에 버려진 병은 깨지면 위험해요. 어른께 알리고, 병은 재활용함에 버려요.' },
  graffiti: {
    fam:'pollute', name:'낙서 괴물', icon:'🖌️',
    weakness:['G'], hp:95, spd:95, lv:5, atk:5, tough:90,   /* (v303) 시연 밸런스 */
    trait:{ id:'stain', name:'번짐', desc:'가끔 물감을 뿌려 다음 내 공격의 명중을 흐리게 만든다(피해 감소).' },
    skills:[
      { name:'물감 뿌리기', w:3, power:0.8, kind:'atk', msg:'{n}가 물감을 확 뿌린다!' },
      { name:'덧칠',        w:1, power:0,   kind:'debuff', msg:'{n}가 시야에 물감을 덧칠한다! (다음 내 공격 약화)' },
      { name:'붓 휘두르기', w:2, power:1.0, kind:'atk', msg:'{n}가 붓을 크게 휘두른다!' },
    ],
    edu:'낙서는 공공시설을 망가뜨려요. 벽이 아니라 종이나 정해진 곳에 그림을 그려요.' },
  kickboard: {
    fam:'dark', name:'길막 킥보드', icon:'🛴',
    weakness:['M'], hp:90, spd:115, lv:5, atk:6, tough:70,   /* (v303) 시연 밸런스 */
    trait:{ id:'charge', name:'돌진', desc:'속도가 빠르고, 낮은 확률로 강하게 돌진해 큰 피해를 준다.' },
    skills:[
      { name:'들이받기',   w:3, power:0.9, kind:'atk', msg:'{n}가 갑자기 들이받는다!' },
      { name:'급발진 돌진',w:1, power:1.6, kind:'atk', tellHp:100, msg:'{n}가 전속력으로 돌진한다!' },
    ],
    edu:'길을 막은 킥보드는 사람이 걸려 넘어질 수 있어요. 탈 것은 정해진 곳에 세워요.' },

  // ── 어둠 계열 (dark): 회복/지속형, 약점=불·번개(빛) ──
  streetlight: {
    fam:'dark', name:'고장난 가로등 그림자', icon:'💡',
    weakness:['M'], hp:105, spd:88, lv:5, atk:5, tough:100,   /* (v303) 시연 밸런스 */
    trait:{ id:'flicker', name:'깜빡임', desc:'HP 40% 이하가 되면 어둠을 흡수해 체력을 조금 회복한다.' },
    skills:[
      { name:'섬광',        w:3, power:0.9, kind:'atk', msg:'{n}가 섬광을 터뜨린다!' },
      { name:'어둠 흡수',   w:1, power:0,   kind:'heal', heal:0.12, tellHp:45, msg:'{n}가 어둠을 빨아들여 회복한다!' },
      { name:'시야 가리기', w:2, power:0.7, kind:'atk', msg:'{n}가 시야를 가린다!' },
    ],
    edu:'고장난 가로등은 밤길을 위험하게 해요. 발견하면 어른이나 구청에 알려요.' },
  road_crack: {
    fam:'dark', name:'부서진 도로 균열', icon:'🕳️',
    weakness:['M'], hp:130, spd:75, lv:5, atk:5, tough:130,   /* (v303) 시연 밸런스 */
    trait:{ id:'pitfall', name:'함정', desc:'단단하고 느리지만, 가끔 발을 걸어 넘어뜨리는 강한 일격을 쓴다.' },
    skills:[
      { name:'발 걸기',     w:3, power:0.8, kind:'atk', msg:'{n}가 발을 걸어 넘어뜨린다!' },
      { name:'무너뜨리기',  w:1, power:1.5, kind:'atk', msg:'{n}가 땅을 크게 무너뜨린다!' },
      { name:'돌 던지기',   w:2, power:0.9, kind:'atk', msg:'{n}가 돌덩이를 던진다!' },
    ],
    edu:'부서진 도로는 넘어지거나 다칠 수 있어요. 조심히 피하고 어른께 알려요.' },
  sign_ghost: {
    fam:'dark', name:'위험 표지판 유령', icon:'⚠️',
    weakness:['M'], hp:95, spd:92, lv:5, atk:5, tough:85,   /* (v303) 시연 밸런스 */
    trait:{ id:'warn', name:'경고', desc:'HP 30% 이하에서 마지막 경고로 강한 일격을 준비한다.' },
    skills:[
      { name:'경고음',      w:3, power:0.8, kind:'atk', msg:'{n}가 요란한 경고음을 낸다!' },
      { name:'번쩍임',      w:2, power:0.9, kind:'atk', msg:'{n}가 붉게 번쩍인다!' },
      { name:'최후의 경고', w:2, power:1.6, kind:'atk', tellHp:30, msg:'{n}가 마지막 경고를 내지른다!' },
    ],
    edu:'위험 표지판은 우리를 지켜줘요. 표지판이 알려주는 위험을 잘 살펴요.' },
  // ── (v193) 지역별 고유 위험요소 추가 ──
  dark_alley: {
    fam:'dark', name:'어두운 산책로의 그림자', icon:'🌲',
    weakness:['M'], hp:100, spd:85, lv:5, atk:5, tough:95,   /* (v303) 시연 밸런스 */
    trait:{ id:'gloom', name:'스산함', desc:'첫 턴에 몸을 어둠에 숨겨 처음 받는 피해를 20% 줄인다.' },
    skills:[
      { name:'스산한 바람', w:3, power:0.85, kind:'atk', msg:'{n}에서 스산한 바람이 불어온다!' },
      { name:'어둠 드리우기', w:2, power:0.7, kind:'atk', msg:'{n}가 그림자를 길게 드리운다!' },
      { name:'짙은 어둠', w:1, power:0, kind:'guard', toughUp:25, msg:'{n}가 어둠 속으로 몸을 숨긴다! (다음 공격을 견딘다)' },
    ],
    edu:'가로등이 없는 어두운 산책로는 밤에 위험해요. 밝은 길로 다니고, 되도록 여럿이 함께 다녀요.' },
  bicycle: {
    fam:'pollute', name:'길막 자전거', icon:'🚲',
    weakness:['G'], hp:80, spd:110, lv:5, atk:5, tough:75,   /* (v303) 시연 밸런스 */
    trait:{ id:'wheelie', name:'비틀거림', desc:'속도가 빠르지만 가끔 비틀거려 공격이 빗나간다(피해 감소).' },
    skills:[
      { name:'바퀴 굴리기', w:3, power:0.9, kind:'atk', msg:'{n}가 바퀴를 굴리며 부딪쳐 온다!' },
      { name:'페달 연타',   w:2, power:0.55, kind:'multi', hits:2, msg:'{n}가 페달을 마구 굴린다!' },
      { name:'핸들 휘두르기', w:1, power:1.3, kind:'atk', msg:'{n}가 핸들을 크게 휘두른다!' },
    ],
    edu:'인도에 아무렇게나 세워진 자전거는 보행자를 다치게 할 수 있어요. 자전거는 거치대에 세워요.' },
};
// 계열 기본값 (variant가 세부 값을 안 주면 이걸 상속)
const FAMILY_DEFAULT = {
  smoke:   { weakness:['W'], hp:170, spd:98,  atk:6, tough:90  },   // (v392) 전역 체력 상향 // (v34) 스킬 상향에 맞춘 HP 보정
  pollute: { weakness:['G'], hp:200, spd:88,  atk:6, tough:100 },   // (v392)
  dark:    { weakness:['M'], hp:200, spd:88,  atk:7, tough:100 },   // (v392)
  boss:    { weakness:['G'], hp:450 /* (v392) 최종전 체력 위주 강화 220→450 (P1 225 + 진형태 450) */, spd:100, atk:9, tough:100 },   // (v160) 기본 약점 G — 나머지 W/M은 재이의 분석으로 밝혀낼 수 있음
};
function currentMonster(){
  // 오브젝트가 variant를 지정했으면 그걸 우선
  const vid = (window.HSR && HSR.enemy && HSR.enemy.variant) ? HSR.enemy.variant : null;
  if(vid && HAZARD_VARIANTS[vid]){
    const v = HAZARD_VARIANTS[vid];
    const base = HAZARD_MONSTERS[v.fam] || HAZARD_MONSTERS.pollute;
    const dflt = FAMILY_DEFAULT[v.fam] || FAMILY_DEFAULT.pollute;
    // variant 정보로 base를 덮어씀. 스탯·약점·스킬·특성은 variant → 계열기본 순으로 채움.
    return {
      fam:v.fam, name:v.name, icon:v.icon,
      attacks:base.attacks, breakMsg:base.breakMsg, edu:v.edu,
      weakness: v.weakness || dflt.weakness,
      hp:  v.hp  != null ? v.hp  : dflt.hp,
      spd: v.spd != null ? v.spd : dflt.spd,
      atk: v.atk != null ? v.atk : dflt.atk,
      tough: v.tough != null ? v.tough : dflt.tough,
      lv:  v.lv  != null ? v.lv  : 5,
      skills: v.skills || null,
      trait:  v.trait  || null,
    };
  }
  const fam = (window.HSR && HSR.enemy && HSR.enemy.bdFamily) ? HSR.enemy.bdFamily : 'pollute';
  const m = HAZARD_MONSTERS[fam] || HAZARD_MONSTERS.pollute;
  const dflt = FAMILY_DEFAULT[fam] || FAMILY_DEFAULT.pollute;
  // 계열 대표 몹에도 기본 약점/스탯을 붙여 반환
  return Object.assign({ fam:fam, weakness:dflt.weakness, hp:dflt.hp, spd:dflt.spd, atk:dflt.atk, tough:dflt.tough, lv:5, skills:null, trait:null }, m);
}
// 현재 적의 약점 배열 (variant/계열별). 보스전은 페이즈 계열을 따름.
function enemyWeakness(){
  let base = ['G'];
  try{
    const m = currentMonster();
    if(m && Array.isArray(m.weakness) && m.weakness.length) base = m.weakness.slice();
  }catch(e){}
  // (v224) 보스 페이즈 2: 약점이 통째로 바뀐다
  try{
    if(window.HSR && HSR.enemy && Array.isArray(HSR.enemy._phaseWeak) && HSR.enemy._phaseWeak.length)
      base = HSR.enemy._phaseWeak.slice();
  }catch(e){}
  // (v160) 재이가 부여한 추가 약점 병합
  try{
    if(window.HSR && HSR.enemy && Array.isArray(HSR.enemy._extraWeak)){
      HSR.enemy._extraWeak.forEach(w=>{ if(!base.includes(w)) base.push(w); });
    }
  }catch(e){}
  return base;
}
window.enemyWeakness = enemyWeakness;
function monName(){ const m = currentMonster(); return (m.icon?m.icon+' ':'') + m.name; }
window.HSR_currentMonster = currentMonster;
window.HAZARD_MONSTERS = HAZARD_MONSTERS;
window.HAZARD_VARIANTS = HAZARD_VARIANTS;

// ── 로스팅 개선: 사운드 (외부 파일 없이 Web Audio로 생성) ──
const BDSound = (function(){
  let ctx = null;
  const SOUND_PREF_KEY = 'bongdam_guardian_sound_v1';
  function _loadSoundPref(){
    try { const v = localStorage.getItem(SOUND_PREF_KEY); return v === null ? true : v === '1'; }
    catch(e){ return true; }
  }
  function _saveSoundPref(v){ try { localStorage.setItem(SOUND_PREF_KEY, v ? '1' : '0'); } catch(e){} }
  let enabled = _loadSoundPref();  // (v131) 마지막으로 설정한 소리 ON/OFF를 기억
  function ac(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; } } return ctx; }
  // 기본 톤 재생 (주파수, 길이, 파형, 볼륨)
  function tone(freq, dur, type, vol, when){
    const c = ac(); if(!c || !enabled) return;
    const t0 = c.currentTime + (when||0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type||'sine'; osc.frequency.value = freq;
    const _sv = (typeof window.BD_sfxVol==='function') ? window.BD_sfxVol() : 1;   // (v160) 효과음 음량
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime((vol||0.15) * _sv, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0+dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0+dur+0.02);
  }
  function noise(dur, vol){
    const c = ac(); if(!c || !enabled) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<n;i++) data[i] = (Math.random()*2-1) * (1 - i/n);
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; g.gain.value = (vol||0.12) * ((typeof window.BD_sfxVol==='function') ? window.BD_sfxVol() : 1);
    src.connect(g); g.connect(c.destination); src.start();
  }
  return {
    setEnabled(v){ enabled = !!v; _saveSoundPref(enabled); },
    isEnabled(){ return enabled; },
    hit(){ noise(0.12, 0.14); tone(180, 0.12, 'square', 0.1); },        // 타격
    weakHit(){ noise(0.15, 0.16); tone(320, 0.15, 'square', 0.13); tone(480, 0.1, 'sine', 0.1, 0.05); }, // 약점 강타
    heal(){ tone(523, 0.12, 'sine', 0.12); tone(659, 0.12, 'sine', 0.12, 0.1); tone(784, 0.18, 'sine', 0.12, 0.2); }, // 회복/정화
    win(){ [523,659,784,1046].forEach((f,i)=>tone(f, 0.2, 'triangle', 0.14, i*0.12)); },   // 승리 팡파레
    lose(){ tone(392, 0.2, 'sawtooth', 0.12); tone(294, 0.3, 'sawtooth', 0.12, 0.15); tone(196, 0.5, 'sawtooth', 0.12, 0.35); }, // 패배
    select(){ tone(660, 0.06, 'square', 0.08); }, // UI 선택
  };
})();
window.BDSound = BDSound;
window.BD_toggleSound = function(){
  const on = !BDSound.isEnabled();
  BDSound.setEnabled(on);
  const btn = document.getElementById('bd-sound-btn');
  if(btn){ btn.textContent = on ? '🔊 소리 ON' : '🔇 소리 OFF'; btn.style.opacity = on ? '1' : '0.5'; }
  if(on) BDSound.select();
};

// 전투 전역 상태
const HSR = window.HSR = {
  active:false,
  cleared:false,      // 이번 방문에서 이미 이겼는지 (부활 전까지 재도전 방지용은 아님, 재도전 허용)
  raf:null,
  savedGameRaf:null,
  state:'idle',       // idle / player / enemy / anim / over
  // 유닛
  hero:{ hp:100, maxhp:100, spd:0, gauge:0, atk:12, cls:'warrior' },
  enemy:{ hp:120, maxhp:120, spd:0, gauge:0, atk:6, tough:100, maxtough:100, broken:false, breakTimer:0 },
  ult:0,              // 궁극기 게이지 0~100
  ultReady:false,
  turnOwner:null,
  spGhostTicking:false,
};

// ── DOM 핸들 ──
const $ = id => document.getElementById(id);
let el = {};
function grab(){
  el = {
    root:$('hsr-battle'),
    arena:$('hsr-arena'),
    speedTrack:$('hsr-speed-track'),
    heroName:$('hsr-hero-name'), heroCls:$('hsr-hero-cls'),
    heroHp:$('hsr-hero-hp'), heroHpText:$('hsr-hero-hptext'), heroSprite:$('hsr-hero-sprite'),
    uHero:$('hsr-u-hero'), uEnemy:$('hsr-u-enemy'),
    enemyHp:$('hsr-enemy-hp'), enemyHpText:$('hsr-enemy-hptext'),
    enemySprite:$('hsr-enemy-sprite'),
    toughWrap:$('hsr-enemy-tough-wrap'), tough:$('hsr-enemy-tough'),
    weak:$('hsr-enemy-weak'),
    turnMsg:$('hsr-turnmsg'),
    ultTrack:$('hsr-ult-track').querySelector('i'), ultPct:$('hsr-ult-pct'),
    actions:$('hsr-actions'),
    breakEl:$('hsr-break'),
    result:$('hsr-result'), resultTitle:$('hsr-result-title'),
    resultSub:$('hsr-result-sub'), resultBtn:$('hsr-result-btn'),
    stars:$('hsr-stars'),
    elemPick:$('hsr-elem-pick'),
  };
}

// ── 배경 별 애니메이션 ──
let starCtx=null, starList=[];
function initStars(){
  const c = el.stars; if(!c) return;
  c.width = window.innerWidth; c.height = window.innerHeight;
  starCtx = c.getContext('2d');
  starList = [];
  for(let i=0;i<80;i++){
    starList.push({ x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.6+.3, tw:Math.random()*Math.PI*2, sp:Math.random()*.03+.01 });
  }
}
function drawStars(){
  if(!starCtx) return;
  const c = el.stars;
  starCtx.clearRect(0,0,c.width,c.height);
  for(const s of starList){
    s.tw += s.sp;
    const a = .3 + Math.abs(Math.sin(s.tw))*.6;
    starCtx.beginPath();
    starCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    starCtx.fillStyle = 'rgba(180,210,255,'+a+')';
    starCtx.fill();
  }
}

// ── 유닛 UI 갱신 ──
function refreshHeroUI(){
  const pct = Math.max(0, HSR.hero.hp/HSR.hero.maxhp*100);
  el.heroHp.style.width = pct+'%';
  el.heroHpText.textContent = Math.ceil(HSR.hero.hp)+' / '+HSR.hero.maxhp;
}
function refreshEnemyUI(){
  const pct = Math.max(0, HSR.enemy.hp/HSR.enemy.maxhp*100);
  el.enemyHp.style.width = pct+'%';
  el.enemyHpText.textContent = Math.ceil(HSR.enemy.hp)+' / '+HSR.enemy.maxhp;
  /* (v291) 브레이크 게이지 폐지 — 바 자체를 숨긴다 */
  if (el.toughWrap) el.toughWrap.style.display = 'none';
}
window.BD_refreshUlt = function(){ try{ refreshUlt(); }catch(e){} };
window.BD_buildActions = function(){ try{ buildActions(); }catch(e){} };   // (v239) 궁극기 해금 시 버튼 재구성
function refreshUlt(){
  el.ultTrack.style.width = HSR.ult+'%';
  el.ultPct.textContent = Math.floor(HSR.ult)+'%';
  HSR.ultReady = HSR.ult >= 100;
  const ultBtn = el.actions.querySelector('.hsr-ult');
  if(ultBtn){
    ultBtn.classList.toggle('hsr-ready', HSR.ultReady);
    // 궁극기는 게이지 100%면 어느 턴에서든 활성 (적 턴 포함)
    ultBtn.classList.toggle('hsr-disabled', !HSR.ultReady || HSR.state==='over' || HSR._ultInProgress);
  }
}
function addUlt(v){
  if(window.BD_AUG){ v = Math.round(v * BD_AUG.ultGainMult()); }   // (v238) 열정 충전 증강
  HSR.ult = Math.min(100, HSR.ult + v); refreshUlt();
}

// ── 데미지 팝업 ──
function popDmg(unitEl, text, kind){
  const d = document.createElement('div');
  d.className = 'hsr-dmg '+kind;
  d.textContent = text;
  /* (v291) 치명타 강조 연출 — 일반 피해와 확연히 다른 표시 */
  if (kind === 'crit'){
    d.textContent = '💥 ' + text;
    d.style.fontSize = '34px';
    d.style.fontWeight = '900';
    d.style.color = '#ff6a3c';
    d.style.textShadow = '0 0 12px rgba(255,106,60,.85), 0 2px 0 rgba(0,0,0,.65)';
    const lbl = document.createElement('div');
    lbl.textContent = '치명타!';
    lbl.style.cssText = 'font-size:12px;font-weight:800;color:#ffd86b;letter-spacing:3px;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.8);';
    d.prepend(lbl);
  }
  const r = unitEl.getBoundingClientRect();
  const rootR = el.root.getBoundingClientRect();
  d.style.left = (r.left - rootR.left + r.width/2 - 20 + (Math.random()*30-15))+'px';
  d.style.top  = (r.top - rootR.top + 20)+'px';
  el.arena.appendChild(d);
  setTimeout(()=>d.remove(), 1000);
}
window.__bdPopDmg = popDmg;   /* (v291) QA용 노출 */

// ── 속도바(액션 게이지) 렌더 ──
function renderSpeedbar(){
  el.speedTrack.innerHTML = '';
  const mk = (cls,icon,gauge)=>{
    const p = document.createElement('div');
    p.className = 'hsr-pip '+cls;
    p.textContent = icon;
    p.style.left = (6 + gauge*0.88)+'%';
    return p;
  };
  if(!HSR.hero.ko) el.speedTrack.appendChild(mk('hsr-pip-hero','🦸', HSR.hero.gauge));
  (HSR.allies||[]).forEach(a=>{ if(!a.ko) el.speedTrack.appendChild(mk('hsr-pip-hero', a.icon, a.gauge)); });
  el.speedTrack.appendChild(mk('hsr-pip-enemy','🌾', HSR.enemy.gauge));
  if(HSR._isBoss && HSR.bossParts){
    HSR.bossParts.forEach(p=>{ if(!p.dead) el.speedTrack.appendChild(mk('hsr-pip-enemy', p.icon, p.gauge)); });
  }
}

// ── 약점 아이콘 렌더 ──
function renderWeakness(){
  el.weak.innerHTML = '';
  /* (v375) «약점» 글자 + 그림 + 우리말 칩 — 아이콘만 작게 있던 걸 한눈에 읽히게 */
  const ws = enemyWeakness();
  if (ws.length){ const lb = document.createElement('em'); lb.className = 'hsr-weak-lb'; lb.textContent = '약점'; el.weak.appendChild(lb); }
  ws.forEach(w=>{
    const s = document.createElement('span');
    s.dataset.el = w;
    s.className = 'hsr-weak-chip hsr-el-' + w;
    s.innerHTML = '<b>' + (ELEM_ICON[w] || '') + '</b><i>' + (ELEM_NAME[w] || w) + '</i>';
    s.title = ELEM_NAME[w]+' 약점';
    el.weak.appendChild(s);
  });
}
function flashWeak(elem){
  const s = el.weak.querySelector('[data-el="'+elem+'"]');
  if(s){ s.classList.add('hsr-hitweak'); setTimeout(()=>s.classList.remove('hsr-hitweak'),400); }
}

// (v159) 스킬/궁극기 롱프레스 상세 설명 툴팁
let bdLongPressFired = false;
function bdShowSkillTooltip(anchorEl, text){
  let t = document.getElementById('bd-skill-tooltip');
  if(!t){
    t = document.createElement('div');
    t.id = 'bd-skill-tooltip';
    t.style.cssText = 'position:fixed;z-index:2000;max-width:240px;background:rgba(20,14,6,0.96);'+
      'color:#f0e6c8;border:1px solid #c8902a;border-radius:8px;padding:10px 12px;font-size:13px;'+
      'line-height:1.45;box-shadow:0 6px 20px rgba(0,0,0,0.5);pointer-events:none;font-family:"Noto Serif KR",serif;';
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.style.display = 'block';
  // 위치 계산: 버튼 위쪽 중앙, 화면 밖으로 나가지 않도록 보정
  const r = anchorEl.getBoundingClientRect();
  t.style.left = '-9999px'; t.style.top = '-9999px'; // 실제 크기 측정을 위해 먼저 배치
  const tw = t.offsetWidth, th = t.offsetHeight;
  let left = r.left + r.width/2 - tw/2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  let top = r.top - th - 10;
  if(top < 8) top = r.bottom + 10;
  t.style.left = left + 'px';
  t.style.top = top + 'px';
}
function bdHideSkillTooltip(){
  const t = document.getElementById('bd-skill-tooltip');
  if(t) t.style.display = 'none';
}

// ── 커맨드 버튼 구성 ──
function buildActions(){
  const info = (typeof currentUltInfo==='function') ? currentUltInfo() : (CLASS_INFO[HSR.hero.cls] || CLASS_INFO.warrior);
  el.actions.innerHTML = '';
  const acts = [
    { cls:'hsr-basic', icon:'✨', title:'정화 스티커 [Q]',
      desc:'타이밍 링 · 횟수 무제한', fn:onBasicPurify },
    { cls:'hsr-skill', icon:'🏅', title:'배지 스킬 [E]',
      desc:'카드에서 골라 사용', fn:onBadgeSkill },
    { cls:'hsr-item', icon:'🎒', title:'아이템 [I]',
      desc:'전투 중에도 회복 가능', fn:onItemMenu },
    { cls:'hsr-flee', icon:'🏃', title:'물러나기 [ESC]',
      desc:'전투 종료 · 보스전 불가', fn:onFlee },
  ];   // (v223) 궁극기 제거 — 클래식 턴제 단순화
  // (v239) 융합 궁극기: 보스전에서 4속성을 모두 써 해금하면 상시 사용 가능
  try{
    if(window.BD && BD._ultUnlocked){
      acts.splice(2, 0, { cls:'hsr-ult', icon:'🌈', title:'모두의 마음 [1]',
        desc:'게이지 100% · 4속성 융합', fn:onUlt });
    }
  }catch(e){}
  acts.forEach(a=>{
    const b = document.createElement('div');
    b.className = 'hsr-act '+a.cls;
    b.innerHTML = '<div class="hsr-ai">'+a.icon+'</div><div class="hsr-at">'+a.title+'</div><div class="hsr-ad">'+a.desc+'</div>';
    b.onclick = ()=>{
      // 롱프레스로 상세 설명을 본 경우엔 클릭(발동)으로 이어지지 않도록 무시
      if(bdLongPressFired){ bdLongPressFired = false; return; }
      // 궁극기는 게이지만 차 있으면 어느 턴에서든 발동 (붕괴 스타레일식)
      if(a.cls==='hsr-ult'){ if(HSR.ultReady && HSR.state!=='over' && !HSR._ultInProgress) a.fn(); return; }
      // 나머지 액션은 플레이어 턴에만
      if(HSR.state==='player') a.fn();
    };
    // (v159) 궁극기 버튼: 꾹 누르고 있으면 상세 설명 툴팁 표시
    if(a.cls==='hsr-ult'){
      let pressTimer = null;
      const startPress = ()=>{
        clearTimeout(pressTimer);
        bdLongPressFired = false;
        pressTimer = setTimeout(()=>{
          bdLongPressFired = true;
          const ultInfo = (typeof currentUltInfo==='function') ? currentUltInfo() : null;
          const text = (ultInfo && ultInfo.desc)
            ? (ultInfo.ultIcon+' '+ultInfo.ultName+' — '+ultInfo.desc)
            : '상세 설명이 없습니다.';
          bdShowSkillTooltip(b, text);
        }, 450);
      };
      const endPress = ()=>{ clearTimeout(pressTimer); bdHideSkillTooltip(); };
      b.addEventListener('pointerdown', startPress);
      b.addEventListener('pointerup', endPress);
      b.addEventListener('pointerleave', endPress);
      b.addEventListener('pointercancel', endPress);
      b.addEventListener('contextmenu', (e)=>{ e.preventDefault(); }); // 모바일 롱프레스 시 메뉴 방지
    }
    el.actions.appendChild(b);
  });
  refreshUlt();
}
// ── (v147) 전투 중 아이템 사용 — HP가 위험할 때 굳이 도망치지 않아도 회복 가능하도록 ──
function onItemMenu(){
  const bd = window.BD || {};
  const items = (bd.items) || {};
  const snackCt = items.snack || 0;
  let box = document.getElementById('hsr-item-menu');
  if(!box){
    box = document.createElement('div');
    box.id = 'hsr-item-menu';
    box.style.cssText = 'position:absolute;left:50%;bottom:110px;transform:translateX(-50%);z-index:20;'
      + 'background:rgba(10,16,32,.97);border:1px solid rgba(150,180,255,.5);border-radius:12px;'
      + 'padding:10px;display:flex;gap:8px;box-shadow:0 6px 20px rgba(0,0,0,.5);'
      + 'flex-wrap:wrap;justify-content:center;max-width:min(92vw,660px);';
    (el.actions.parentElement || document.body).appendChild(box);
  }
  const mkBtn = (icon, label, ct, key, heal) => {
    const disabled = ct <= 0;
    return '<button class="hsr-item-btn" ' + (disabled ? 'disabled style="opacity:.4;cursor:not-allowed;"' : 'style="cursor:pointer;"')
      + ' onclick="' + (disabled ? '' : 'window.BD_hsrUseItem(\'' + key + '\')') + '"'
      + ' style="background:#1a2440;border:1px solid rgba(150,180,255,.4);border-radius:8px;color:#e8eefc;'
      + 'padding:8px 12px;font-size:13px;text-align:center;' + (disabled?'opacity:.4;':'') + '">'
      + icon + ' ' + label + ' (' + ct + '개)<br><span style="font-size:11px;color:#9ec1ff;">' + heal + '</span></button>';
  };
  // (v97) 상점에서 산 회복약(potion)도 전투 중 사용 가능하도록 목록에 추가
  var potionCt = (items && items.potion) || 0;
  // (v281) 편의점에서 산 회복 아이템 전 종류를 전투 소지품에 표시 —
  //  기존에는 간식(snack)·회복약(potion)만 있었고, 가방(playerInventory)의
  //  삼각김밥·반창고·샌드위치·홍삼 스틱은 전투에서 쓸 수 없었다.
  //  ☕음료(SP)·🚑구급(부활)은 v239에서 시스템이 폐지돼 죽은 버튼이라 제거.
  const inv = (typeof playerInventory !== 'undefined' && playerInventory) || {};
  const invCt = id => (inv[id] && inv[id].count) || 0;
  box.innerHTML = mkBtn('🍪','간식',snackCt,'snack','HP +40')
    + mkBtn('🧪','회복약',potionCt,'potion','HP +60')
    + mkBtn('🩹','반창고',invCt('bandage'),'fld:bandage','HP +5')
    + mkBtn('🍙','삼각김밥',invCt('rice_ball'),'fld:rice_ball','HP +20')
    + mkBtn('🥪','샌드위치',invCt('hp_potion'),'fld:hp_potion','HP +50')
    + mkBtn('🧋','홍삼 스틱',invCt('elixir'),'fld:elixir','HP 완전 회복')
    + '<button style="background:#3a2020;border:1px solid rgba(255,150,150,.4);border-radius:8px;color:#f8caca;padding:8px 12px;font-size:13px;cursor:pointer;" onclick="window.BD_hsrCloseItemMenu()">뒤로</button>';
  box.style.display = 'flex';
}
window.BD_hsrCloseItemMenu = function(){
  const box = document.getElementById('hsr-item-menu');
  if(box) box.style.display = 'none';
};
window.BD_hsrUseItem = function(key){
  window.BD_hsrCloseItemMenu();
  const isPlayer = HSR.state === 'player';
  const isAlly = HSR.state === 'ally';
  if(!isPlayer && !isAlly) return;  // 자기 턴이 아니면 무시 (안전장치)
  // (v281) 가방(playerInventory)의 회복 아이템 — 편의점 구매품을 전투에서 직접 사용
  if(key && key.indexOf('fld:') === 0){
    const fid = key.slice(4);
    const FLD = {
      bandage:   { heal:5,      icon:'🩹', nm:'반창고' },
      rice_ball: { heal:20,     icon:'🍙', nm:'삼각김밥' },
      hp_potion: { heal:50,     icon:'🥪', nm:'든든 샌드위치' },
      elixir:    { heal:'full', icon:'🧋', nm:'엄마표 홍삼 스틱' }
    };
    const f = FLD[fid]; if(!f) return;
    const inv2 = (typeof playerInventory !== 'undefined' && playerInventory) || {};
    const slot = inv2[fid];
    if(!slot || (slot.count||0) <= 0){ try{ window.BD_toast && window.BD_toast('아이템이 없어요'); }catch(e){} return; }
    const tgt2 = (isAlly && HSR.actingAlly) ? HSR.actingAlly : HSR.hero;
    if(tgt2 && tgt2.hp >= tgt2.maxhp){ try{ window.BD_toast && window.BD_toast('체력이 이미 가득해요'); }catch(e){} return; }
    slot.count--; if(slot.count <= 0) delete inv2[fid];
    const mult2 = (window.BD_AUG ? BD_AUG.itemMult() : 1);   // (v124) 든든한 간식 증강 반영
    const amt2 = (f.heal === 'full') ? (tgt2 ? tgt2.maxhp : 9999) : Math.round(f.heal * mult2);
    if(tgt2) tgt2.hp = Math.min(tgt2.maxhp, tgt2.hp + amt2);
    try{ if(!isAlly && typeof heroHP !== 'undefined'){ heroHP = tgt2 ? tgt2.hp : heroHP;
      if(typeof window.BD_syncHP === 'function') window.BD_syncHP(heroHP, true); } }catch(e){}
    try{ refreshHeroUI(); }catch(e){}
    try{ bdRefreshParty(); }catch(e){}
    try{ if(typeof renderInventory === 'function') renderInventory(); }catch(e){}
    say(f.icon + ' ' + f.nm + (f.heal==='full' ? '! 체력이 완전히 회복됐다.' : '! 체력을 회복했다.'));
    if(isAlly) afterAllyAction(); else afterPlayerAction();
    return;
  }
  // (v160) 간식은 동료 턴이면 그 동료가 회복
  if(key==='snack' && isAlly && HSR.actingAlly){
    const bd = window.BD || {}; const items = bd.items || {};
    if((items.snack||0)<=0){ try{ window.BD_toast && window.BD_toast('아이템이 없어요'); }catch(e){} return; }
    const a = HSR.actingAlly;
    if(a.hp >= a.maxhp){ try{ window.BD_toast && window.BD_toast('체력이 이미 가득해요'); }catch(e){} return; }
    items.snack--;
    a.hp = Math.min(a.maxhp, a.hp + Math.round(40 * (window.BD_AUG ? BD_AUG.itemMult() : 1)));   // (v124)
    bdRefreshParty();
    say('🍪 '+a.name+'가 간식을 먹었다! 체력을 회복했다.');
    afterAllyAction();
    return;
  }
  // (v97) 회복약(potion) — 상점 전용 아이템. 전투 중 HP 60 회복
  if(key === 'potion'){
    const bd0 = window.BD || {}; const it0 = bd0.items || {};
    if((it0.potion||0) <= 0){ try{ window.BD_toast && window.BD_toast('회복약이 없어요'); }catch(e){} return; }
    const tgt = (isAlly && HSR.actingAlly) ? HSR.actingAlly : HSR.hero;
    if(tgt && tgt.hp >= tgt.maxhp){ try{ window.BD_toast && window.BD_toast('체력이 이미 가득해요'); }catch(e){} return; }
    it0.potion--;
    var __heal = Math.round(60 * (window.BD_AUG ? BD_AUG.itemMult() : 1));   // (v124) 든든한 간식 증강
    if(tgt) tgt.hp = Math.min(tgt.maxhp, tgt.hp + __heal);
    try{ if(!isAlly && typeof heroHP !== 'undefined'){ heroHP = tgt ? tgt.hp : heroHP;
      if(typeof window.BD_syncHP === 'function') window.BD_syncHP(heroHP, true); } }catch(e){}
    try{ refreshHeroUI(); }catch(e){}
    try{ bdRefreshParty(); }catch(e){}
    say('🧪 회복약을 마셨다! 체력을 크게 회복했다.');
    if(isAlly) afterAllyAction(); else afterPlayerAction();
    return;
  }
  if(typeof window.BD_useItem !== 'function'){
    try{ if(typeof window.BD_toast==='function') window.BD_toast('지금은 아이템을 쓸 수 없어요'); }catch(e){}
    return;
  }
  const ok = window.BD_useItem(key);
  if(!ok) return;
  refreshHeroUI();
  if (typeof window.BD_updateMp === 'function') window.BD_updateMp();
  say(key === 'snack' ? '🍪 간식을 먹었다! 체력을 회복했다.' : (key==='revive' ? '🚑 구급 배지로 동료를 일으켰다!' : '☕ 음료를 마셨다! 공용 SP가 2 회복됐다.'));
  if(isAlly) afterAllyAction(); else afterPlayerAction();
};
function setActionsEnabled(on){
  el.actions.querySelectorAll('.hsr-act').forEach(b=>{
    if(b.classList.contains('hsr-ult')){
      // 궁극기는 게이지가 준비되면 어느 턴에서든 활성 (붕괴 스타레일식)
      b.classList.toggle('hsr-disabled', !HSR.ultReady || HSR.state==='over' || HSR._ultInProgress);
    } else {
      b.classList.toggle('hsr-disabled', !on);
    }
  });
}

// ── 전투 로그 메시지 ──
function say(msg){ el.turnMsg.textContent = msg; }

// ── 데미지 계산 (약점/브레이크/치명 반영) ──
function calcDamage(base, elem){
  const isWeak = enemyWeakness().includes(elem);
  let dmg = base;
  let kind = 'normal';
  // (v238) 오답 대처 속성: 피해 70% 감소 + 적 인성 회복 — 안전 지식이 곧 공략
  try{
    const _fam = ((window.__bdBD && __bdBD.currentEnemyFamily) ? __bdBD.currentEnemyFamily() : (window.BD_currentFamily || null));
    const _wr = (window.BD_WRONG && _fam) ? window.BD_WRONG[_fam] : null;
    if(_wr && elem === _wr.elem && !isWeak){
      dmg = Math.max(1, Math.round(dmg * 0.6));   // (v36) 오답 페널티 0.6 통일 (스킬 경로와 동일)
      say(_wr.msg);
      // 이후 배율(크리 등)은 건너뛰고 그대로 반환
      const _acw = (window.BD_consumeAcMult ? BD_consumeAcMult() : 1);
      // (v239) 오답(0.3) × MISS(0.5) 가 0 에 수렴하지 않도록 하한 적용
      dmg = Math.max(1, Math.round(base * Math.max(0.4, 0.6 * (_acw || 1))));   // (v36) 오답 0.6 통일
      return { dmg, kind:'wrong', isWeak:false };
    }
  }catch(e){}
  // (v158) 적 디버프('덧칠' 등): 이번 영웅 공격 약화 (1회 소비)
  if(HSR.enemy && HSR.enemy._debuffHero){
    dmg = Math.max(1, Math.round(dmg * (1 - HSR.enemy._debuffHero)));
    HSR.enemy._debuffHero = 0;
  }
  // 약점 타격 → 인성 감소 (변종 인성 최대치에 비례해 소모량 조정 → '무더기'는 덜 깎임)
  if(isWeak && !HSR.enemy.broken){
    // (v239) 인성 폐지 — 약점의 보상은 피해 배율과 PP 환급으로 준다
    const toughLoss = 0;
    dmg = Math.round(dmg*(1.25 + (window.BD_AUG ? BD_AUG.weakBonus() : 0)));   // (v238) 약점 분석 증강
    kind = 'weakhit';
    flashWeak(elem);
  }
  // 브레이크 상태 → 추가 피해
  if(HSR.enemy.broken){ dmg = Math.round(dmg*1.5); }
  // (v160) 서치라이트 표식 → 받는 피해 25% 증가
  if(HSR.enemy._marked && HSR.enemy._marked > 0){ dmg = Math.round(dmg*1.25); }
  // (v160) 재현의 약화: 방어력 20% 감소 → 받는 피해 20% 증가
  if(HSR.enemy._defDown && HSR.enemy._defDown > 0){ dmg = Math.round(dmg*1.2); }
  // 치명타(20% + 증강)  (v238)
  const _critCh = 0.05 + (window.BD_AUG ? BD_AUG.critChance() : 0);   /* (v291) 기본 5% */
  if(Math.random()<_critCh){ dmg = Math.round(dmg*(1.6 + (window.BD_AUG ? BD_AUG.critMult() : 0))); kind = 'crit'; }
  // (v124) 선제 정화 증강 — 전투 첫 공격에만 추가 배율
  try{
    if (window.BD_AUG && BD_AUG.has('first_strike') && !HSR.__bdFirstDone){
      HSR.__bdFirstDone = true;
      dmg = Math.round(dmg * BD_AUG.firstMult());
    }
  }catch(eFS){}
  // (v238) 증강 공격 배율 + 액션 커맨드(타이밍 판정) 배율
  if(window.BD_AUG){ dmg = Math.round(dmg * BD_AUG.dmgMult()); }
  if(window.BD_consumeAcMult){
    const _ac = BD_consumeAcMult();
    dmg = Math.max(1, Math.round(dmg * _ac));
    if(_ac >= 1.4 && kind === 'normal') kind = 'crit';   // (v239) PERFECT(1.5) 만 강타 연출
  }
  return { dmg, kind, isWeak };
}

// ── 적에게 피해 적용 + 연출 ──
function hitEnemy(base, elem, gaugeGain){
  // (v160) 보스전: 타겟이 팔이면 팔에 적용 (약점·인성 없음)
  const _arm = (typeof bdRouteToArm==='function') ? bdRouteToArm() : null;
  if(_arm){
    const armDmg = bdHitArm(_arm, Math.max(1, Math.round(base)));
    addUlt(gaugeGain||15);
    el.uEnemy.classList.add('hsr-shake');
    setTimeout(()=>el.uEnemy.classList.remove('hsr-shake'),400);
    return armDmg;
  }
  let { dmg, kind, isWeak } = calcDamage(base, elem);
  // (v160) 팔이 하나라도 살아있으면 본체가 받는 피해 50% 감소
  if(HSR._isBoss && typeof bdArmsAlive==='function' && bdArmsAlive()){
    dmg = Math.max(1, Math.round(dmg * 0.5));
  }
  // (v158) 적 방어태세('연막'·'짙은 연막' 등): 이번 피격 경감 (1회 소비)
  if(HSR.enemy && HSR.enemy._guardNext){
    dmg = Math.max(1, Math.round(dmg * (1 - HSR.enemy._guardNext)));
    HSR.enemy._guardNext = 0;
  }
  HSR.enemy.hp = Math.max(0, HSR.enemy.hp - dmg);
  el.enemySprite.parentElement.classList.remove('hsr-shake');
  void el.enemySprite.offsetWidth;
  el.uEnemy.classList.add('hsr-shake');
  setTimeout(()=>el.uEnemy.classList.remove('hsr-shake'),400);
  popDmg(el.uEnemy, dmg, kind);
  if(window.BD_FX) BD_FX.onHit(kind, el.uEnemy);   // (v238) 타격 연출 팩
  // (v240h) 납품 피격 시트(속성별·약점 크리티컬) + PERFECT 링 플레어(판정 1회 소비)
  try{ if(window.BD_FX && BD_FX.hitSheet) BD_FX.hitSheet(elem, !!isWeak); }catch(e){}
  try{
    if(window.__bdMgGrade === 'PERFECT'){ window.__bdMgGrade = 'PERFECT_FX';
      if(window.BD_FX && BD_FX.perfectFlare) BD_FX.perfectFlare(); }
  }catch(e){}
  addUlt(gaugeGain||15);
  refreshEnemyUI();
  /* (v291) 브레이크 시스템 폐지 — v239에서 toughLoss=0으로 사실상 죽어 있던 것을 정식 제거 */
  return dmg;
}

function triggerBreak(){
  HSR.enemy.broken = true;
  HSR.enemy.breakTimer = 2;   // 2턴간 브레이크 유지
  el.breakEl.classList.remove('hsr-play'); void el.breakEl.offsetWidth;
  el.breakEl.classList.add('hsr-play');
  el.breakEl.style.opacity = 1;
  say('💥 약점 격파! ' + (window.BD_josaN||function(t,n){return String(t).split('{n}').join(n);})((typeof currentMonster==='function'?currentMonster().breakMsg:'{n}가 무력화됐다!'), (typeof monName==='function'?monName():'적')));
  // 브레이크 즉발 피해 ('깨짐' 특성이면 대폭 증가)
  setTimeout(()=>{
    let brk = 25 + (window.BD_AUG ? BD_AUG.breakBonus() : 0);   // (v238) 균열 확대 증강
    // (v239) 인성 격파 = 탄약 재보급. 전 스킬 PP +1
    try{
      if(window.BD_PP){
        const _g = BD_PP.restoreAll(1);
        if(_g.length) say('스킬 횟수가 하나씩 돌아왔어요');
        if(window.BD_DAMI_TIPS) BD_DAMI_TIPS.onBreak();   // (v239)
      }
    }catch(e){}
    try{ if(HSR.enemy._trait && HSR.enemy._trait.id === 'shatter'){ brk = 55; say('🍾 산산조각! 병이 크게 부서졌다!'); } }catch(e){}
    HSR.enemy.hp = Math.max(0, HSR.enemy.hp - brk);
    popDmg(el.uEnemy, brk, 'weakhit');
    refreshEnemyUI();
    checkEnemyDead();
  }, 500);
}

// ── 플레이어 행동들 ──
let pendingBasic = false;
function onBasic(){
  // 속성 선택 팝업
  openElemPick();
}
function openElemPick(){
  el.elemPick.innerHTML = '';
  const info = CLASS_INFO[HSR.hero.cls] || CLASS_INFO.warrior;
  // 선택 가능한 속성: 직업 기본 + 약점 3종을 항상 노출
  const _weak = enemyWeakness();
  // (v238) 오답 대처 속성을 함정 선택지로 노출 — 올바른 대처를 고르는 재미
  const _wr = window.BD_WRONG
              ? (window.BD_WRONG[((window.__bdBD && __bdBD.currentEnemyFamily) ? __bdBD.currentEnemyFamily() : (window.BD_currentFamily || null))]||{}).elem : null;
  const choices = Array.from(new Set([info.element, ..._weak, _wr, 'physical'].filter(Boolean)));
  choices.forEach(elem=>{
    const b = document.createElement('div');
    b.className = 'hsr-elem-btn' + (_weak.includes(elem)?' hsr-isweak':'');
    b.textContent = ELEM_ICON[elem];
    b.title = ELEM_NAME[elem];
    b.onclick = ()=>{ closeElemPick(); doBasicWith(elem); };
    el.elemPick.appendChild(b);
  });
  el.elemPick.classList.add('hsr-show3');
  say('공격 속성을 선택하세요 — 빛나는 속성이 올바른 대처! (잘못 고르면 역효과)');   // (v238)
  setActionsEnabled(false);
}
function closeElemPick(){ el.elemPick.classList.remove('hsr-show3'); }

function doBasicWith(elem){
  // (v238) 액션 커맨드: 줄어드는 링 타이밍에 맞춰 배율 결정 후 실제 공격
  if(window.BD_MG){
    HSR.state = 'anim'; setActionsEnabled(false);
    BD_MG.run('ring', {}, function(mult){ window.__bdAcMult = mult; _doBasicCore(elem); });
    return;
  }
  _doBasicCore(elem);
}
function _doBasicCore(elem){
  HSR.state = 'anim';
  try{ var __uh=document.querySelector('.hsr-hero'); if(__uh) __uh.classList.add('hsr-lunge-r'); }catch(e){} bdHeroAtkPose(1100, (window.BD && BD.equippedSkill) || 'sticker');
  try{ setTimeout(function(){ try{ var __u2=document.querySelector('.hsr-hero'); if(__u2) __u2.classList.remove('hsr-lunge-r'); }catch(e2){} }, 700); }catch(e){}
  const base = HSR.hero.atk;
  setTimeout(()=>{
    hitEnemy(base, elem, 18);
    say(ELEM_NAME[elem]+' 평타!');
    afterPlayerAction();
  }, 220);
}

// ── 봉담: 정화 공격 (무속성 기본, 상성 배율 없음) ──
function onBasicPurify(){
  // (v239) 정화 공격 = 「정화 스티커」 스킬. 예전엔 여기서 hitEnemy 를 직접 불러
  //  타이밍 미니게임과 PP 를 통째로 우회했다 — 그러면 아무도 미니게임을 하지 않는다.
  try {
    const sk = (window.BD_SKILLS || []).find(s => s.id === 'sticker');
    if (sk && typeof window.BD_useSkill === 'function'){
      // (v239 수정) useSkill 은 _afterActionCb 가 걸려 있어야 턴을 끝낸다.
      //  이걸 빠뜨려 state 가 'anim' 에 멈추고 적 턴이 오지 않던 버그.
      if (typeof window.BD_openSkillFor === 'function') window.BD_openSkillFor(function(){ afterPlayerAction(); });
      window.BD_useSkill(sk);
      return;
    }
  } catch(e){}
  // 폴백: 스킬 정의를 못 찾은 경우에만 직타
  HSR.state='anim';
  try{ var __uh=document.querySelector('.hsr-hero'); if(__uh) __uh.classList.add('hsr-lunge-r'); }catch(e){} bdHeroAtkPose(1100, (window.BD && BD.equippedSkill) || 'sticker');
  try{ setTimeout(function(){ try{ var __u2=document.querySelector('.hsr-hero'); if(__u2) __u2.classList.remove('hsr-lunge-r'); }catch(e2){} }, 700); }catch(e){}
  let base = (window.BD && window.BD.atk) ? window.BD.atk : HSR.hero.atk;
  if(HSR.hero.atkUp>0) base = Math.round(base*1.3);
  setTimeout(()=>{
    hitEnemy(base, 'N', 20);
    say('✨ 정화 스티커! 불안한 기운을 약화시켰다.');
    afterPlayerAction();
  }, 220);
}
// ── 봉담: 배지 스킬 (장착된 스킬 하나만 발동) ──
/* (v240g) 배지 스킬 [E] — 즉시 시전 대신 전용 카드 메뉴를 연다.
   보유 스킬이 없으면 "아직 없어요" 안내를 보여주고, 습득하면 카드가 채워진다. */
function BD_skillMenuOwned(){
  try{
    var ids = (window.BD && BD.unlockedSkills) || [];
    return ids.filter(function(id){ return id !== 'sticker'; })
              .map(function(id){ return (window.BD_SKILLS||[]).find(function(s){ return s.id===id; }); })
              .filter(Boolean);
  }catch(e){ return []; }
}
function BD_closeSkillMenu(){
  var m = document.getElementById('hsr-skill-menu');
  if(m) m.remove();
}
window.BD_closeSkillMenu = BD_closeSkillMenu;   // (v35) 인라인 onclick이 전역을 찾지 못해 '닫기'가 죽어 있던 문제
window.BD_castBadgeSkill = function(id){
  BD_closeSkillMenu();
  if(HSR.state !== 'player') return;
  var sk = (window.BD_SKILLS||[]).find(function(s){ return s.id===id; });
  if(!sk || typeof window.BD_useSkill !== 'function') return;
  if(window.BD_PP && !BD_PP.canUse(sk.id)){ say('「'+sk.name+'」 는 이번 판에서 다 썼어요 — 다른 카드를 골라요'); return; }
  if(typeof window.BD_openSkillFor==='function') window.BD_openSkillFor(function(){ afterPlayerAction(); });
  HSR.state='anim';
  setActionsEnabled(false);
  // (v240h) 런지·포즈는 useSkill(미니게임 이후 실제 시전 시점)에서 일괄 처리 — 이중 연출 방지
  window.BD_useSkill(sk);
};
function onBadgeSkill(){
  // 토글: 이미 열려 있으면 닫기
  var existing = document.getElementById('hsr-skill-menu');
  if(existing){ existing.remove(); return; }
  var owned = BD_skillMenuOwned();
  var box = document.createElement('div');
  box.id = 'hsr-skill-menu';
  box.style.cssText = 'position:absolute;left:50%;bottom:190px;transform:translateX(-50%);'
    + 'display:flex;flex-direction:column;gap:8px;min-width:280px;max-width:min(92vw,420px);'
    + 'background:#fefdf9;border:1px solid #e4ddcf;border-radius:14px;'
    + 'box-shadow:0 10px 28px rgba(0,0,0,.4);padding:14px 16px;z-index:60;';
  var head = '<div style="font-weight:700;color:#3a2c18;font-size:14px;">🏅 배지 스킬 카드</div>';
  if(!owned.length){
    box.innerHTML = head
      + '<div style="color:#7a684c;font-size:13px;line-height:1.6;padding:6px 0 2px;">'
      +   '아직 배지 스킬이 없어요.<br>각 동네의 위험을 정화하고 주민을 도우면,<br>그 동네의 <b style="color:#3a2c18">정화법이 카드로</b> 쌓여요!'
      + '</div>'
      + '<button onclick="BD_closeSkillMenu()" style="margin-top:6px;align-self:flex-end;background:#ece5d6;'
      +   'border:1px solid #d8cfba;border-radius:8px;color:#5b4a33;padding:6px 14px;cursor:pointer;">닫기</button>';
  } else {
    var cards = owned.map(function(sk){
      var left = '';
      try{ var g = BD_PP.get(sk.id); left = (g===Infinity) ? '∞' : (g + '회'); }catch(e){}
      var dead = false;
      try{ dead = window.BD_PP && !BD_PP.canUse(sk.id); }catch(e){}
      return '<button ' + (dead ? 'disabled' : '') + ' onclick="BD_castBadgeSkill(\'' + sk.id + '\')"'
        + ' style="display:flex;align-items:center;gap:10px;text-align:left;'
        + 'background:' + (dead ? '#f1ece0' : '#fff') + ';border:1px solid #e2d7c0;border-radius:10px;'
        + 'padding:9px 12px;cursor:' + (dead?'not-allowed':'pointer') + ';' + (dead?'opacity:.55;':'') + '">'
        + '<span style="font-size:22px;">' + (sk.icon||'🏅') + '</span>'
        + '<span style="flex:1;"><b style="color:#3a2c18;font-size:13px;">' + sk.name + '</b>'
        + '<br><span style="color:#8a7a5e;font-size:11px;">' + (sk.desc||'') + '</span></span>'
        + '<span style="color:#1f8a52;font-weight:700;font-size:12px;">' + left + '</span>'
        + '</button>';
    }).join('');
    box.innerHTML = head + cards
      + '<button onclick="BD_closeSkillMenu()" style="margin-top:4px;align-self:flex-end;background:#ece5d6;'
      +   'border:1px solid #d8cfba;border-radius:8px;color:#5b4a33;padding:6px 14px;cursor:pointer;">닫기</button>';
  }
  (el.root || document.body).appendChild(box);
}

function onSkill(){
  const info = CLASS_INFO[HSR.hero.cls] || CLASS_INFO.warrior;
  HSR.state='anim';
  try{ var __uh=document.querySelector('.hsr-hero'); if(__uh) __uh.classList.add('hsr-lunge-r'); }catch(e){} bdHeroAtkPose(1100, (window.BD && BD.equippedSkill) || 'sticker');
  try{ setTimeout(function(){ try{ var __u2=document.querySelector('.hsr-hero'); if(__u2) __u2.classList.remove('hsr-lunge-r'); }catch(e2){} }, 700); }catch(e){}
  setTimeout(()=>{
    // 스킬은 직업 속성으로 2회 타격
    hitEnemy(Math.round(HSR.hero.atk*1.3), info.element, 22);
    setTimeout(()=>{
      hitEnemy(Math.round(HSR.hero.atk*0.9), info.element, 8);
      say(info.name+' 스킬 발동!');
      afterPlayerAction();
    }, 260);
  }, 220);
}

function onUlt(){
  if(!HSR.ultReady) return;
  if(HSR.state==='over') return;
  if(HSR._ultInProgress) return;   // 중복 발동 방지
  if(typeof bdHideSkillTooltip==='function') bdHideSkillTooltip();
  // (v159) 지킴이 배지 스킬 기반 필살기 — 장착된 스킬(무속성/A/B/C)에 따라 달라짐
  const info = (typeof currentUltInfo==='function') ? currentUltInfo() : { id:'sticker', elem:'N', ultName:'다 같이 정화', ultIcon:'✨', hits:1, hitPower:2.4, selfHealPct:0.15 };
  // 붕괴 스타레일식: 궁극기는 현재 턴/상태와 무관하게 즉시 발동.
  // 발동 전 상태를 저장해 두고, 끝나면 원래 흐름으로 복귀한다.
  const prevState = HSR.state;
  HSR._ultInProgress = true;
  HSR.ult = 0; HSR.ultReady=false; refreshUlt();
  // (v235) 속도 게이지 폐지(v224)로 pauseGauge() 는 더 이상 존재하지 않는다.
  HSR.state='anim';
  setActionsEnabled(false);
  say('⚡ 궁극기 · '+info.ultName+'! (기습 발동)');
  try{ var __uh=document.querySelector('.hsr-hero'); if(__uh) __uh.classList.add('hsr-lunge-r'); }catch(e){} bdHeroAtkPose(900, 'ult');
  try{ setTimeout(function(){ try{ var __u2=document.querySelector('.hsr-hero'); if(__u2) __u2.classList.remove('hsr-lunge-r'); }catch(e2){} }, 700); }catch(e){}
  flashScreen();
  // (v240h) 융합 궁극기 대형 이펙트 (개별 궁은 해당 스킬 시트)
  try{ if(window.BD_FX && BD_FX.skillSheet) BD_FX.skillSheet(info.id==='fusion' ? 'ult' : info.id); }catch(e){}
  // 배지 속성 상성(무속성/A/B/C 취약·저항)을 그대로 반영해 타격
  const family = (typeof currentEnemyFamily==='function') ? currentEnemyFamily() : null;
  const mult = (typeof multiplier==='function') ? multiplier(info.elem, family) : 1;
  const totalHits = info.hits || 1;
  let hits=0;
  const striker = ()=>{
    const base = Math.round((BD.atk||HSR.hero.atk||14) * info.hitPower * mult);
    if(typeof window.HSR_hitEnemyRaw==='function'){ window.HSR_hitEnemyRaw(base, 0); }
    else { hitEnemy(base, info.elem==='N'?'physical':info.elem, 0); }
    hits++;
    if(hits<totalHits){ setTimeout(striker, 220); }
    else {
      // 필살기별 추가 효과
      try{
        if(info.selfHealPct && window.BD){
          const heal = Math.round((BD.maxHp||100) * info.selfHealPct);
          BD.hp = Math.min(BD.maxHp||100, (BD.hp||0) + heal);
          if(typeof HSR!=='undefined'){ HSR.hero.hp = Math.min(HSR.hero.maxhp||BD.maxHp||100, (HSR.hero.hp||0) + heal); }
          if(typeof window.BD_syncHP === 'function') window.BD_syncHP(HSR.hero.hp, false);
          if(typeof refreshHeroUI==='function') refreshHeroUI();
          say('💚 정화의 온기 — HP ' + heal + ' 회복!');
        }
        if(info.clearGuard && HSR.enemy){ HSR.enemy._guardNext = 0; say('🛡 적의 방어 태세를 해제했다!'); }
        if(info.mark && HSR.enemy){ HSR.enemy._marked = 2; say('🔦 표식! 2턴간 받는 피해가 25% 증가한다.'); }
      }catch(e){}
      setTimeout(()=>afterUlt(prevState), 300);
    }
  };
  setTimeout(striker, 220);
}
// 궁극기 종료 후: 발동 전 상태로 복귀 (적 턴/게이지 흐름 방해 안 함)
function afterUlt(prevState){
  HSR._ultInProgress = false;
  refreshEnemyUI();
  // 궁극기로 적이 죽었으면 전투 종료 처리
  if(checkEnemyDead()) return;
  if(prevState==='player'){
    // 플레이어 턴 중 발동: 궁극기는 턴을 소비하지 않고, 다시 플레이어가 행동 가능
    HSR.state='player';
    setActionsEnabled(true);
  } else if(prevState==='enemy'){
    // 적 턴 중 발동: 궁극기 끝나면 적 턴을 이어서 진행
    HSR.state='enemy';
    setTimeout(()=>{ try{ resumeEnemyAfterUlt(); }catch(e){ resumeGauge(); } }, 300);
  } else {
    // 게이지/기타 상태 중 발동: 게이지 흐름 재개
    setTimeout(()=>{ resumeGauge(); }, 300);
  }
}
// 적 턴 도중 궁극기가 끼어든 경우, 적 행동을 이어서 실행
function resumeEnemyAfterUlt(){
  if(HSR.state==='over') return;
  // 적 턴을 다시 진행 (적이 아직 안 죽었으면)
  if(HSR.enemy.hp > 0){ enemyTurn(); }
  else { resumeGauge(); }
}

window.BD_onFlee = function(){ try{ console.info('[v364] BD_onFlee 실행'); onFlee(); }catch(e){ try{ console.info('[v364] onFlee 예외 ' + e); }catch(e2){} } };   // (v364) 물러나기 외부 진입점
function onFlee(){
  // 로스팅 개선: 보스전에서는 물러나기 불가 (기획서 12번)
  if(HSR._isBoss){
    say('최종 보스와의 전투에서는 물러날 수 없다!');
    return;
  }
  say('전투에서 물러났다...');
  setTimeout(()=>endBattle(false, true), 500);
}

function flashScreen(){
  const f = document.createElement('div');
  f.style.cssText='position:absolute;inset:0;background:#fff;opacity:.7;z-index:8;pointer-events:none;transition:opacity .5s;';
  el.arena.appendChild(f);
  requestAnimationFrame(()=>{ f.style.opacity=0; });
  setTimeout(()=>f.remove(),500);
}

// ── 플레이어 행동 후 처리 ──
function afterPlayerAction(){
  refreshEnemyUI();
  if(checkEnemyDead()) return;
  // 이 턴 소비 → 게이지 0, 다시 채워지기 시작
  HSR.hero.gauge = 0;
  // (v160) 주인공 행동 종료 → 보호막/버프 지속 감소
  if(HSR.hero.shieldActs>0){ HSR.hero.shieldActs--; if(HSR.hero.shieldActs<=0) HSR.hero.shield=0; }
  if(HSR.hero.atkUp>0) HSR.hero.atkUp--;
  if(HSR.hero.spdUp>0) HSR.hero.spdUp--;
  renderSpeedbar();
  HSR.state = 'anim';
  setActionsEnabled(false);
  // 잠깐 뒤 액션게이지 재개
  setTimeout(()=>{ resumeGauge(); }, 500);
}

// ── (v158) 적 스킬 선택기 ──
//  현재 몹의 skills 목록에서 (HP 조건 통과 + 가중치) 로 하나를 고른다.
//  skills 없으면 기존 3단 랜덤과 동일한 기본 스킬셋을 만들어 반환한다.
function pickEnemySkill(){
  const mon = (typeof currentMonster==='function') ? currentMonster() : null;
  let skills = (mon && Array.isArray(mon.skills) && mon.skills.length) ? mon.skills : null;
  if(!skills){
    const atks = (mon && mon.attacks) ? mon.attacks : ['{n}의 강타!','{n}가 휘두른다!','{n}의 견제!'];
    skills = [
      { name:'강타', w:1, power:1.2, kind:'atk', msg:atks[0] },
      { name:'공격', w:2, power:1.0, kind:'atk', msg:atks[1] },
      { name:'견제', w:2, power:0.7, kind:'atk', msg:atks[2] },
    ];
  }
  const hpPct = HSR.enemy.hp / (HSR.enemy.maxhp||1) * 100;
  // tellHp: 지정된 값 이하일 때만 후보에 포함 (강한 마무리 기술 등)
  let pool = skills.filter(s => s.tellHp == null || hpPct <= s.tellHp);
  if(!pool.length) pool = skills.filter(s => s.tellHp == null);
  if(!pool.length) pool = skills;
  let total = pool.reduce((a,s)=>a + (s.w||1), 0);
  let r = Math.random() * total;
  for(const s of pool){ r -= (s.w||1); if(r <= 0) return s; }
  return pool[pool.length-1];
}
// (v158) 적에게 들어오는 피해에 방어/최후의저항 등 기존 감산을 적용
function _applyIncomingReductions(dmg){
  if(window.BD_AUG){ dmg = Math.max(1, Math.round(dmg * BD_AUG.incomingMult())); }   // (v238) 두꺼운 장갑 증강
  try {
    if (typeof window.BD_armorBonus === 'function') {
      let reduce = window.BD_armorBonus();
      // (v160) 같은 계열 보호구: 해당 피해 25% 추가 감소
      if (typeof window.BD_protectorReduction === 'function' && typeof currentEnemyFamily === 'function') {
        reduce += window.BD_protectorReduction(currentEnemyFamily());
      }
      reduce = Math.min(0.6, reduce);
      dmg = Math.max(1, Math.round(dmg * (1 - reduce)));
    }
  } catch(e){}
  try {
    const hpRatio = HSR.hero.hp / (HSR.hero.maxhp || 100);
    if (hpRatio <= 0.10 && typeof window.BD_getLastStandReduction === 'function') {
      const lsReduce = Math.min(0.6, window.BD_getLastStandReduction());
      dmg = Math.max(1, Math.round(dmg * (1 - lsReduce)));
    }
  } catch(e){}
  return dmg;
}
// (v158) 영웅이 한 대 맞았을 때의 공통 처리 (HP반영·연출·게임오버 체크). return true면 사망.
function _heroTakeHit(dmg){
  HSR.hero.hp = Math.max(0, HSR.hero.hp - dmg);
  if(typeof window.BD_syncHP === 'function') window.BD_syncHP(HSR.hero.hp, false);
  el.uHero.classList.add('hsr-shake');
  setTimeout(()=>el.uHero.classList.remove('hsr-shake'),400);
  popDmg(el.uHero, dmg, 'enemyhit');
  try{ if(window.bdHeroHitPose) window.bdHeroHitPose(1600); }catch(e){}   // (v240h) 피격 포즈 컷 (window 경유 — 스코프 밖 정의)
  addUlt(5);   // (v160) 피격: 필살 게이지 +5
  refreshHeroUI();
  if(HSR.hero.hp<=0){
    // (v160) 동료가 살아있으면 주인공만 행동불능, 전투는 계속
    if(!HSR.hero.ko){
      HSR.hero.ko = true;
      say('💫 주인공이 행동불능이 되었다!');
      try{ el.uHero.style.filter='grayscale(0.8)'; el.uHero.style.opacity='0.55'; }catch(e){}
      bdCheckWipe();
    }
    return true;
  }
  try {
    const ratio = HSR.hero.hp / (HSR.hero.maxhp || 100);
    if (ratio <= 0.35 && !window.__bdBattleHealTipShown) {
      window.__bdBattleHealTipShown = true;
      setTimeout(function(){ try{ say('⚠ 체력이 위험해요! 🎒 아이템(I)으로 전투 중에도 회복할 수 있어요.'); }catch(e){} }, 500);
    }
  } catch(e){}
  return false;
}
// (v158) 적 턴 종료 공통 처리
function _endEnemyTurn(){
  // (v160) 적 디버프(방어·속도 감소) 턴 카운트다운
  if(HSR.enemy._defDown && HSR.enemy._defDown>0) HSR.enemy._defDown--;
  if(HSR.enemy._spdDown && HSR.enemy._spdDown>0) HSR.enemy._spdDown--;
  HSR.enemy.gauge = 0; renderSpeedbar();
  setTimeout(()=>{ el.uEnemy.classList.remove('hsr-turn'); resumeGauge(); }, 400);
}

// ============================================================
// (v160) 파티 다인원 전투 엔진
//  - HSR.allies: 합류한 동료(세아/재이/재현) 전투 액터
//  - 캐릭터별 개별 필살기 게이지, 공용 SP, 보호막/버프/디버프
//  - 행동불능(KO)·전멸 처리
// ============================================================
function bdBuildParty(){
  HSR.allies = [];
  // (v239) 동료(파티) 시스템 폐지 — 지킴이 혼자 싸운다.
  //  실제로 합류하는 동료가 없는데 UI·아이템·스킬만 남아 혼란만 줬다.
  const _PARTY_DISABLED = true;
  try{
    const members = _PARTY_DISABLED ? [] : ((typeof window.BD_joinedMembers==='function') ? window.BD_joinedMembers() : []);
    const saved = (window.BD && BD.partyState) || {};
    members.forEach(k=>{
      const st = saved[k.id] || {};
      HSR.allies.push({
        id:k.id, name:k.name, icon:k.icon, kit:k,
        maxhp:k.hp, hp:(typeof st.hp==='number') ? Math.max(0,Math.min(k.hp,st.hp)) : k.hp,
        atk:k.atk, spd:k.spd,
        gauge:0, ult:0, ko:!!st.ko || (typeof st.hp==='number' && st.hp<=0),
        shield:0, shieldActs:0, atkUp:0, spdUp:0,
      });
    });
  }catch(e){}
  // 주인공에게도 버프/보호막 필드 준비
  HSR.hero.shield=0; HSR.hero.shieldActs=0; HSR.hero.atkUp=0; HSR.hero.spdUp=0; HSR.hero.ko=false;
  HSR.hero.icon='🦸'; HSR.hero.name=(typeof heroName!=='undefined'?heroName:'지킴이');
}
function bdLivingAllies(){ return (HSR.allies||[]).filter(a=>!a.ko); }
function bdAllMembers(){ return [HSR.hero].concat(HSR.allies||[]); }
function bdLivingMembers(){ return bdAllMembers().filter(a=>!a.ko); }
function bdActorSpd(a){ return a.spd * (a.spdUp>0 ? 1.25 : 1); }
function bdActorAtk(a){ return a.atk * (a.atkUp>0 ? 1.3 : 1); }
window.BD_heroAtkMult = function(){ return (HSR.hero && HSR.hero.atkUp>0) ? 1.3 : 1; };

// ── 파티 스트립 UI (화면 왼쪽) ──
function bdPartyStrip(){
  let s = document.getElementById('bd-party-strip');
  if(!s){
    s = document.createElement('div');
    s.id = 'bd-party-strip';
    s.style.cssText = 'position:fixed;left:12px;top:50%;transform:translateY(-50%);z-index:1200;'
      +'display:flex;flex-direction:column;gap:8px;width:172px;';
    (el.root||document.body).appendChild(s);
  }
  return s;
}
function bdRemovePartyStrip(){ const s=document.getElementById('bd-party-strip'); if(s) s.remove(); }
function bdRefreshParty(){
  if(!HSR.active) return;
  const s = bdPartyStrip();
  let html = '';
  (HSR.allies||[]).forEach((a,i)=>{
    const hpPct = Math.max(0, a.hp/a.maxhp*100);
    const ultReady = a.ult>=100 && !a.ko;
    html += '<div class="bd-ally-card" data-ai="'+i+'" style="background:rgba(13,17,28,0.92);border:1px solid '
      + (a.ko ? '#663' : (HSR.actingAlly===a ? '#ffd54a' : 'rgba(120,140,180,0.35)'))
      + ';border-radius:10px;padding:8px 10px;'+(a.ko?'opacity:0.55;filter:grayscale(0.7);':'')+'">'
      + '<div style="display:flex;align-items:center;gap:6px;color:#e7ecf5;font-size:13px;font-weight:700;">'
      + '<span style="font-size:16px;">'+a.icon+'</span>'+a.name
      + (a.ko?'<span style="color:#ff8a8a;font-size:11px;margin-left:auto;">행동불능</span>':'')
      + (a.shield>0?'<span style="color:#7dd3fc;font-size:11px;margin-left:auto;">🛡'+a.shield+'</span>':'')
      + '</div>'
      + '<div style="height:6px;background:rgba(255,255,255,0.12);border-radius:3px;margin-top:5px;overflow:hidden;">'
      + '<i style="display:block;height:100%;width:'+hpPct+'%;background:'+(hpPct>35?'#4ade80':'#f87171')+';"></i></div>'
      + '<div style="color:#9fb0c8;font-size:10px;margin-top:2px;">'+Math.ceil(a.hp)+' / '+a.maxhp
      + (a.atkUp>0?' <span style="color:#fca5a5">⚔↑</span>':'') + (a.spdUp>0?' <span style="color:#a5f3fc">💨↑</span>':'') + '</div>'
      + '<div style="display:flex;align-items:center;gap:5px;margin-top:4px;">'
      + '<div style="flex:1;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">'
      + '<i style="display:block;height:100%;width:'+Math.min(100,a.ult)+'%;background:linear-gradient(90deg,#a78bfa,#f472b6);"></i></div>'
      + (ultReady ? '<button class="bd-ally-ult-btn" data-ai="'+i+'" style="border:1px solid #f472b6;background:rgba(244,114,182,0.15);color:#f9a8d4;border-radius:6px;font-size:10px;padding:2px 6px;cursor:pointer;">'+(a.kit.ult.icon||'⚡')+' 필살</button>' : '<span style="color:#8b93a7;font-size:10px;">'+Math.floor(a.ult)+'%</span>')
      + '</div></div>';
  });
  s.innerHTML = html;
  s.querySelectorAll('.bd-ally-ult-btn').forEach(btn=>{
    btn.onclick = (e)=>{ e.stopPropagation(); const a = HSR.allies[parseInt(btn.dataset.ai,10)]; if(a) bdAllyUlt(a); };
  });
}

// ── 대상/선택 팝업 공용 ──
function bdChoicePopup(title, opts, cb){
  let m = document.getElementById('bd-choice-pop');
  if(m) m.remove();
  m = document.createElement('div');
  m.id = 'bd-choice-pop';
  m.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2400;'
    +'background:rgba(15,19,32,0.97);border:1px solid #c8902a;border-radius:12px;padding:16px 18px;min-width:250px;'
    +'box-shadow:0 10px 40px rgba(0,0,0,0.6);';
  let html = '<div style="color:#ffd54a;font-weight:800;font-size:15px;margin-bottom:10px;text-align:center;">'+title+'</div>';
  opts.forEach((o,i)=>{
    html += '<button class="bd-cp-btn" data-i="'+i+'" '+(o.disabled?'disabled':'')+' style="display:block;width:100%;margin:6px 0;padding:9px 12px;'
      +'background:'+(o.disabled?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.07)')+';border:1px solid rgba(255,255,255,0.2);'
      +'border-radius:8px;color:'+(o.disabled?'#667':'#e7ecf5')+';font-size:13px;cursor:'+(o.disabled?'default':'pointer')+';text-align:left;">'
      + '<b>'+o.label+'</b>' + (o.sub?('<br><span style="font-size:11px;color:#9fb0c8;">'+o.sub+'</span>'):'') + '</button>';
  });
  html += '<button class="bd-cp-cancel" style="display:block;width:100%;margin-top:8px;padding:6px;background:none;border:none;color:#8b93a7;font-size:12px;cursor:pointer;">취소</button>';
  m.innerHTML = html;
  document.body.appendChild(m);
  m.querySelectorAll('.bd-cp-btn').forEach(b=>{
    if(b.disabled) return;
    b.onclick = ()=>{ m.remove(); cb(parseInt(b.dataset.i,10)); };
  });
  m.querySelector('.bd-cp-cancel').onclick = ()=>{ m.remove(); cb(-1); };
}
function bdPickMember(title, cb){
  const list = bdLivingMembers();
  bdChoicePopup(title, list.map(a=>({ label:(a.icon||'')+' '+(a.name||'지킴이'), sub:'HP '+Math.ceil(a.hp)+' / '+a.maxhp })), (i)=>{
    if(i<0){ cb(null); return; }
    cb(list[i]);
  });
}

// ── 공통: 아무 아군이나 피격 (보호막 흡수 → HP → KO → 전멸 체크) ──
function bdAnyTakeHit(target, dmg){
  if(!target) return false;
  // 보호막 흡수
  if(target.shield>0){
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed; dmg -= absorbed;
    if(target===HSR.hero){ say('🛡 보호막이 '+absorbed+' 피해를 흡수했다!'); }
  }
  if(dmg<=0){ bdRefreshParty(); refreshHeroUI(); return false; }
  if(target===HSR.hero){
    return _heroTakeHit(dmg);
  }
  target.hp = Math.max(0, target.hp - dmg);
  target.ult = Math.min(100, target.ult + 5);   // 피격 게이지 +5
  bdRefreshParty();
  if(target.hp<=0 && !target.ko){
    target.ko = true;
    say('💫 '+target.name+'가 행동불능이 되었다!');
    bdRefreshParty();
    bdCheckWipe();
  }
  return false;
}
function bdCheckWipe(){
  if(HSR.state==='over') return;
  const anyAlive = bdLivingMembers().length > 0;
  if(!anyAlive){ setTimeout(()=>endBattle(false,false), 700); }
}
// 승리/종료 시 파티 상태 저장
function bdPersistParty(){
  try{
    if(!window.BD) return;
    BD.partyState = BD.partyState || {};
    (HSR.allies||[]).forEach(a=>{ BD.partyState[a.id] = { hp:Math.max(0,Math.round(a.hp)), ko:!!a.ko }; });
    if(typeof window.BD_save==='function') window.BD_save();
  }catch(e){}
}
window.BD_healParty = function(){
  try{
    if(!window.BD) return;
    BD.partyState = BD.partyState || {};
    Object.keys(window.BD_PARTY||{}).forEach(id=>{
      const k = window.BD_PARTY[id];
      BD.partyState[id] = { hp:k.hp, ko:false };
    });
  }catch(e){}
};

// ============================================================
// (v160) 최종 보스 3부위 시스템 — 본체 + 오른팔 + 왼팔
// ============================================================
function bdLivingParts(){ return (HSR.bossParts||[]).filter(p=>!p.dead); }
function bdArmsAlive(){ return bdLivingParts().length > 0; }
// 부위 스트립 UI (적 정보창 아래) — 클릭으로 공격 대상 지정
function bdBossStrip(){
  let s = document.getElementById('bd-boss-strip');
  if(!s){
    s = document.createElement('div');
    s.id = 'bd-boss-strip';
    s.style.cssText = 'position:fixed;right:12px;top:90px;z-index:1200;display:flex;flex-direction:column;gap:6px;width:200px;';
    (el.root||document.body).appendChild(s);
  }
  return s;
}
function bdRemoveBossStrip(){ const s=document.getElementById('bd-boss-strip'); if(s) s.remove(); }
function bdRefreshBossParts(){
  if(!HSR.active || !HSR._isBoss || !HSR.bossParts){ bdRemoveBossStrip(); return; }
  const s = bdBossStrip();
  const row = (id, icon, name, hp, maxhp, dead)=>{
    const on = HSR.bossTarget===id;
    const pct = Math.max(0, hp/maxhp*100);
    return '<div class="bd-boss-part" data-pid="'+id+'" style="cursor:'+(dead?'default':'pointer')+';background:rgba(28,13,13,0.92);'
      + 'border:1.5px solid '+(dead?'#553':(on?'#ffd54a':'rgba(200,120,120,0.4)'))+';border-radius:9px;padding:6px 9px;'
      + (dead?'opacity:0.45;filter:grayscale(0.8);':'') + '">'
      + '<div style="display:flex;align-items:center;gap:6px;color:#f5e7e7;font-size:12px;font-weight:700;">'
      + '<span>'+icon+'</span>'+name
      + (on&&!dead?'<span style="margin-left:auto;color:#ffd54a;font-size:10px;">🎯 공격 대상</span>':'')
      + (dead?'<span style="margin-left:auto;color:#977;font-size:10px;">파괴됨</span>':'')
      + '</div>'
      + '<div style="height:5px;background:rgba(255,255,255,0.12);border-radius:3px;margin-top:4px;overflow:hidden;">'
      + '<i style="display:block;height:100%;width:'+pct+'%;background:#f87171;"></i></div>'
      + '</div>';
  };
  let html = '<div style="color:#ffb4b4;font-size:11px;font-weight:700;">부위를 눌러 공격 대상 선택</div>';
  html += row('body','🌑','본체'+(bdArmsAlive()?' (팔 보호 중 -50%)':''), HSR.enemy.hp, HSR.enemy.maxhp, false);
  HSR.bossParts.forEach(p=>{ html += row(p.id, p.icon, p.name, p.hp, p.maxhp, p.dead); });
  s.innerHTML = html;
  s.querySelectorAll('.bd-boss-part').forEach(div=>{
    div.onclick = ()=>{
      const pid = div.dataset.pid;
      if(pid!=='body'){ const p = HSR.bossParts.find(x=>x.id===pid); if(!p || p.dead) return; }
      HSR.bossTarget = pid;
      const nm = pid==='body' ? '본체' : (HSR.bossParts.find(x=>x.id===pid)||{}).name;
      say('🎯 공격 대상: '+nm);
      bdRefreshBossParts();
    };
  });
}
// 팔 피해 적용 (약점·인성 없음, 단순 HP)
function bdHitArm(part, dmg){
  if(!part || part.dead) return 0;
  part.hp = Math.max(0, part.hp - dmg);
  try{ popDmg(el.uEnemy, dmg, 'normal'); }catch(e){}
  if(part.hp<=0 && !part.dead){
    part.dead = true;
    HSR.enemy._groggy = (HSR.enemy._groggy||0) + 1;   // 그로기 1회
    say('💥 '+part.name+' 파괴! 본체가 그로기 상태 — 다음 행동 1회 취소!');
    // (v193) 부위 파괴 연출: 폭발 링 + 강한 흔들림 + 팔 사라진 스프라이트로 갱신
    try{ bdPartBoomFx(); }catch(e){}
    setTimeout(function(){ try{ bdRenderBossSprite(); }catch(e){} }, 250);
    if(!bdArmsAlive()){
      setTimeout(()=>{ say('🛡 양팔이 모두 파괴됐다! 본체의 방어가 해제됐다!'); }, 900);
    }
    HSR.bossTarget = 'body';   // 파괴된 부위를 노리던 경우 본체로 전환
  }
  bdRefreshBossParts();
  return dmg;
}
// (v160) 현재 보스 타겟이 팔이면 true — 공격 라우팅용
function bdRouteToArm(){ 
  if(!HSR._isBoss || !HSR.bossParts || HSR.bossTarget==='body') return null;
  const p = HSR.bossParts.find(x=>x.id===HSR.bossTarget);
  return (p && !p.dead) ? p : null;
}
// 팔의 턴 — 70% 단일 공격 / 30% 전체 공격(단일의 65%)
function bdArmTurn(part){
  HSR.state='enemy';
  say('⚔️ '+part.icon+' '+part.name+'가 움직인다!');
  try{ bdArenaShake(false); }catch(e){}   // (v193) 팔 공격 흔들림
  el.uEnemy.classList.add('hsr-lunge-l');
  setTimeout(()=>el.uEnemy.classList.remove('hsr-lunge-l'),400);
  if(window.BD_GUARD) BD_GUARD.arm(450);   // (v238) 예비동작을 보고 타이밍 가드
  setTimeout(()=>{
    const base = part.atk;
    if(Math.random() < 0.30){
      // 전체 공격: 단일 피해의 약 65%
      say('🌪 '+part.name+'의 휘두르기! 파티 전원 공격!');
      const targets = bdLivingMembers();
      targets.forEach((m,i)=>{
        setTimeout(()=>{
          let dmg = Math.max(1, Math.round(base * 0.65));
          if(m===HSR.hero){ dmg = _applyIncomingReductions(dmg); dmg = window.BD_GUARD ? BD_GUARD.consume(dmg) : dmg; }
          bdAnyTakeHit(m, dmg);
        }, i*180);
      });
      setTimeout(()=>{ part.gauge=0; renderSpeedbar(); if(HSR.state!=='over') resumeGauge(); }, targets.length*180 + 500);
    } else {
      const pool = bdLivingMembers();
      const target = pool.length ? pool[Math.floor(Math.random()*pool.length)] : HSR.hero;
      let dmg = Math.max(1, Math.round(base * (0.9 + Math.random()*0.4)));
      if(target===HSR.hero){ dmg = _applyIncomingReductions(dmg); dmg = window.BD_GUARD ? BD_GUARD.consume(dmg) : dmg; }   // (v238)
      bdAnyTakeHit(target, dmg);
      setTimeout(()=>{ part.gauge=0; renderSpeedbar(); if(HSR.state!=='over') resumeGauge(); }, 600);
    }
  }, 450);
}

// ── 동료 턴 ──
function startAllyTurn(a){
  HSR.state='ally';
  HSR.actingAlly = a;
  bdRefreshParty();
  say(a.icon+' '+a.name+'의 턴! 행동을 선택하세요');
  bdBuildAllyActions(a);
  setActionsEnabled(true);
}
function afterAllyAction(){
  const a = HSR.actingAlly;
  HSR.actingAlly = null;
  refreshEnemyUI();
  if(a){
    a.gauge = 0;
    // 자신의 행동 종료 → 보호막/버프 지속 감소 (행동 2회 유지)
    if(a.shieldActs>0){ a.shieldActs--; if(a.shieldActs<=0) a.shield=0; }
    if(a.atkUp>0) a.atkUp--;
    if(a.spdUp>0) a.spdUp--;
  }
  bdRefreshParty(); renderSpeedbar();
  if(checkEnemyDead()) return;
  HSR.state='anim';
  setActionsEnabled(false);
  setTimeout(()=>{ buildActions(); resumeGauge(); }, 450);
}
// 동료 전용 커맨드 구성 (기존 액션바 재사용)
function bdBuildAllyActions(a){
  el.actions.innerHTML = '';
  const kit = a.kit;
  const acts = [
    { cls:'hsr-basic', icon:'⚔️', title:kit.basic.name+' [Q]', desc:'무속성 기본 · SP +1', fn:()=>bdAllyBasic(a) },
    { cls:'hsr-skill', icon:'🎯', title:kit.skill.name+' [E]', desc:'SP 1 소비', fn:()=>bdAllySkill(a) },
    { cls:'hsr-item', icon:'🎒', title:'아이템 [I]', desc:'전투 중에도 회복 가능', fn:onItemMenu },
  ];
  acts.forEach(x=>{
    const b = document.createElement('div');
    b.className = 'hsr-act '+x.cls;
    b.innerHTML = '<div class="hsr-ai">'+x.icon+'</div><div class="hsr-at">'+x.title+'</div><div class="hsr-ad">'+x.desc+'</div>';
    b.onclick = ()=>{ if(HSR.state==='ally') x.fn(); };
    el.actions.appendChild(b);
  });
}
function bdAllyHitEnemy(a, powerMult, elem, gaugeGain){
  const family = (typeof currentEnemyFamily==='function') ? currentEnemyFamily() : null;
  const mult = (typeof multiplier==='function') ? multiplier(elem||'N', family) : 1;
  const base = Math.max(1, Math.round(bdActorAtk(a) * powerMult * mult));
  hitEnemy(base, elem||'N', 0);
  a.ult = Math.min(100, a.ult + (gaugeGain||0));
  bdRefreshParty();
}
function bdAllyBasic(a){
  HSR.state='anim'; setActionsEnabled(false);
  say(a.icon+' '+a.kit.basic.name+'!');
  setTimeout(()=>{
    // 재이: 약점 개수 비례 위력
    let p = a.kit.basic.power;
    if(a.id==='jaei'){ p *= (1 + 0.25 * bdEnemyWeakCount()); }
    bdAllyHitEnemy(a, p, 'N', 20);
    HSR.sp = Math.min(HSR.spMax||5, (HSR.sp||0)+1);
    if(typeof refreshSpUI==='function') refreshSpUI();
    afterAllyAction();
  }, 300);
}
function bdEnemyWeakCount(){
  try{ return enemyWeakness().length; }catch(e){ return 1; }
}
// ── 동료 스킬 (킷별) ──
function bdAllySkill(a){
  if((HSR.sp||0) < 1){ say('MP가 부족해요 — ☕ 따뜻한 음료나 도서관·문화의집에서 회복해요'); return; }
  const t = a.kit.skill.type;
  if(t==='randomBuff'){
    // 세아: 효과가 먼저 무작위 결정 → 대상 선택
    const pool = a.kit.skill.pool;
    const eff = pool[Math.floor(Math.random()*pool.length)];
    const effName = { heal:'💚 HP 회복', atkUp:'⚔️ 공격력 증가', spdUp:'💨 속도 증가', shield:'🛡 보호막' }[eff];
    say('🎲 룰렛 결과: '+effName+'! 적용할 아군을 선택하세요');
    bdPickMember('🎲 '+effName+' — 누구에게?', (m)=>{
      if(!m){ say(a.name+'의 턴! 행동을 선택하세요'); return; }
      HSR.sp--; if(typeof refreshSpUI==='function') refreshSpUI();
      HSR.state='anim'; setActionsEnabled(false);
      if(eff==='heal'){ const h=Math.round(m.maxhp*0.3); m.hp=Math.min(m.maxhp,m.hp+h); say('💚 '+ (m.name||'지킴이') +' HP '+h+' 회복!'); }
      else if(eff==='atkUp'){ m.atkUp=2; say('⚔️ '+(m.name||'지킴이')+'의 공격력이 올랐다! (행동 2회)'); }
      else if(eff==='spdUp'){ m.spdUp=2; say('💨 '+(m.name||'지킴이')+'의 속도가 올랐다! (행동 2회)'); }
      else if(eff==='shield'){ const sh=30; if(sh>m.shield){ m.shield=sh; m.shieldActs=2; } say('🛡 '+(m.name||'지킴이')+'에게 보호막 '+sh+'!'); }
      a.ult = Math.min(100, a.ult+30);
      refreshHeroUI(); bdRefreshParty();
      setTimeout(afterAllyAction, 500);
    });
  } else if(t==='addWeakness'){
    // 재이: W/M/G 약점 부여 (플레이어 선택)
    const cur = enemyWeakness();
    bdChoicePopup('🔍 어떤 약점을 밝혀낼까?', ['W','M','G'].map(e=>({
      label:{W:'🌬️ W — 바람·공기',M:'🔩 M — 금속·시설',G:'🌿 G — 환경·정화'}[e],
      sub: cur.includes(e) ? '이미 알려진 약점' : '새 약점 부여',
      disabled: cur.includes(e),
    })), (i)=>{
      if(i<0){ say(a.name+'의 턴! 행동을 선택하세요'); return; }
      const elem = ['W','M','G'][i];
      HSR.sp--; if(typeof refreshSpUI==='function') refreshSpUI();
      HSR.state='anim'; setActionsEnabled(false);
      HSR.enemy._extraWeak = HSR.enemy._extraWeak || [];
      if(!HSR.enemy._extraWeak.includes(elem)) HSR.enemy._extraWeak.push(elem);
      say('🔍 분석 완료! 적에게 '+elem+' 약점이 드러났다! (약점 '+bdEnemyWeakCount()+'개)');
      a.ult = Math.min(100, a.ult+30);
      try{ renderWeakness(); }catch(e){}
      bdRefreshParty();
      setTimeout(afterAllyAction, 600);
    });
  } else if(t==='choice2'){
    // 재현: 보호막 / 약화 선택
    bdChoicePopup('🧢 어떻게 할까?', a.kit.skill.options.map(o=>({label:o.label, sub:o.desc})), (i)=>{
      if(i<0){ say(a.name+'의 턴! 행동을 선택하세요'); return; }
      const opt = a.kit.skill.options[i];
      if(opt.id==='shield'){
        bdPickMember('🛡 보호막 — 누구에게?', (m)=>{
          if(!m){ say(a.name+'의 턴! 행동을 선택하세요'); return; }
          HSR.sp--; if(typeof refreshSpUI==='function') refreshSpUI();
          HSR.state='anim'; setActionsEnabled(false);
          const sh=35; if(sh>m.shield){ m.shield=sh; m.shieldActs=2; }
          say('🛡 "…남 일 아니니까." '+(m.name||'지킴이')+'에게 보호막 '+sh+'!');
          a.ult = Math.min(100, a.ult+30);
          refreshHeroUI(); bdRefreshParty();
          setTimeout(afterAllyAction, 500);
        });
      } else {
        HSR.sp--; if(typeof refreshSpUI==='function') refreshSpUI();
        HSR.state='anim'; setActionsEnabled(false);
        HSR.enemy._defDown = 2; HSR.enemy._spdDown = 2;
        say('🧢 적의 방어력·속도가 떨어졌다! (2턴)');
        a.ult = Math.min(100, a.ult+30);
        refreshEnemyUI(); bdRefreshParty();
        setTimeout(afterAllyAction, 500);
      }
    });
  }
}
// ── 동료 필살기 (게이지 100%, 언제든 발동) ──
function bdAllyUlt(a){
  if(a.ult<100 || a.ko || HSR.state==='over' || HSR._ultInProgress) return;
  const t = a.kit.ult.type;
  const fire = (fn)=>{
    a.ult = 0; HSR._ultInProgress = true;
    const prevState = HSR.state;
    HSR.state='anim'; setActionsEnabled(false);
    say('⚡ 필살기 · '+a.kit.ult.name+'! ('+a.name+')');
    flashScreen();
    setTimeout(()=>{ fn(()=>{ HSR._ultInProgress=false; bdRefreshParty();
      if(HSR.state!=='over'){
        if(prevState==='player'||prevState==='ally'){ HSR.state=prevState; setActionsEnabled(true); }
        else { resumeGauge(); }
      }
    }); }, 350);
  };
  if(t==='choice3'){
    bdChoicePopup('🕹️ '+a.kit.ult.name, a.kit.ult.options.map(o=>({label:o.label, sub:o.desc})), (i)=>{
      if(i<0) return;
      const opt = a.kit.ult.options[i];
      if(opt.id==='nuke'){
        fire((done)=>{ bdAllyHitEnemy(a, 3.0, 'N', 0); done(); if(checkEnemyDead()) return; });
      } else if(opt.id==='buff'){
        bdPickMember('⚔️ 아군 강화 — 누구에게?', (m)=>{
          if(!m) return;
          fire((done)=>{ m.atkUp=2; m.spdUp=2; say('⚔️💨 '+(m.name||'지킴이')+' 공격력·속도 대폭 강화! (행동 2회)'); refreshHeroUI(); done(); });
        });
      } else if(opt.id==='haste'){
        bdPickMember('⏩ 행동 당기기 — 누구를?', (m)=>{
          if(!m) return;
          fire((done)=>{ m.gauge = 100; say('⏩ '+(m.name||'지킴이')+'의 행동이 바로 돌아온다!'); renderSpeedbar(); done(); });
        });
      }
    });
  } else if(t==='revealAll'){
    fire((done)=>{
      HSR.enemy._extraWeak = ['W','M','G'].filter(e=>{ const base=enemyWeakness(); return true; });
      HSR.enemy._extraWeak = ['W','M','G'];
      try{ renderWeakness(); }catch(e){}
      say('🕵️ "사건의 전모가 밝혀졌어!" 모든 약점이 드러났다!');
      setTimeout(()=>{ bdAllyHitEnemy(a, 2.2*(1+0.25*bdEnemyWeakCount()), 'N', 0); done(); checkEnemyDead(); }, 500);
    });
  } else if(t==='purgeAll'){
    fire((done)=>{
      let cnt = 0;
      bdAllMembers().forEach(m=>{
        if(m.shield>0){ m.shield=0; m.shieldActs=0; cnt++; }
        if(m.atkUp>0){ m.atkUp=0; cnt++; }
        if(m.spdUp>0){ m.spdUp=0; cnt++; }
      });
      if(HSR.enemy._guardNext){ HSR.enemy._guardNext=0; cnt++; }
      if(HSR.enemy._defDown>0){ HSR.enemy._defDown=0; cnt++; }
      if(HSR.enemy._spdDown>0){ HSR.enemy._spdDown=0; cnt++; }
      if(HSR.enemy._marked>0){ HSR.enemy._marked=0; cnt++; }
      say('🧹 "전부 정리한다." 효과 '+cnt+'개 제거!');
      refreshHeroUI(); bdRefreshParty();
      setTimeout(()=>{ bdAllyHitEnemy(a, 1.2 + 0.5*cnt, 'N', 0); done(); checkEnemyDead(); }, 500);
    });
  }
}
// (v158) HP 조건형 1회성 패시브 특성 발동 (연막/깜빡임 등)
function _maybeFireTrait(){
  const t = HSR.enemy._trait;
  if(!t || HSR.enemy._traitFired) return;
  const hpPct = HSR.enemy.hp / (HSR.enemy.maxhp||1) * 100;
  const _mn = (typeof monName==='function') ? monName() : '적';
  if(t.id === 'smokescreen' && hpPct <= 50){
    HSR.enemy._traitFired = true;
    HSR.enemy._guardNext = 0.25;   // 다음에 받을 내 공격을 25% 경감(1회)
    say('🌫 ' + _mn + '가 짙은 연막을 펼친다! (다음 피격 경감)');
  } else if(t.id === 'flicker' && hpPct <= 40){
    HSR.enemy._traitFired = true;
    const heal = Math.round(HSR.enemy.maxhp * 0.10);
    HSR.enemy.hp = Math.min(HSR.enemy.maxhp, HSR.enemy.hp + heal);
    popDmg(el.uEnemy, '+'+heal, 'heal'); refreshEnemyUI();
    say('💡 ' + _mn + '가 깜빡이며 어둠을 흡수해 회복한다!');
  }
}
window.pickEnemySkill = pickEnemySkill;

// ── 적 행동 ──
function enemyTurn(){
  // (v239) '변덕스러운' 엘리트: 두 번째 적 턴마다 약점이 다음 속성으로 순환
  try{
    if(HSR.enemy && HSR.enemy._elite && HSR.enemy._elite.cycle){
      HSR.enemy._eturnCount = (HSR.enemy._eturnCount || 0) + 1;
      if(HSR.enemy._eturnCount % 2 === 0){
        const CYC = ['G','W','M'];
        const cur = (enemyWeakness()[0]) || 'G';
        const nxt = CYC[(CYC.indexOf(cur) + 1) % CYC.length];
        HSR.enemy._phaseWeak = [nxt];
        try{ renderWeakness(); }catch(e2){}
        try{ say('🌀 기운이 요동친다! 약점이 바뀌었다!'); }catch(e2){}
      }
    }
  }catch(e2){}
  HSR.state='enemy';
  el.uEnemy.classList.add('hsr-turn');
  // (v160) 그로기: 팔 파괴로 쌓인 그로기 1회당 본체 행동 1회 취소
  if(HSR._isBoss && HSR.enemy._groggy > 0){
    HSR.enemy._groggy--;
    say('💫 본체가 그로기 상태로 비틀거린다! (행동 취소)');
    HSR.enemy.gauge = 0; renderSpeedbar();
    // (v193) 그로기 해제 시 스프라이트 원상 복구
    setTimeout(()=>{ el.uEnemy.classList.remove('hsr-turn'); try{ bdRenderBossSprite(); }catch(e){} resumeGauge(); }, 900);
    return;
  }
  // (v160) 보스 본체: 30% 확률 전체 공격 (단일 피해의 65%)
  if(HSR._isBoss && Math.random() < 0.30){
    say('🌑 「쌓여있던 위험들」이 어둠을 흩뿌린다! 전원 공격!');
    try{ bdArenaShake(true); }catch(e){}   // (v193) 전체 공격 강한 흔들림
    el.uEnemy.classList.add('hsr-lunge-l');
    setTimeout(()=>el.uEnemy.classList.remove('hsr-lunge-l'),400);
    const targets = bdLivingMembers();
    if(window.BD_GUARD) BD_GUARD.arm(240);   // (v238)
    targets.forEach((m,i)=>{
      setTimeout(()=>{
        let dmg = Math.max(1, Math.round(HSR.enemy.atk * 0.65));
        if(m===HSR.hero){ dmg = _applyIncomingReductions(dmg); dmg = window.BD_GUARD ? BD_GUARD.consume(dmg) : dmg; }
        bdAnyTakeHit(m, dmg);
      }, i*180);
    });
    setTimeout(()=>{ _endEnemyTurn(); }, targets.length*180 + 500);
    return;
  }
  // (v158) 조건형 패시브 특성 먼저 체크
  try{ _maybeFireTrait(); }catch(e){}
  // 브레이크 상태면 행동 스킵
  if(HSR.enemy.broken){
    say((window.BD_josaN||function(t,n){return String(t).split('{n}').join(n);})('{n}가 무력화되어 행동하지 못한다!', (typeof monName==='function'?monName():'적')));
    if(HSR.enemy._marked && HSR.enemy._marked>0){ HSR.enemy._marked--; }
    HSR.enemy.breakTimer--;
    if(HSR.enemy.breakTimer<=0){
      HSR.enemy.broken=false;
      HSR.enemy.tough = HSR.enemy.maxtough;
      refreshEnemyUI();
    }
    HSR.enemy.gauge = 0; renderSpeedbar();
    setTimeout(()=>{ el.uEnemy.classList.remove('hsr-turn'); resumeGauge(); }, 900);
    return;
  }
  // ── (v158) 스킬 기반 행동 ──
  const _mn = (typeof monName==='function') ? monName() : '허수아비';
  const skill = pickEnemySkill();
  const msg = (window.BD_josaN||function(t,n){return String(t).split('{n}').join(n);})(skill.msg || '{n}가 공격한다!', _mn);
  const kind = skill.kind || 'atk';
  const baseAtk = HSR.enemy.atk;

  // ── 비공격 스킬: 회복 / 방어(인성회복) / 디버프 ──
  if(kind === 'heal'){
    say(msg);
    const heal = Math.round(HSR.enemy.maxhp * (skill.heal || 0.1));
    HSR.enemy.hp = Math.min(HSR.enemy.maxhp, HSR.enemy.hp + heal);
    popDmg(el.uEnemy, '+'+heal, 'heal'); refreshEnemyUI();
    _endEnemyTurn(); return;
  }
  if(kind === 'guard'){
    say(msg);
    if(skill.toughUp){ HSR.enemy.tough = Math.min(HSR.enemy.maxtough, HSR.enemy.tough + skill.toughUp); }
    HSR.enemy._guardNext = Math.max(HSR.enemy._guardNext||0, 0.2);  // 다음 내 공격 살짝 경감
    refreshEnemyUI();
    _endEnemyTurn(); return;
  }
  if(kind === 'debuff'){
    say(msg);
    HSR.enemy._debuffHero = 0.35;   // 다음 영웅 공격 35% 약화 (calcDamage에서 소비)
    _endEnemyTurn(); return;
  }

  // ── 공격 스킬 (단일 / 연타 multi) ──
  const hits = (kind === 'multi') ? Math.max(1, skill.hits || 2) : 1;
  say(msg);
  el.uEnemy.classList.add('hsr-lunge-l');
  setTimeout(()=>el.uEnemy.classList.remove('hsr-lunge-l'),400);

  let hitCount = 0;
  const doOneHit = ()=>{
    let dmg = Math.max(1, Math.round(baseAtk * (skill.power != null ? skill.power : 1)));
    // (v160) 행동불능이 아닌 파티원 중 무작위 대상 선택
    const pool = bdLivingMembers();
    const target = pool.length ? pool[Math.floor(Math.random()*pool.length)] : HSR.hero;
    if(target===HSR.hero){ dmg = _applyIncomingReductions(dmg); }
    if(target===HSR.hero && window.BD_GUARD){ dmg = BD_GUARD.consume(dmg); }   // (v238) 타이밍 가드
    const dead = bdAnyTakeHit(target, dmg);
    // '날카로움' 특성: 공격 시 자신도 약간 다침(반동)
    try{
      if(HSR.enemy._trait && HSR.enemy._trait.id === 'sharp'){
        const recoil = Math.max(1, Math.round(dmg * 0.15));
        HSR.enemy.hp = Math.max(0, HSR.enemy.hp - recoil);
        popDmg(el.uEnemy, recoil, 'normal'); refreshEnemyUI();
      }
    }catch(e){}
    hitCount++;
    if(dead) return;                 // 영웅 사망 시 종료
    if(HSR.enemy.hp<=0){ setTimeout(()=>checkEnemyDead(), 300); return; } // 반동으로 적 사망
    if(hitCount < hits){ if(window.BD_GUARD) BD_GUARD.arm(260); setTimeout(doOneHit, 260); }   // (v238) 연타마다 재장전
    else { _endEnemyTurn(); }
  };
  if(window.BD_GUARD) BD_GUARD.arm(240);   // (v238) 가드 타이밍 창 열기
  setTimeout(doOneHit, 240);
}

// ── 승패 판정 ──
// ── 로스팅 개선: 보스 페이즈 전환 (HP 구간마다 취약 속성이 바뀜) ──
function checkBossPhase(){
  if(HSR._bossPhase < 0 || !HSR._bossPhaseFamilies) return; // 보스전 아님
  const ratio = HSR.enemy.hp / HSR.enemy.maxhp;
  let newPhase = 0;
  if(ratio <= 0.33) newPhase = 2;
  else if(ratio <= 0.66) newPhase = 1;
  else newPhase = 0;
  if(newPhase !== HSR._bossPhase && HSR.enemy.hp > 0){
    HSR._bossPhase = newPhase;
    const fam = HSR._bossPhaseFamilies[newPhase];
    HSR.enemy.bdFamily = fam;   // 취약 속성이 바뀜
    const famName = { pollute:'오염·정리', smoke:'연기·소음', dark:'어둠' }[fam] || '';
    try{ say('⚡ 보스가 형태를 바꾼다! 이제 ' + famName + ' 계열의 약점이 드러났다!'); }catch(e){}
    // 약점 힌트 갱신
    try{ if(typeof window.BD_refreshEnemy==='function') window.BD_refreshEnemy(); }catch(e){}
    try{ if(typeof refreshEnemyUI==='function') refreshEnemyUI(); }catch(e){}
  }
}

function checkEnemyDead(){
  // (v224) 보스 페이즈 2 전환: HP 절반 이하 첫 1회 — 약점 변경 + 공격력 소폭 상승
  if(HSR._isBoss && !HSR.enemy._phase2 && HSR.enemy.hp > 0 && HSR.enemy.hp <= HSR.enemy.maxhp * 0.5){
    HSR.enemy._phase2 = true;
    try{
      const ALL = ['W','M','G'];
      const cur = enemyWeakness();
      const next = ALL.filter(x => !cur.includes(x));
      HSR.enemy._phaseWeak = next.length ? [next[0]] : ['W'];
      HSR.enemy.atk = Math.round(HSR.enemy.atk * 1.2);
      say('💥 그림자가 크게 요동친다! 약점 속성이 바뀌었다!');
      try{ bdArenaShake(true); }catch(e){}
      try{ refreshEnemyUI(); }catch(e){}
      try{ if(window.BDSound && BDSound.weakHit) BDSound.weakHit(); }catch(e){}
    }catch(e){}
  }
  if(HSR.enemy.hp<=0){
    /* (v375) 2페이즈 부활 대기 중 재호출 방지 — 연타 판정·반동·브레이크가 0.8초 안에 checkEnemyDead 를 또 부르면
       _pendingSecond 가 이미 비어 endBattle(true) 로 전투가 끝나 버렸다(최종보스 1페이즈만 잡고 종료되던 제보). */
    if(HSR._reviving) return false;
    // (v160) 본체 격파 → 남은 팔 즉시 소멸
    if(HSR._isBoss && HSR.bossParts){
      HSR.bossParts.forEach(p=>{ if(!p.dead){ p.dead=true; p.hp=0; } });
      try{ bdRefreshBossParts(); say('💥 본체가 쓰러지자 양팔도 함께 흩어진다!'); }catch(e){}
    }
    // 1대2 특수 전투: 두 번째 적이 예약돼 있으면 부활 (연전 방식)
    if(HSR._pendingSecond){
      const second = HSR._pendingSecond; HSR._pendingSecond = null;
      HSR._reviving = true;   /* (v375) */
      setTimeout(function(){
        HSR._reviving = false;
        if(!HSR.active || HSR.state === 'over') return;
        say(HSR._isBoss ? '💥 그림자가 진짜 모습을 드러낸다…!' : '또 다른 그림자가 나타났다!');
        HSR.enemy.maxhp = second.maxhp; HSR.enemy.hp = second.maxhp;
        HSR.enemy.atk = second.atk;
        HSR.enemy.maxtough = 100; HSR.enemy.tough = 100;
        HSR.enemy.broken = false; HSR.enemy.breakTimer = 0;
        HSR.enemy.spd = second.spd || 94; HSR.enemy.gauge = 0;
        if(second.bdFamily) HSR.enemy.bdFamily = second.bdFamily;
        if(typeof refreshEnemyUI==='function') refreshEnemyUI();
        if(typeof renderSpeedbar==='function') renderSpeedbar();
        if(typeof resumeGauge==='function') resumeGauge();
      }, 800);
      return false; // 아직 전투 안 끝남
    }
    setTimeout(()=>endBattle(true,false),500);
    return true;
  }
  return false;
}

// ── 액션 게이지 진행 (속도바) ──
function resumeGauge(){
  if(HSR.state==='over') return;
  HSR.state = 'gauge';
  el.uHero.classList.remove('hsr-turn');
  el.uEnemy.classList.remove('hsr-turn');
  setActionsEnabled(false);
  say('행동 게이지 충전 중...');
}

// 게이지 tick (raf 루프에서 호출)
let lastTs = 0;
// 속도(SPD) → 게이지 증가 계수. 속도 100 기준 약 1.8초에 만충.
const HSR_SPD_K = 100 / (100 * 1800);
// (v235) 한 라운드의 행동 순번표를 만든다. 쓰러진 액터는 제외.
//   순서: 주인공 → 합류 동료들 → 적 → (보스 팔이 있으면 팔들)
function bdBuildTurnRound(){
  const q = [];
  try{
    if(HSR.hero && !HSR.hero.ko) q.push({ type:'hero' });
    const allies = (typeof bdLivingAllies==='function') ? bdLivingAllies() : [];
    allies.forEach(a=>q.push({ type:'ally', id:a.id }));
  }catch(e){}
  q.push({ type:'enemy' });
  try{
    if(HSR._isBoss && HSR.bossParts){
      HSR.bossParts.forEach(p=>{ if(!p.dead) q.push({ type:'arm', id:p.id }); });
    }
  }catch(e){}
  return q;
}
function gaugeStep(dt){
  if(HSR.state!=='gauge') return;
  // (v224) 클래식 턴제: 속도 게이지 폐지 — 순번대로 한 명씩 행동한다.
  // (v235) 동료·보스 팔도 순번에 포함. 예전에는 여기서 바로 return 해버려서
  //        startAllyTurn() / bdArmTurn() 이 영원히 호출되지 않았다.
  try{ if(el.speedTrack) el.speedTrack.style.display = 'none'; }catch(e){}
  // (v223 호환) _next === 'hero' 는 "라운드를 처음부터 시작" 이라는 뜻.
  if(HSR._next === 'hero'){ HSR._turnQueue = null; HSR._next = null; }
  let guard = 0;
  while(guard++ < 32){
    if(!Array.isArray(HSR._turnQueue) || !HSR._turnQueue.length){
      HSR._turnQueue = bdBuildTurnRound();
    }
    if(!HSR._turnQueue.length) return;
    const t = HSR._turnQueue.shift();
    if(t.type === 'hero'){
      if(!HSR.hero || HSR.hero.ko) continue;
      HSR.hero.gauge = 100;
      startPlayerTurn();
      return;
    }
    if(t.type === 'ally'){
      const a = (HSR.allies||[]).find(x=>x.id===t.id);
      if(!a || a.ko) continue;
      a.gauge = 100;
      startAllyTurn(a);
      return;
    }
    if(t.type === 'arm'){
      const p = (HSR.bossParts||[]).find(x=>x.id===t.id);
      if(!p || p.dead) continue;
      bdArmTurn(p);
      return;
    }
    // enemy
    if(!HSR.enemy || HSR.enemy.hp<=0) continue;
    HSR.enemy.gauge = 100;
    enemyTurn();
    return;
  }
}
function startPlayerTurn(){
  HSR.state='player';
  el.uHero.classList.add('hsr-turn');
  el.uEnemy.classList.remove('hsr-turn');
  say('내 차례! 아래 버튼으로 행동을 골라요 ⚔️');
  setActionsEnabled(true);
  refreshUlt();
}

// ── 메인 전투 루프 ──
function battleLoop(ts){
  if(!HSR.active){ return; }
  const dt = lastTs ? Math.min(64, ts-lastTs) : 16;
  lastTs = ts;
  drawStars();
  gaugeStep(dt);
  HSR.raf = requestAnimationFrame(battleLoop);
}

// ── 전투 시작 ──
HSR.start = function(){
  if(HSR.active) return;
  // 전투 직전 필드 체력을 저장/성장 상태에도 맞춘다.
  if(typeof window.BD_syncHP === 'function') window.BD_syncHP(heroHP, false);
  // 전투 진입 시 자동 저장 (전투 전 상태 보존)
  if(typeof window.autoSave === 'function') window.autoSave('전투 진입');
  grab();
  HSR.active = true;
  HSR._ended = false;   // (v239) endBattle 재진입 가드 리셋
  HSR._reviving = false;   // (v375)
  // (v240b) 전투 진입 시 필드 가이드·담이 말풍선을 정리 — 전투 UI와 겹쳐 재생되던 문제
  try{ var _gv=document.getElementById('bd-guide-ov'); if(_gv){ _gv.style.display='none'; } window.__bdGuideOpen=false; }catch(e){}
  try{ var _bb=document.getElementById('bd-dami-bubble'); if(_bb){ _bb.classList.remove('on'); } }catch(e){}
  try{ document.body.classList.add('bd-battle-on'); }catch(e){}
  HSR._elemsUsed = {};  // (v239) 융합 궁극기 조건 추적 (전투마다 초기화)
  try{ if(typeof window.BD_syncUltUI === 'function') window.BD_syncUltUI(); }catch(e){}
  HSR.state = 'idle';
  HSR.ult = 0; HSR.ultReady=false;
  // (v223) 배지 에너지(MP): 전투 밖에서 이어지는 자원 — BD.mp를 그대로 들고 들어온다
  // (v231) 전투 MP 한도: 기본 5 + (도서관 등 보너스로 기본치(20)를 넘긴 만큼만 가산)
  HSR.spMax = 5 + Math.max(0, ((window.BD && BD.maxMp) || 20) - 20);
  HSR.sp = Math.max(0, Math.min(HSR.spMax, (window.BD && typeof BD.mp === 'number') ? BD.mp : 3));
  if(window.BD_AUG){ HSR.sp = Math.min(HSR.spMax, HSR.sp + BD_AUG.startMp()); }   // (v238) 준비된 지킴이 증강
  if(window.BD_PP) BD_PP.reset();                                                   // (v239) 스킬 사용 횟수 초기화
  try{ if(window.BD) BD.battleCount = (BD.battleCount||0) + 1; }catch(e){}           // (v239) 초반 보정용
  HSR._next = 'hero';   // (v223) 교대 턴: 항상 플레이어 선공
  if(HSR.enemy){ HSR.enemy._marked = 0; HSR.enemy._extraWeak = []; HSR.enemy._defDown = 0; HSR.enemy._spdDown = 0; }
  // (v160) 파티 구축 (합류 동료 반영)
  bdBuildParty();
  setTimeout(()=>{ bdRefreshParty(); if(typeof bdRefreshBossParts==='function') bdRefreshBossParts(); }, 100);

  // 영웅 스탯 연동 (기존 게임 전역 변수)
  const cls = (typeof heroClass!=='undefined') ? heroClass : 'warrior';
  const info = CLASS_INFO[cls] || CLASS_INFO.warrior;
  // (v233) 필드와 전투가 같은 최대/현재 HP를 사용한다.
  const maxhp = (typeof getMaxHP==='function') ? getMaxHP() : ((window.BD && BD.maxHp) || 100);
  const curhp = (typeof heroHP!=='undefined') ? Math.min(heroHP, maxhp) : ((window.BD && typeof BD.hp==='number') ? Math.min(BD.hp, maxhp) : maxhp);
  HSR._heroHPBefore = curhp;   // 전투 진입 전 체력 (도망 시 복원용)
  HSR.hero.cls = cls;
  HSR.hero.maxhp = maxhp;
  HSR.hero.hp = Math.max(1, curhp);
  HSR.hero.atk = (window.BD && BD.atk) || 15;   // (v160) 파티 공용 레벨 스탯
  // ── 속도(SPD) — 기본 100 + 기념품 보너스 ──
  HSR.hero.spd = 100 + ((typeof window.BD_mementoSpd==='function') ? window.BD_mementoSpd() : 0);
  HSR.hero.gauge = 0;

  // ── 로스팅 개선: 보스전 / 일반전 분기 ──
  const isBoss = !!HSR._isBoss;
  if(isBoss){
    // (v160) 최종 보스: 본체 + 오른팔 + 왼팔 3개체. 페이즈 없음.
    /* (v392) 체력 위주 강화 260→520 — v356 2페이즈가 절반을 P1으로 쓰므로 실전 P1 260 + 진형태 520 */
    HSR.enemy.maxhp = 520;
    HSR.enemy.hp = 520;
    HSR.enemy.atk = 9;
    HSR.enemy.spd = 96;
    HSR.enemy.bdFamily = 'boss';
    HSR.enemy._groggy = 0;          // 팔 파괴 시 +1, 본체 행동 1회 취소
    HSR._bossPhase = -1;            // 레거시 페이즈 시스템 미사용
    HSR._bossPhaseFamilies = null;
    HSR.bossTarget = 'body';        // 현재 공격 대상 ('body'|'rarm'|'larm')
    // (v224) 부위 파괴 시스템 제거 — 페이즈 2단 보스로 단순화 (스프라이트는 전체 모습 유지)
    HSR.bossParts = null;
    HSR.enemy._vMaxTough = 100;
    HSR.enemy._trait = null; HSR.enemy._traitFired = false;
    HSR.enemy._guardNext = 0; HSR.enemy._debuffHero = 0;
  } else {
    HSR.bossParts = null; HSR.bossTarget = 'body';
    // 일반 위험 요소 (아이들용 쉬운 난이도 + 장별 점진적 스케일링)
    // (v130) 프롤로그=0단계, 1~4장=1~4단계로 취급해 HP·ATK를 완만하게 올림.
    //  hazardId 접두사(tutorial_/ch1_~ch4_)로 판별. 알 수 없으면 기존값(0단계) 사용.
    const hid2 = (BD._pendingHazard && BD._pendingHazard.hid) || '';
    let tier = 0;
    const tierMatch = /^ch([1-4])_/.exec(hid2);
    if (tierMatch) tier = Number(tierMatch[1]);
    // (v38) 신맵(4개 리) 위험요소 접두 매핑 — ow* id가 전부 티어 0(프롤로그 스탯)으로 잡혀
    //  2~4장 난이도 곡선이 사라지던 문제 (와우리1 → 상리2 → 동화리3 → 수영리4)
    if (!tierMatch) {
      const __owTier = { ow212_: 1, ow213_: 2, ow211_: 3, ow210_: 4 };
      for (const __p in __owTier) { if (hid2.indexOf(__p) === 0) { tier = __owTier[__p]; break; } }
    }
    HSR.enemy.maxhp = Math.round(70 * (1 + tier * 0.25));   // (v231) 하향: 프롤로그70 → 1장88 → 2장105 → 3장123 → 4장140
    HSR.enemy.hp = HSR.enemy.maxhp;
    HSR.enemy.atk = Math.round(6 * (1 + tier * 0.15));      // 프롤로그6 → 1장7 → 2장8 → 3장9 → 4장10
    HSR.enemy.spd = 94;
    HSR._bossPhase = -1;

    // ── (v158) 변종별 개별 스탯 주입 ──
    //  변종이 지정돼 있으면 그 몹의 hp/spd/atk/tough를 기준으로 삼되, 장(tier)에 따라 완만히 스케일.
    try{
      const _vm = (typeof currentMonster==='function') ? currentMonster() : null;
      if(_vm && HSR.enemy.variant){
        const scale = 0.60 + tier * 0.15;   // (v231) 변종도 초반 하향: 0.6배에서 시작해 장마다 완만히 상승
        const aScale = 1 + tier * 0.15;
        HSR.enemy.maxhp    = Math.round((_vm.hp   || 120) * scale);
        HSR.enemy.hp       = HSR.enemy.maxhp;
        HSR.enemy.atk      = Math.max(1, Math.round((_vm.atk || 6) * aScale));
        HSR.enemy.spd      = _vm.spd || 94;
        HSR.enemy._vMaxTough = _vm.tough || 100;   // 변종 인성(약점게이지) 최대치
        HSR.enemy._trait   = _vm.trait || null;
        HSR.enemy._traitFired = false;             // 1회성 특성 발동 여부
        // ── (v239) 엘리트 개체: 2장부터 35% 확률로 접두어 변형 등장 ──
        //  같은 몹 반복의 단조로움을 깨는 에셋 불필요 변주. 이름·색만 바뀐다.
        HSR.enemy._elite = null;
        try{
          const _canElite = !HSR._isBoss && (window.BD && (BD.questIdx||0) >= 1);
          const _roll = (typeof window.__bdForceElite==='string') ? 0 : Math.random();
          if(_canElite && _roll < 0.35){
            const ELITES = [
              { id:'giant',  pre:'거대한',    hpm:1.5,  atkm:1.1,
                tint:'saturate(1.35) drop-shadow(0 0 16px rgba(255,200,60,.75))', scale:1.16 },
              { id:'fierce', pre:'사나운',    hpm:0.85, atkm:1.45,
                tint:'hue-rotate(-30deg) saturate(1.7)', scale:1.0 },
              { id:'shifty', pre:'변덕스러운', hpm:1.0,  atkm:1.0, cycle:true,
                tint:'hue-rotate(120deg) saturate(1.4)', scale:1.0 },
            ];
            let _e = ELITES[Math.floor(Math.random()*ELITES.length)];
            if(typeof window.__bdForceElite==='string'){
              _e = ELITES.find(x=>x.id===window.__bdForceElite) || _e;   // 테스트용 강제 지정
            }
            HSR.enemy._elite = _e;
            HSR.enemy.maxhp = Math.round(HSR.enemy.maxhp * _e.hpm);
            HSR.enemy.hp    = HSR.enemy.maxhp;
            HSR.enemy.atk   = Math.max(1, Math.round(HSR.enemy.atk * _e.atkm));
            HSR.enemy._eturnCount = 0;
            try{ if(window.BD_DAMI_TIPS && BD_DAMI_TIPS.onElite) BD_DAMI_TIPS.onElite(_e); }catch(e2){}
          }
        }catch(e2){ HSR.enemy._elite = null; }
      } else {
        HSR.enemy._vMaxTough = 100;
        HSR.enemy._trait = null;
        HSR.enemy._traitFired = false;
      }
    }catch(e){ HSR.enemy._vMaxTough = 100; HSR.enemy._trait = null; HSR.enemy._traitFired = false; }
    // (v158) 1회성 전투 플래그 초기화
    HSR.enemy._guardNext = 0;
    HSR.enemy._debuffHero = 0;
  }
  HSR.enemy.maxtough = (!HSR._isBoss && HSR.enemy._vMaxTough) ? HSR.enemy._vMaxTough : 100;
  HSR.enemy.tough = HSR.enemy.maxtough;
  HSR.enemy.broken = false;
  HSR.enemy.breakTimer = 0;
  HSR.enemy.gauge = 0;
  // 시작 시 게이지: 속도 비율만큼 미리 채워 선공 순서를 속도로 결정
  (function(){
    var hs = HSR.hero.spd, es = HSR.enemy.spd;
    var mx = Math.max(hs, es);
    HSR.hero.gauge  = Math.round(hs/mx*100 * 0.35);   // 빠른 쪽이 더 앞선 상태로 시작
    HSR.enemy.gauge = Math.round(es/mx*100 * 0.35);
  })();

  // UI 초기화
  el.heroName.firstChild.textContent = ((typeof heroName!=='undefined'?heroName:'영웅')) + ' ';
  el.heroCls.textContent = 'Lv.' + ((window.BD && BD.lv) || 5) + ' 지킴이 · SPD ' + HSR.hero.spd;
  var enemyLv = document.getElementById('hsr-enemy-lv');
  if(enemyLv) enemyLv.textContent = 'Lv.5 · SPD ' + HSR.enemy.spd;
  el.heroSprite.innerHTML =
    (window.BD_ASSETS && BD_ASSETS.imgHTML('hero.battle', 'height:min(340px,62vh);object-fit:contain;display:block;'))
    || bdHeroBattleSpriteHTML(cls);   // (v239) 에셋 슬롯 우선, (v194) LD 이미지, 실패 시 SVG 폴백
  // 적: (v158) 계열별 실루엣 + 변종 아이콘 배지. 변종 없으면 허수아비로 폴백.
  {
    const _m = (typeof currentMonster==='function') ? currentMonster() : null;
    const useFamily = !!(HSR.enemy && HSR.enemy.variant) || HSR._isBoss;
    // (v193) 보스는 전용 3부위 스프라이트 사용
    // (v239) 에셋 슬롯 우선: enemy.<variant> / enemy.boss 가 등록돼 있으면 그 그림을 쓴다
    let _slotImg = null;
    try{
      if(window.BD_ASSETS){
        _slotImg = HSR._isBoss ? BD_ASSETS.get('enemy.boss')
                 : (HSR.enemy && HSR.enemy.variant ? BD_ASSETS.get('enemy.' + HSR.enemy.variant) : null);
      }
    }catch(e){}
    const img = _slotImg || (HSR._isBoss ? makeBossSprite() : (useFamily ? makeMonsterSprite() : makeScarecrowSprite()));
    const alt = _m ? _m.name : '허수아비';
    const badge = (_m && _m.icon) ? ('<div style="position:absolute;right:8%;top:6%;font-size:clamp(22px,5vw,40px);filter:drop-shadow(0 2px 4px rgba(0,0,0,.6));">'+_m.icon+'</div>') : '';
    if(img){
      el.enemySprite.style.position = 'relative';
      el.enemySprite.innerHTML = '<img src="'+img+'" alt="'+alt+'" style="object-fit:contain;display:block;image-rendering:auto;">' + badge;
    } else {
      el.enemySprite.textContent = (_m && _m.icon) ? _m.icon : '🎃';
    }
    // (v193) 적 정보창 이름을 실제 몬스터 이름으로 갱신 (기존: "각성한 허수아비" 고정)
    try{
      const _infoEn = document.getElementById('bd-info-hsr-u-enemy');   // (v55a) 재부모화 후엔 마커로, 전엔 유닛 내부에서
      const nmEl = (_infoEn && _infoEn.querySelector('.hsr-name')) || el.uEnemy.querySelector('.hsr-name');
      if(nmEl && nmEl.firstChild && nmEl.firstChild.nodeType === 3){
        const _pre = (HSR.enemy._elite ? HSR.enemy._elite.pre + ' ' : '');   // (v239) 엘리트 접두어
        nmEl.firstChild.textContent = (_m ? ((_m.icon?_m.icon+' ':'') + _pre + _m.name) : '각성한 허수아비') + ' ';
      }
      // (v239) 엘리트 시각 변형: 색 필터 + 크기 (에셋 없이 구분)
      try{
        if(HSR.enemy._elite){
          el.enemySprite.style.filter = HSR.enemy._elite.tint || '';
          el.enemySprite.style.transform = 'scale(' + (HSR.enemy._elite.scale || 1) + ')';
        } else {
          el.enemySprite.style.filter = '';
          el.enemySprite.style.transform = '';
        }
      }catch(e){}
    }catch(e){}
    // (v193) 보스 등장 연출 (배너 + 흔들림 + 그로기 클래스 초기화)
    if(HSR._isBoss){
      try{ el.uEnemy.classList.remove('bd-boss-groggy'); }catch(e){}
      try{ bdBossIntro(); }catch(e){}
    }
  }
  refreshHeroUI(); refreshEnemyUI(); refreshUlt();
  renderWeakness(); renderSpeedbar();
  buildActions();
  // ── 봉담 훅: 허수아비 계열 지정 + MP바/약점힌트 ──
  try{
    // (버그 수정) 보스전에서는 페이즈 시스템이 관리하는 취약 속성을 그대로 둔다.
    // 예전엔 이 줄이 보스전에도 무조건 실행돼서, 맵 오브젝트의 고정 계열(hazardFamily)로
    // 덮어써버려 페이즈0(오염 약점)이 시작부터 엉뚱한 속성으로 표시되던 버그가 있었다.
    if (HSR._isBoss && HSR._bossPhaseFamilies) {
      HSR.enemy.bdFamily = HSR._bossPhaseFamilies[HSR._bossPhase] || 'pollute';
    } else {
      // (v158) 변종이 지정돼 있으면 그 변종의 계열을 우선 사용 (약점/연출 일치)
      var _vfam = null;
      try{ if(HSR.enemy.variant && HAZARD_VARIANTS[HSR.enemy.variant]) _vfam = HAZARD_VARIANTS[HSR.enemy.variant].fam; }catch(e){}
      HSR.enemy.bdFamily = _vfam || ((typeof window.BD_currentFamily!=='undefined') ? window.BD_currentFamily : 'pollute');
    }
    if(typeof window.BD_updateMp==='function'){ /* mp 바는 주입 함수에서 */ }
    if(window.BD){ if(window.BD.mp>window.BD.maxMp) window.BD.mp=window.BD.maxMp; }
    setTimeout(function(){
      if(typeof window.BD_showWeakHint==='function') window.BD_showWeakHint();
      if(typeof window.BD_injectMpBar==='function') window.BD_injectMpBar();
    }, 250);
  }catch(e){}
  say((window.BD_josaN||function(t,n){return String(t).split('{n}').join(n);})('{n}가 나타났다!', (typeof monName==='function'?monName():'적')));
  el.result.classList.remove('hsr-show2','win','lose');
  closeElemPick();

  // 배경 별
  initStars();

  // 게임 루프 정지 (배경 게임 멈춤)
  if(typeof gameRaf!=='undefined' && gameRaf){ cancelAnimationFrame(gameRaf); }
  window.__gameLoopChainAlive = false;
  window._hsrPrevGameRaf = (typeof gameRaf!=='undefined') ? gameRaf : null;

  // 표시
  el.root.classList.add('hsr-show');
  el.root.setAttribute('aria-hidden','false');

  // 잠깐 인트로 후 게이지 시작
  lastTs = 0;
  HSR.raf = requestAnimationFrame(battleLoop);
  setTimeout(()=>{ resumeGauge(); }, 450);
};

// ── 전투 종료 ──
function endBattle(win, fled){
  // (v239) 재진입 가드 — 피해 경로와 턴 종료 콜백이 각각 사망 판정을 해
  //  endBattle 이 두 번 불리면 증강 드래프트가 이중으로 열린다
  if(HSR._ended) return;
  HSR._ended = true;
  HSR.state='over';
  if(HSR.raf) cancelAnimationFrame(HSR.raf);
  HSR.raf=null;
  // (v160) 파티 상태 저장 (KO는 전투 후에도 유지 — 회복시설 필요)
  try{ bdPersistParty(); }catch(e){}
  try{ bdRemovePartyStrip(); }catch(e){}
  try{ bdRemoveBossStrip(); }catch(e){}
  try{ if(window.BD_Bgm) window.BD_Bgm.play('field'); }catch(e){}   // (v160) 전투 종료 → 필드 BGM
  try{ HSR.hero.ko=false; el.uHero.style.filter=''; el.uHero.style.opacity=''; }catch(e){}
  try{ const p=document.getElementById('bd-choice-pop'); if(p) p.remove(); }catch(e){}

  if(win){
    // (v239) 승리 결과창 폐지 — 담이가 한마디 하고 바로 증강 선택으로 넘어간다
    try{
      if(window.BD_DAMI) BD_DAMI.show('정화 완료! 봉담이 조금 더 안전해졌어요', { face:'proud' });
    }catch(e){}
    // (v239) 안전 수첩 기록 — 처음 정화한 종류면 수집 알림
    try{ if(window.BD_codexRecord && HSR.enemy) BD_codexRecord(HSR.enemy.variant); }catch(e){}
    // (v160) 보상: 일반 전투는 소지금 미지급 — 공용 경험치만 획득 (행동불능 포함 전원)
    try{
      if(typeof window.BD_gainXp==='function'){ window.BD_gainXp(25); }
      if(typeof surveyQuestProgress==='function'){ surveyQuestProgress('train_scarecrow', 3); }
      if(typeof window.BD_renderQuest==='function'){ window.BD_renderQuest(); }
    }catch(e){}
    // ── 봉담 훅 (v199 수정): 정화 기록·퀘스트 진행은 onHazardBattleEnd가 전담 ──
    // 기존엔 여기서도 BD_markPurified + BD_questProgress를 호출해
    //  1) 위험요소 1회 정화가 장별 목표를 +2 진행시켰고 (need:2가 전투 1회로 완료),
    //  2) pendingHazard 없는 전투에서 'scarecrow_N' 더미 키가 정화 기록을 오염시켰다.
    try{
      if(typeof window.BD_hideWeakHint==='function') window.BD_hideWeakHint();
    }catch(e){}
  } else if(fled){
    // 도망: 전투에서 받은 피해를 반영하고 조용히 닫기
    finishClose(false, true);
    return;
  } else {
    // 패배: 결과창 없이 바로 게임오버 장면으로
    finishClose(false, false);
    return;
  }
  // (v238) 정화의 온기 증강: 승리 시 HP 회복
  try{ if(window.BD_AUG) BD_AUG.onWin(); }catch(e){}
  if(win){
    // (v239) 확인 버튼 없이 곧바로 증강 3택 → 선택하면 전투 종료
    setTimeout(function(){
      if(window.BD_AUG && BD_AUG.canDraft()){
        BD_AUG.draft(function(){ finishClose(true, false); });
      } else {
        finishClose(true, false);
      }
    }, 1100);
    return;
  }
  el.resultBtn.onclick = ()=> finishClose(win, false);
}

function finishClose(win, fled){
  window.__bdExitLockUntil = Date.now() + 1800;   // (v220) 전투 종료 직후 출구 오발 방지
  var wentGameOver = false;
  // 결과에 따라 영웅 HP 반영
  try{
    if(typeof heroHP!=='undefined'){
      if(fled){
        // 도망: 전투에서 받은 피해량을 그대로 반영 (전투 종료 시점 HP)
        heroHP = Math.max(0, Math.round(HSR.hero.hp));
      } else if(win){
        // 승리: 전투에서 깎인 체력 그대로 반영
        heroHP = Math.max(0, Math.round(HSR.hero.hp));
      } else {
        // 패배: 체력 0 → 게임오버 장면으로
        heroHP = 0;
        wentGameOver = true;
      }
    }
  }catch(e){}

  // 허수아비 상태 되돌리기 (전투 후 다시 훈련 가능하도록)
  try{
    if(typeof _scarecrow!=='undefined'){
      _scarecrow.hp = (typeof SCARECROW_MAX_HP!=='undefined')?SCARECROW_MAX_HP:100;
      _scarecrow.alive = true;
      _scarecrow.flashTimer = 0;
      if(typeof _resetScarecrowStatus==='function') _resetScarecrowStatus();
    }
  }catch(e){}

  // ── 봉담 훅: 전투 UI 정리 ──
  try{
    if(typeof window.BD_hideWeakHint==='function') window.BD_hideWeakHint();
    var sm=document.getElementById('bd-skill-menu'); if(sm) sm.classList.remove('show');
    // 승리·도망·패배 모두 전투 종료 체력을 필드/저장 상태에 동기화
    if(typeof window.BD_syncHP === 'function') window.BD_syncHP(win || fled ? HSR.hero.hp : 0, false);
    if(window.BD && typeof window.BD_save==='function') window.BD_save();
  }catch(e){}

  el.result.classList.remove('hsr-show2','win','lose');
  el.root.classList.remove('hsr-show');
  el.root.setAttribute('aria-hidden','true');
  HSR.active=false;
  try{ document.body.classList.remove('bd-battle-on'); }catch(e){}
    /* (v337) 전투 튜토는 무조건 1회 — 종료 시 잔여 스텝 정리(전투 밖 재생·다음 전투 재개 방지) */
    try{ localStorage.setItem('bd_battle_tutorial_done','1'); }catch(eT1){}
    try{
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()){
        window.__bdSilentSkip = true;
        try{ (BD_TUTOR.__skipReal || BD_TUTOR.skip).call(BD_TUTOR); }finally{ window.__bdSilentSkip = false; }
        try{ if (BD_TUTOR.isRunning() && BD_TUTOR.reset) BD_TUTOR.reset(); }catch(eT3){}
      }
    }catch(eT2){}
  HSR.cleared = win ? true : false;
  try{ if(window.BDSound){ if(win) BDSound.win(); else BDSound.lose(); } }catch(e){}

  // ── 봉담 훅: 위험 오브젝트 전투였다면 정화 루프 마무리 ──
  try{
    if(window.BD && window.BD._pendingHazard && typeof window.BD_onHazardBattleEnd==='function'){
      setTimeout(function(){ window.BD_onHazardBattleEnd(win); }, 400);
    }
  }catch(e){}

  // 재도전 가능하도록 잠깐 후 cleared 해제 (다시 때리면 전투 재개)
  setTimeout(()=>{ HSR.cleared=false; }, 1200);

  if(wentGameOver){
    // (v212) 전투 패배도 필드 사망과 동일하게 문화의집 복귀+전액 회복으로 통일
    //  (기획서: 패배 조건 — 플레이어 HP 0 → 문화의집 복귀. 진행은 유지)
    try{
      if(typeof window.BD_healParty==='function') window.BD_healParty();
      if(window.BD){
        if(typeof window.BD_syncHP === 'function') window.BD_syncHP(getMaxHP(), false);
        else BD.hp = BD.maxHp;
        if(typeof window.BD_save==='function') window.BD_save();
      }
      if(typeof window.autoSave==='function') window.autoSave('패배 복귀');
      if(typeof showGameOver==='function'){ setTimeout(showGameOver, 350); }
    }catch(e){ if(typeof showGameOver==='function'){ showGameOver(); return; } }
  }

  // HUD 갱신 후 게임 루프 재개
  try{ if(typeof window.BD_renderQuest==='function') window.BD_renderQuest(); }catch(e){}
  if(typeof gameLoop==='function'){ window.__gameLoopChainAlive = false; gameLoop(); }
}

// ── 봉담 모듈 연동: 전투 헬퍼 전역 노출 ──
// 봉담 스킬이 상성 배율을 곱한 최종 데미지를 넘기면, 기존 연출/게이지/브레이크/사망판정을 그대로 태운다.
window.HSR_hitEnemyRaw = function(finalDmg, gaugeGain){
  try{
    // (v160) 보스전: 팔 타겟 라우팅
    const _arm = (typeof bdRouteToArm==='function') ? bdRouteToArm() : null;
    if(_arm){
      bdHitArm(_arm, Math.max(1, Math.round(finalDmg)));
      if(typeof addUlt==='function') addUlt(gaugeGain||18);
      el.uEnemy.classList.add('hsr-shake');
      setTimeout(()=>el.uEnemy.classList.remove('hsr-shake'),400);
      return;
    }
    // (v160) 팔 생존 시 본체 피해 50% 감소
    if(HSR._isBoss && typeof bdArmsAlive==='function' && bdArmsAlive()){
      finalDmg = Math.max(1, Math.round(finalDmg * 0.5));
    }
    if(window.BD_AUG){ finalDmg = Math.round(finalDmg * BD_AUG.dmgMult()); }              // (v238)
    if(window.BD_consumeAcMult){ finalDmg = Math.max(1, Math.round(finalDmg * BD_consumeAcMult())); }  // (v238)
    HSR.enemy.hp = Math.max(0, HSR.enemy.hp - finalDmg);
    el.uEnemy.classList.remove('hsr-shake'); void el.uEnemy.offsetWidth;
    el.uEnemy.classList.add('hsr-shake');
    setTimeout(()=>el.uEnemy.classList.remove('hsr-shake'),400);
    popDmg(el.uEnemy, finalDmg, 'weakhit'); try{ if(window.BDSound) BDSound.weakHit(); }catch(e){}
    if(window.BD_FX) BD_FX.onHit('weakhit', el.uEnemy);   // (v238)
    try{ if(window.BD_FX && BD_FX.hitSheet) BD_FX.hitSheet('N', true); }catch(e){}   // (v240h)
    addUlt(gaugeGain||18);
    refreshEnemyUI();
    if(!HSR.enemy.broken && HSR.enemy.tough<=0){ triggerBreak(); }
    checkEnemyDead();
  }catch(e){}
};
window.HSR_refreshEnemy = function(){ try{ refreshEnemyUI(); }catch(e){} };

// 창 리사이즈 시 별 캔버스 갱신
window.addEventListener('resize', ()=>{ if(HSR.active) initStars(); });

// 전투 단축키: ESC=도망, Q=기본 공격, E=스킬, 1=궁극기
window.addEventListener('keydown', (e)=>{
  if(!HSR.active) return;
  // (v240d) 담이 튜토리얼 안내 중엔 그 스텝에서 허용한 키만 통과 — 안내 중 난타로 꼬이던 문제
  if (window.BD_TUTOR_keyBlocked && window.BD_TUTOR_keyBlocked(e)) {
    e.preventDefault(); e.stopImmediatePropagation(); return;
  }
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); if(!HSR._isBoss && HSR.state==='player') onFlee(); return; }
  const k = (e.key||'').toLowerCase();
  // 궁극기(1)는 어느 턴에서든 게이지만 차 있으면 발동 (붕괴 스타레일식 기습)
  if(k==='1'){
    e.preventDefault(); e.stopPropagation();
    if(HSR.ultReady && HSR.state!=='over' && !HSR._ultInProgress) onUlt();
    else if(!HSR.ultReady){ try{ if(typeof say==='function') say('궁극기 게이지가 아직 부족해요!'); }catch(err){} }
    return;
  }
  // Q(기본)·E(스킬)은 플레이어 턴에만
  if(HSR.state !== 'player') return;
  if(k==='q'){
    e.preventDefault(); e.stopPropagation();
    onBasicPurify();
  } else if(k==='e'){
    e.preventDefault(); e.stopPropagation();
    onBadgeSkill();
  } else if(k==='i'){
    e.preventDefault(); e.stopPropagation();
    onItemMenu();
  }
}, true);

// (v238) 테스트·디버그 훅 — 내부 함수 노출 (게임 동작에는 영향 없음)
window.__bdHSR = { calcDamage, enemyWeakness, onBasic, hitEnemy, endBattle, afterPlayerAction };
window.BD_afterPlayerAction = afterPlayerAction;   // (v239) 턴 종료 폴백용

})();
