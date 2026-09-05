
(function(){
"use strict";
/* =======================================================================
   봉담 지킴이 통합 시스템 (window.BD)
   - 작업1: 속성 상성 (A/B/C 3속성, 취약2.0 / 보통1 / 저항0.4)
   - 작업2: MP·배지 스킬 (무속성 기본 + A/B/C 스킬, MP 소모, 해금)
   - 작업3: 메인 퀘스트 진행 (6단계, 목표→보상→해금)
   - 작업4: 정화 후 오브젝트 상태 변경
   기존 HSR 전투에 훅으로 연결. 기존 코드는 최소 변경.
   ======================================================================= */

// (v160) v159 저장과 충돌하지 않는 별도 저장 키. 기존 v1 저장이 있으면 최초 1회 이관.
const SAVE_KEY = 'bongdam_guardian_v160';
try{
  if(!localStorage.getItem(SAVE_KEY) && localStorage.getItem('bongdam_guardian_v1')){
    localStorage.setItem(SAVE_KEY, localStorage.getItem('bongdam_guardian_v1'));
  }
}catch(e){}

// ---- 속성 정의 ----
const ELEM = {
  /* (v375) 아이들도 한눈에 — 글자 속성(W/G/M) 대신 그림+우리말: 💨 바람 / 🌿 자연 / 🔧 시설 */
  W: { key:'W', name:'바람', full:'바람·공기·소음', icon:'💨', cls:'bd-el-A' },
  G: { key:'G', name:'자연', full:'환경·오염·쓰레기', icon:'🌿', cls:'bd-el-B' },
  M: { key:'M', name:'시설', full:'시설·파손·어둠', icon:'🔧', cls:'bd-el-C' },
  N: { key:'N', name:'무속성', full:'정화',     icon:'✨', cls:'bd-el-N' },
};
// (v160) W/M/G 속성 체계 — 기획서 11번
//  W(Wind): 공기·확산·호흡·소리 / M(Metal): 인공물·시설·파손 / G(Green): 환경·오염
//  약점 일치 1.5배, 그 외 1배. 순환 상성·저항 없음.
const FAMILY = {
  smoke:   { name:'공기·소음', weak:'W' },
  pollute: { name:'환경·오염', weak:'G' },
  dark:    { name:'시설·파손', weak:'M' },
};
function multiplier(skillElem, family){
  if(skillElem==='N') return 1;            // 무속성은 항상 1배
  const f = FAMILY[family]; if(!f) return 1;
  if(skillElem===f.weak)   return 1.5;     // 약점 일치
  return 1;                                // 그 외
}
function effLabel(skillElem, family){
  if(skillElem==='N') return {t:'',c:''};
  const f=FAMILY[family]; if(!f) return {t:'',c:''};
  if(skillElem===f.weak)   return {t:'약점! ×1.5', c:'bd-eff-weak'};
  return {t:'보통', c:''};
}

// ---- 배지 스킬 정의 ----
const SKILLS = [
  { id:'sticker', name:'정화 스티커', elem:'N', sp:0,  power:1.0,  unlock:true,
    desc:'기본 공격 · 사용 횟수 제한 없음' },
  { id:'fan',     name:'노트 부채질', elem:'W', sp:1,  power:1.6,  unlock:false,
    desc:'노트를 펼쳐 탁한 공기를 흩어버린다 (바람 · 연기·소음에 강함)' },
  { id:'wash',    name:'물청소 정화',   elem:'G', sp:1,  power:1.6,  unlock:false,
    desc:'텀블러 물로 얼룩을 씻어내 그림자의 힘을 지운다 (물 · 오염·쓰레기에 강함)' },
  { id:'light',   name:'안전 점검 라이트',elem:'M', sp:1,  power:1.65, unlock:false,
    desc:'어두운 곳을 비춰 숨은 위험을 드러낸다 — 드러난 그림자는 힘을 잃는다 (빛 · 시설·파손에 강함)' },
  { id:'cheer',   name:'힘내라 봉담!', elem:'N', sp:1,  power:1.85, unlock:false,
    desc:'주민들의 응원을 모아 내지르는 한마디 — 외면이 만든 그림자에 가장 아프다 (속성 없음)' },
];
// (v160) MP 시스템 제거 → 파티 공용 SP (전투 중에만 존재. 최대 5, 시작 3)
//  기본 공격: SP +1 / 스킬: SP -1 / 아이템: 행동만 소비

// ---- (v159) 지킴이 필살기 정의 — 레거시 직업(전사/마법사 등) 궁극기 대체 ----
// 장착된 배지 스킬(equippedSkill)에 따라 필살기가 달라진다.
const BD_ULTS = {
  // (v239) 융합 궁극기 — 4속성을 모두 배우고 보스전에서 전부 사용하면 해금
  fusion:  { id:'fusion',  elem:'N', ultName:'모두의 마음', ultIcon:'🌈',
    hits:4, hitPower:1.6, selfHealPct:0.20, clearGuard:true, mark:true,
    desc:'배운 모든 정화법을 하나로 — 4연타 + 회복 + 표식' },
  sticker: { id:'sticker', elem:'N', ultName:'다 같이 정화', ultIcon:'✨',
    hits:1, hitPower:2.4, selfHealPct:0.15,
    desc:'강력한 정화 일격 + 자신 HP 15% 회복' },
  fan:     { id:'fan',     elem:'W', ultName:'태풍 부채질', ultIcon:'🌪',
    hits:3, hitPower:1.1, breakBonus:true,
    desc:'연속 3회 강타' },
  wash:    { id:'wash',    elem:'G', ultName:'완전 물청소', ultIcon:'💦',
    hits:1, hitPower:2.8, clearGuard:true,
    desc:'단일 초강타 + 적의 방어 태세(가드) 해제' },
  light:   { id:'light',   elem:'M', ultName:'서치라이트 집중', ultIcon:'🔦',
    hits:1, hitPower:2.6, mark:true,
    desc:'단일 초강타 + 표식: 2턴간 받는 피해 25% 증가' },
  cheer:   { id:'cheer',   elem:'N', ultName:'봉담 대합창', ultIcon:'📣',
    hits:1, hitPower:2.5, selfHealPct:0.10,
    desc:'모두의 응원을 모은 일격' },
};
window.BD_ULTS = BD_ULTS;
function currentUltInfo(){
  // (v239) 융합 해금 후에는 항상 「모두의 마음」
  try{ if(window.BD && BD._ultUnlocked && BD_ULTS.fusion) return BD_ULTS.fusion; }catch(e){}
  try{
    const eqId = (window.BD && (BD.equippedSkill || (BD.unlockedSkills && BD.unlockedSkills[0]))) || 'sticker';
    return BD_ULTS[eqId] || BD_ULTS.sticker;
  }catch(e){ return BD_ULTS.sticker; }
}
window.BD_currentUltInfo = currentUltInfo;

// ============================================================
// (v160) 파티 시스템 데이터 — 기획서 3번·9번
//  합류 순서: 세아(1장 후) → 재이(2장 후) → 재현(3장 후)
//  실제 다인원 전투 엔진은 이 데이터를 기반으로 동작한다.
// ============================================================
const BD_PARTY = {
  sea: {
    id:'sea', name:'세아', icon:'🎮', grade:'중1',
    joinAfterQuestIdx: 2,   // ch1 완료 시 questIdx가 2가 됨
    hp: 90, atk: 10, spd: 108,
    basic: { name:'게임식 태클', elem:'N', power:0.9, desc:'무속성 기본 공격' },
    skill: { name:'랜덤 버프!', sp:1, type:'randomBuff',
      pool:['heal','atkUp','spdUp','shield'],
      desc:'HP회복/공격력↑/속도↑/보호막 중 하나가 무작위로 결정 — 적용할 아군은 직접 선택' },
    ult: { name:'풀 세팅 가자!', icon:'🕹️', type:'choice3',
      options:[
        { id:'buff',  label:'아군 강화', desc:'원하는 아군 1명에게 공격력·속도 동시 강화' },
        { id:'nuke',  label:'초강력 공격', desc:'적 1명에게 초강력 무속성 공격 (위력 3.0배)' },
        { id:'haste', label:'행동 당기기', desc:'아군 1명의 행동 차례를 즉시 앞으로 당김' },
      ],
      desc:'세 가지 효과 중 하나를 선택해 발동' },
  },
  jaei: {
    id:'jaei', name:'재이', icon:'🔍', grade:'고2',
    joinAfterQuestIdx: 3,   // ch2 완료
    hp: 85, atk: 11, spd: 100,
    basic: { name:'돋보기 찌르기', elem:'N', power:0.9, desc:'무속성 기본 공격' },
    skill: { name:'약점 분석', sp:1, type:'addWeakness',
      choose:['W','M','G'],
      desc:'적에게 W/M/G 중 선택한 약점을 추가 부여. 재이의 공격은 적 약점 개수에 비례해 강해진다' },
    ult: { name:'사건의 전모', icon:'🕵️', type:'revealAll',
      desc:'적 1명에게 모든 약점(W/M/G)을 부여한 뒤 강한 단일 공격 (위력 2.2배 × 약점 보너스)' },
  },
  jaehyun: {
    id:'jaehyun', name:'재현', icon:'🧢', grade:'중3',
    joinAfterQuestIdx: 4,   // ch3 완료
    hp: 110, atk: 12, spd: 95,
    basic: { name:'무심한 견제', elem:'N', power:1.0, desc:'무속성 기본 공격' },
    skill: { name:'남 일 아니다', sp:1, type:'choice2',
      options:[
        { id:'shield', label:'보호막', desc:'아군 1명에게 보호막 (대상 행동 2회 유지)' },
        { id:'debuff', label:'약화', desc:'적 1명에게 방어력 20%·속도 15% 감소 (2턴)' },
      ],
      desc:'보호막 부여 또는 적 약화 중 선택' },
    ult: { name:'전부 정리한다', icon:'🧹', type:'purgeAll',
      desc:'전장의 버프·디버프를 전부 제거하고, 제거한 개수에 비례해 적에게 피해' },
  },
};
window.BD_PARTY = BD_PARTY;
// 현재 합류한 파티원 목록 (합류 순서대로)
function bdJoinedMembers(){
  try{
    const qi = (window.BD && typeof BD.questIdx==='number') ? BD.questIdx : 0;
    return ['sea','jaei','jaehyun'].filter(id => qi >= BD_PARTY[id].joinAfterQuestIdx).map(id => BD_PARTY[id]);
  }catch(e){ return []; }
}
window.BD_joinedMembers = bdJoinedMembers;

// ---- 메인 퀘스트 정의 (기획서 11번) ----
const QUESTS = [
  { id:'prologue', chapter:'프롤로그', title:'지킴이 배지를 받다',
    type:'main',
    desc:'지킴이 배지를 받았다. 화살표를 따라가 방치된 쓰레기 더미를 정화해 보자. (가까이 가서 F로 조사)',
    objectives:[{t:'주변 방치된 쓰레기 정화하기',need:1,cur:0}],
    reward:{ lv:1, skill:null, card:'문화의집', gold:35 } },
  { id:'ch1', chapter:'1장', title:'와우리 - 문화의집으로 가는 길',
    type:'main',
    desc:'❗ 표시가 있는 와우리 주민(은지·세아·재현)에게 말을 걸어 부탁을 듣고, 위험 요소를 정화해 주자. 해결하면 다시 찾아가 알려 주자.',
    objectives:[{t:'주민의 부탁 해결',need:2,cur:0}],
    reward:{ lv:2, skill:'fan', card:'봉담와우도서관', gold:70 } },
  { id:'ch2', chapter:'2장', title:'상리 - 도서관과 공원길',
    type:'main',
    desc:'❗ 표시가 있는 상리 주민(서연·재이 등)의 부탁을 듣고, 공원길의 위험 요소를 정화해 주자.',
    objectives:[{t:'주민의 부탁 해결',need:2,cur:0}],
    reward:{ lv:3, skill:'wash', card:'봉담도서관', gold:70 } },
  { id:'ch3', chapter:'3장', title:'동화리 - 문화와 체험의 거리',
    type:'main',
    desc:'❗ 표시가 있는 동화리 주민(하늘·재현 등)의 부탁을 듣고, 아이들이 다니는 거리의 위험 요소를 정화해 주자.',
    objectives:[{t:'주민의 부탁 해결',need:2,cur:0}],
    reward:{ lv:4, skill:'cheer', card:'어린이문화센터', gold:95 } },
  { id:'ch4', chapter:'4장', title:'수영리 - 안전하게 돌아가는 길',
    type:'main',
    desc:'해가 저물었다. ❗ 표시가 있는 수영리 주민(약사 도윤·은지 어머니)의 부탁을 듣고, 어두운 귀갓길을 정리하자.',
    objectives:[{t:'주민의 부탁 해결',need:2,cur:0}],
    reward:{ lv:5, skill:'light', card:'안전지킴이집', gold:95 } },
  { id:'final', chapter:'최종장', title:'봉담 안전 지도 완성',
    type:'main',
    desc:'배지가 이끄는 문화의집 앞에 나타난 「쌓여있던 위험들」을 정화하고 안전 지도를 완성하자.',
    objectives:[{t:'최종 보스 정화',need:1,cur:0}],
    reward:{ lv:5, skill:null, card:'봉담안전지도', gold:100 } },
];

// ---- 서브 퀘스트 (선택 과제) ----
const SUB_QUESTS = [
  { id:'sub_clean3', type:'sub', title:'깨끗한 거리 만들기', accepted:false,
    desc:'봉담 곳곳의 위험 요소를 3곳 정화하기',
    objectives:[{t:'위험 요소 정화',need:3,cur:0}], reward:{ gold:60 } },
  { id:'sub_cards', type:'sub', title:'봉담 시설 탐방', accepted:false,
    desc:'봉담의 시설 카드를 3장 모으기',
    objectives:[{t:'시설 카드 수집',need:3,cur:0}], reward:{ gold:60 } },
];
// ---- NPC 퀘스트 (주민들의 부탁) ----
const NPC_QUESTS = [
  { id:'npc_hyunji', type:'npc', giver:'임현지', title:'임현지의 부탁', accepted:false,
    desc:'와우도서관 앞 임현지에게 말을 걸어 주기',
    objectives:[{t:'임현지와 대화',need:1,cur:0}], reward:{ gold:35 } },
  { id:'npc_dohyun', type:'npc', giver:'사서 도현', title:'정도현의 부탁', accepted:false,
    desc:'봉담 와우 도서관의 신입 사서 도현이 도서관 주변 정리를 부탁했다.',
    objectives:[{t:'정도현과 대화',need:1,cur:0}], reward:{ gold:35 } },
  // ── (v160) 배지 통신으로 도착하는 주민 부탁 ──
  { id:'npc_seoyeon', type:'npc', giver:'서연', title:'서연의 부탁', accepted:false,
    desc:'[배지 통신] "상리 공원에서 자주 노는 서연이야. 요즘 공원이 무섭다는 애들이 많아… 지킴이가 자주 들러 주면 다들 좋아할 거야!"',
    objectives:[{t:'공원 들러서 안전 확인하기',need:2,cur:0}], reward:{ gold:30 } },
  { id:'npc_haneul', type:'npc', giver:'하늘', title:'하늘의 부탁', accepted:false,
    desc:'[배지 통신] "어린이문화센터 안내데스크의 하늘이에요. 아이들 간식이랑 물품이 부족한데, 편의점에서 물건을 좀 사다 주실 수 있나요?"',
    objectives:[{t:'상점에서 물건 구매하기',need:2,cur:0}], reward:{ gold:30 } },
  // ── (v193) 새 주민 연계 심부름 퀘스트 — 저장은 배열 인덱스 기준이므로 반드시 끝에만 추가 ──
  { id:'npc_junho', type:'npc', giver:'준호', title:'준호의 부탁', accepted:false,
    desc:'[배지 통신] "체육 강사 준호예요! 야외 수업 전에 아이들이 쉬는 공원이 안전한지 봐줄 수 있어요? 공원에 들러 확인해 주면 든든할 것 같아요."',
    objectives:[{t:'공원에 들러 안전 확인하기',need:1,cur:0}], reward:{ gold:25 } },
  { id:'npc_yeongja', type:'npc', giver:'영자', title:'영자씨의 부탁', accepted:false,
    desc:'[배지 통신] "장보러 나온 영자예요. 요즘 무릎이 안 좋아서… 상점에서 필요한 물건 하나만 대신 사다 줄 수 있을까? 고마워서 어쩌나."',
    objectives:[{t:'상점에서 물건 사다 주기',need:1,cur:0}], reward:{ gold:25 } },
  { id:'npc_sunim', type:'npc', giver:'순임', title:'순임 할머니의 부탁', accepted:false,
    desc:'[배지 통신] "경로당 순임이야. 요즘 동네 사람들 얼굴 보기가 힘들어… 지킴이가 다니면서 이웃들한테 인사 좀 전해 줄래?"',
    objectives:[{t:'동네 주민과 인사하기',need:3,cur:0}], reward:{ gold:35 } },
];
window.BD_SUB_QUESTS = SUB_QUESTS;
window.BD_NPC_QUESTS = NPC_QUESTS;
window.BD_QUESTS = QUESTS;

// ── 보스 잠금 판정 ──
// isBoss 위험요소는 최종장(final)에 도달하기 전까지 화면·미니맵·길안내·상호작용에서 제외.
// (v274) 기획서 §17.2 — 최종장 시작 조건: 핵심 스탬프 6개 이상 + 지역 안전 조각 4개
window.BD_canStartFinale = function(){
  try {
    return (BD_PROGRESS.safety.collectedSafetyFragmentIds.length >= 4);   /* (v287) 조각 = 지역 지도 100% ×4 */
  } catch(e){ return false; }
};
window.BD_hazardLocked = function(o){
  try {
    if(!o || !o.isBoss) return false;
    // (v274) 신규 진행(스탬프·조각) 조건을 만족하면 기존 퀘스트 순서와 무관하게 개방
    if (window.BD_canStartFinale && BD_canStartFinale()) return false;
    if(!window.BD || typeof BD.questIdx !== 'number') return true;
    const fi = QUESTS.findIndex(function(q){ return q.id === 'final'; });
    return BD.questIdx < fi;
  } catch(e){ return true; }
};

// ---- 레벨별 성장 (작업7 기반값) ----
// (v160) 파티 공용 레벨 — 최대 10 (메인 스토리만으로는 만렙 미도달)
const LV_TABLE = {
  1:{maxHp:100,maxMp:20,atk:14},
  2:{maxHp:115,maxMp:20,atk:16},
  3:{maxHp:130,maxMp:20,atk:18},
  4:{maxHp:145,maxMp:20,atk:21},
  5:{maxHp:160,maxMp:20,atk:24},
  6:{maxHp:175,maxMp:20,atk:27},
  7:{maxHp:190,maxMp:20,atk:30},
  8:{maxHp:210,maxMp:20,atk:33},
  9:{maxHp:230,maxMp:20,atk:37},
  10:{maxHp:250,maxMp:20,atk:42},
};
const LV_MAX = 10;

// ---- 상태 ----
const BD = {
  lv:1, hp:100, mp:20, maxHp:100, maxMp:20, atk:14,
  crystal:0,
  unlockedSkills:['sticker'],   // 보유한 스킬 아이템 목록
  equippedSkill:'sticker',      // 현재 장착(사용 중)인 스킬 — E키로 이 스킬만 발동
  trackedQuest:null,            // 추적 중인 퀘스트 id (HUD에 표시)
  gameCleared:false,            // (v132) 최종장 클리어 여부 — 안전지도 다시보기 노출용
  questIdx:0,                 // 현재 퀘스트 단계
  purified:{},               // 정화된 오브젝트 id
  cards:[],                  // 획득 시설 카드
  // 작업5: 지역 진행
  regionIdx:0,               // 현재 지역 (0~4)
  regionCleared:{},          // 클리어한 지역 id
  // 작업6: 장비 (슬롯별 강화 레벨, null이면 미장착)
  equip:{ core:{elem:'N',lv:0}, armor:{elem:'N',lv:0}, charm:{lv:0} },
  // 작업10: 아이템 인벤토리
  items:{ snack:0, drink:0, revive:0 },
  // (v160) 공용 경험치 / 장비 v2
  xp:0,
  equipV2:{ protector:null, memento:null, owned:{} },
  // 전투 임시
  _battleElem:'N',
  // (v128) 시작 시 고른 지킴이 유형 ('patrol'|'guide'|'fix'|null)
  startType:null,
};
window.BD = BD;
// (v270) 기획서 §22.1-6 — BD.gold와 playerGold 통일: BD.gold는 playerGold의 별칭.
//  아케이드/노래방 보상(BD.gold += n)이 필드·상점 골드에 즉시 반영된다.
try {
  Object.defineProperty(BD, 'gold', {
    configurable: true,
    get: function () { return (typeof playerGold !== 'undefined') ? playerGold : 0; },
    set: function (v) { try { playerGold = Number(v) || 0; } catch (e) { } }
  });
} catch (eG) { }
window.BD_ELEM = ELEM;
window.BD_FAMILY = FAMILY;
window.BD_SKILLS = SKILLS;
window.BD_multiplier = multiplier;

// ---- 스킬 장착 시스템 ----
// 보유한 스킬(unlockedSkills) 중 하나를 장착(equippedSkill). E키 스킬은 장착된 것만 발동.
function bdEquipSkill(skillId){
  if(!BD.unlockedSkills.includes(skillId)) return false;
  BD.equippedSkill = skillId;
  try { bdSave(); } catch(e){}
  return true;
}
window.BD_equipSkill = function(skillId){
  if(bdEquipSkill(skillId)){
    const sk = SKILLS.find(s=>s.id===skillId);
    try { bdToast('🏅 장착: ' + (sk?sk.name:skillId)); } catch(e){}
    if(typeof window.BD_renderSkillPanel==='function') window.BD_renderSkillPanel();
  }
};
// 스킬 인벤토리 패널 렌더 (E 가방의 "스킬" 탭)
window.BD_renderSkillPanel = function(){
  const panel = document.getElementById('inv-skill-panel');
  if(!panel) return;
  const eq = BD.equippedSkill || (BD.unlockedSkills[0]||'sticker');
  let html = '<div class="bd-skillpanel-title">🏅 배지 스킬 장착</div>'
    + '<div class="bd-skillpanel-desc">전투 중 E키로 사용할 스킬을 하나 선택하세요. 한 번에 하나만 장착할 수 있어요.</div>'
    + '<div class="bd-skillpanel-list">';
  SKILLS.forEach(function(sk){
    const owned = BD.unlockedSkills.includes(sk.id);
    const equipped = (sk.id === eq);
    const e = ELEM[sk.elem] || {icon:'✦', name:'', cls:''};
    html += '<div class="bd-skillcard' + (owned?'':' bd-skill-locked') + (equipped?' bd-skill-equipped':'') + '"'
      + (owned && !equipped ? ' onclick="window.BD_equipSkill(\''+sk.id+'\')"' : '') + '>'
      + '<div class="bd-skillcard-ic">' + e.icon + '</div>'
      + '<div class="bd-skillcard-body">'
      + '<div class="bd-skillcard-name">' + (owned ? sk.name : '??? (미획득)') + (equipped ? ' <span class="bd-skill-badge">장착 중</span>' : '') + '</div>'
      + '<div class="bd-skillcard-desc">' + (owned ? sk.desc : '퀘스트 보상으로 획득하세요') + '</div>'
      + '<div class="bd-skillcard-meta"><span class="bd-elem-tag ' + e.cls + '">' + e.name + '</span>'
      + '<span class="bd-skillcard-mp">' + ((sk.sp||0)>0?('SP '+sk.sp):'SP +1 회복') + '</span></div>'
      + '</div>'
      + (owned && !equipped ? '<div class="bd-skillcard-action">장착</div>' : '')
      + (equipped ? '<div class="bd-skillcard-action bd-skillcard-on">✓</div>' : '')
      + '</div>';
  });
  html += '</div>';
  panel.innerHTML = html;
};

// ---- 저장/로드 ----
function bdSave(){
  try{
    // 필드/전투에서 가장 최근에 바뀐 HP를 저장값에 반영한다.
    if(typeof window.BD_syncHP === 'function') {
      const liveHp = (window.HSR && HSR.active && HSR.hero) ? HSR.hero.hp : heroHP;
      window.BD_syncHP(liveHp, false);
    }
    const data = {
      sv: (window.BD_SAVE_VERSION || 1),
      lv:BD.lv, hp:BD.hp, mp:BD.mp, maxHp:BD.maxHp, maxMp:BD.maxMp, atk:BD.atk,
      partyState:BD.partyState||{}, equipV2:BD.equipV2||null, xp:BD.xp||0, parkVisited:!!BD._parkVisited, parkBonus:BD._parkBonus||0, fitAtk:BD._fitAtk||0, fitDone:BD._fitDone||{}, houseVisited:!!BD._houseVisited, libVisited:!!BD._libVisited, augments:(BD._augments||[]).slice(), damiSeen:(BD._damiSeen||[]).slice(), codex:BD.codex||{}, ultUnlocked:!!BD._ultUnlocked, pendingSkillIntro:BD._pendingSkillIntro||null,
      crystal:BD.crystal, unlockedSkills:BD.unlockedSkills.slice(), equippedSkill:BD.equippedSkill, trackedQuest:BD.trackedQuest||null, subQuestProgress:(typeof SUB_QUESTS!=='undefined'?SUB_QUESTS.map(q=>q.objectives[0].cur||0):[]), subQuestAccepted:(typeof SUB_QUESTS!=='undefined'?SUB_QUESTS.map(q=>!!q.accepted):[]), npcQuestAccepted:(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS.map(q=>!!q.accepted):[]), npcQuestProgress:(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS.map(q=>q.objectives[0].cur||0):[]),
      questIdx:BD.questIdx, purified:BD.purified, cards:BD.cards.slice(),
      mainQuestProgress:(typeof QUESTS!=='undefined'?QUESTS.map(q=>q.objectives[0].cur||0):[]),
      regionIdx:BD.regionIdx, regionCleared:BD.regionCleared,
      equip:BD.equip, items:BD.items, savedAt: Date.now(),
      charId: (typeof selectedCharacter!=='undefined'?selectedCharacter:1),   // (v270) startType 저장 중단
      gold: (typeof playerGold!=='undefined'?playerGold:0),
      greetedResidents: Array.isArray(BD.greetedResidents)?BD.greetedResidents.slice():[],
      gameCleared: !!BD.gameCleared,
    };
    // (v93) 슬롯 구조(auto/1/2/3)를 보존하며 병합 저장 —
    //  예전엔 이 한 줄이 슬롯 전체를 최상위 형식으로 덮어써 자동 저장분이 사라졌다.
    try{
      var __prevRaw = localStorage.getItem(SAVE_KEY);
      var __prev = __prevRaw ? JSON.parse(__prevRaw) : null;
      if (__prev && typeof __prev === 'object'){
        ['auto','1','2','3'].forEach(function(k){
          if (__prev[k] && !data[k]) data[k] = __prev[k];
        });
      }
    }catch(eMg){}
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    // 현재 슬롯이 지정돼 있으면 그 슬롯에도 자동 반영
    if(typeof window.__bdCurrentSlot === 'number'){
      try { localStorage.setItem('bongdam_guardian_slot_' + window.__bdCurrentSlot, JSON.stringify(data)); } catch(e){
        try { if (typeof bdToast === 'function') bdToast('⚠️ 저장 공간이 부족해 저장하지 못했어요'); } catch(e2){}
      }
    }
  }catch(e){}
}
function bdLoad(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    const d = (window.BD_migrateSave || function(x){return x;})(JSON.parse(raw));
    // 구버전 호환: 없는 필드는 기본값 유지
    if(typeof d.lv==='number') BD.lv=d.lv;
    if(typeof d.hp==='number') BD.hp=d.hp;
    if(typeof d.mp==='number') BD.mp=d.mp;
    if(typeof d.maxHp==='number') BD.maxHp=d.maxHp;
    if(typeof d.maxMp==='number') BD.maxMp=d.maxMp;
    if(typeof d.atk==='number') BD.atk=d.atk;
    if(typeof d.crystal==='number') BD.crystal=d.crystal;
    if(typeof d.gold==='number' && typeof playerGold!=='undefined') playerGold = d.gold;   // (v163+) 소지금 복원
    if(Array.isArray(d.greetedResidents)) BD.greetedResidents = d.greetedResidents.slice();   // (v163+) 인사한 주민 복원
    if(Array.isArray(d.unlockedSkills)) BD.unlockedSkills=d.unlockedSkills;
    if(typeof d.equippedSkill==='string' && BD.unlockedSkills.includes(d.equippedSkill)) BD.equippedSkill=d.equippedSkill;
    if(typeof d.trackedQuest==='string'||d.trackedQuest===null) BD.trackedQuest=d.trackedQuest;
    if(Array.isArray(d.subQuestProgress) && typeof SUB_QUESTS!=='undefined'){ d.subQuestProgress.forEach((c,i)=>{ if(SUB_QUESTS[i]) SUB_QUESTS[i].objectives[0].cur=c; }); }
    if(Array.isArray(d.subQuestAccepted) && typeof SUB_QUESTS!=='undefined'){ d.subQuestAccepted.forEach((a,i)=>{ if(SUB_QUESTS[i]) SUB_QUESTS[i].accepted=a; }); }
    if(Array.isArray(d.npcQuestAccepted) && typeof NPC_QUESTS!=='undefined'){ d.npcQuestAccepted.forEach((a,i)=>{ if(NPC_QUESTS[i]) NPC_QUESTS[i].accepted=a; }); }
    if(Array.isArray(d.npcQuestProgress) && typeof NPC_QUESTS!=='undefined'){ d.npcQuestProgress.forEach((c,i)=>{ if(NPC_QUESTS[i]) NPC_QUESTS[i].objectives[0].cur=c; }); }
    // (버그 수정) 장착 스킬 폴백: 저장된 장착 스킬이 유효하지 않을 때만 첫 스킬로
    if(!BD.equippedSkill && BD.unlockedSkills.length) BD.equippedSkill=BD.unlockedSkills[0];
    if(typeof d.questIdx==='number') BD.questIdx=d.questIdx;
    if(d.partyState && typeof d.partyState==='object') BD.partyState=d.partyState;
    if(typeof d.gameCleared==='boolean') BD.gameCleared = d.gameCleared;
    if(d.purified && typeof d.purified==='object') BD.purified=d.purified;
    // ── 메인 퀘스트 장별 진행도 복원 ──
    if(Array.isArray(d.mainQuestProgress) && typeof QUESTS!=='undefined'){
      d.mainQuestProgress.forEach((c,i)=>{ if(QUESTS[i]) QUESTS[i].objectives[0].cur = Math.min(QUESTS[i].objectives[0].need, c||0); });
    } else if(typeof QUESTS!=='undefined'){
      // 구버전 세이브 호환: purified 개수로 진행도를 재구성
      // (완료한 장은 need만큼 채우고, 남은 정화 수를 현재 장에 배분)
      try {
        let total = 0;
        Object.keys(BD.purified||{}).forEach(k=>{ if(BD.purified[k] && k!=='final_boss_1') total++; });
        for(let i=0;i<QUESTS.length;i++){
          const need = QUESTS[i].objectives[0].need;
          if(i < BD.questIdx){ QUESTS[i].objectives[0].cur = need; total -= need; }
          else if(i === BD.questIdx){ QUESTS[i].objectives[0].cur = Math.max(0, Math.min(need, total)); }
          else { QUESTS[i].objectives[0].cur = 0; }
        }
      } catch(e){}
    }
    if(Array.isArray(d.cards)) BD.cards=d.cards;
    if(typeof d.regionIdx==='number') BD.regionIdx=d.regionIdx;
    if(d.regionCleared && typeof d.regionCleared==='object') BD.regionCleared=d.regionCleared;
    if(d.equip && typeof d.equip==='object'){
      if(d.equip.core) BD.equip.core=d.equip.core;
      if(d.equip.armor) BD.equip.armor=d.equip.armor;
      if(d.equip.charm) BD.equip.charm=d.equip.charm;
    }
    // (v160) 구버전 세이브 마이그레이션: A/B/C → W/G/M
    try{
      const _mig = { A:'W', B:'G', C:'M' };
      if(BD.equip.core  && _mig[BD.equip.core.elem])  BD.equip.core.elem  = _mig[BD.equip.core.elem];
      if(BD.equip.armor && _mig[BD.equip.armor.elem]) BD.equip.armor.elem = _mig[BD.equip.armor.elem];
    }catch(e){}
    if(d.items && typeof d.items==='object'){
      if(typeof d.items.snack==='number') BD.items.snack=d.items.snack;
      if(typeof d.items.drink==='number') BD.items.drink=d.items.drink;
      if(typeof d.items.revive==='number') BD.items.revive=d.items.revive;
    }
    if(d.equipV2 && typeof d.equipV2==='object') BD.equipV2 = d.equipV2;
    if(typeof d.xp==='number') BD.xp = d.xp;
    if(typeof d.parkVisited==='boolean') BD._parkVisited = d.parkVisited;
    BD._houseVisited = !!d.houseVisited;   // (v237 병합) 문화의집 첫 이용 보너스 복원
    BD._augments = Array.isArray(d.augments) ? d.augments.slice() : [];   // (v238) 증강 복원
    BD._damiSeen = Array.isArray(d.damiSeen) ? d.damiSeen.slice() : [];   // (v239) 담이 대사 기록 복원
    BD.codex = (d.codex && typeof d.codex==='object') ? d.codex : {};      // (v239) 안전 수첩 복원
    BD._ultUnlocked = !!d.ultUnlocked;                                     // (v239) 융합 궁극기 해금 복원
    BD._pendingSkillIntro = d.pendingSkillIntro || null;                   // (v239) 미안내 신규 스킬
    try{ if(typeof window.BD_syncUltUI === 'function') window.BD_syncUltUI(); }catch(e){}
    BD._libVisited = !!d.libVisited;       // (v237 병합) 도서관 첫 방문 보너스 복원
    if(typeof d.parkBonus==='number') BD._parkBonus = d.parkBonus;
    if(typeof d.fitAtk==='number') BD._fitAtk = d.fitAtk;              // (v281b) 공원 운동 보너스 복원
    if(d.fitDone && typeof d.fitDone==='object') BD._fitDone = d.fitDone;
    // (v128) 시작 유형·캐릭터 복원
    // (v270) startType 복원 제거 — 보너스 폐지로 무의미
    if(typeof d.charId==='number' && typeof selectedCharacter!=='undefined') selectedCharacter = d.charId;
    if(typeof window.BD_syncHP === 'function') window.BD_syncHP(BD.hp, false);
  }catch(e){}
}
window.BD_save = bdSave;
window.BD_load = bdLoad;

// =========================================================================
// 세이브 슬롯 시스템 — 3개 슬롯에 각각 저장/불러오기
// =========================================================================
const SLOT_KEY_PREFIX = 'bongdam_guardian_slot_';
const SLOT_COUNT = 3;
function slotKey(i){ return SLOT_KEY_PREFIX + i; }
function currentSaveData(){
  if(typeof window.BD_syncHP === 'function') {
    const liveHp = (window.HSR && HSR.active && HSR.hero) ? HSR.hero.hp : heroHP;
    window.BD_syncHP(liveHp, false);
  }
  return {
    sv: (window.BD_SAVE_VERSION || 1),
    lv:BD.lv, hp:BD.hp, mp:BD.mp, maxHp:BD.maxHp, maxMp:BD.maxMp, atk:BD.atk,
    partyState:BD.partyState||{}, equipV2:BD.equipV2||null, xp:BD.xp||0, parkVisited:!!BD._parkVisited, parkBonus:BD._parkBonus||0, fitAtk:BD._fitAtk||0, fitDone:BD._fitDone||{}, houseVisited:!!BD._houseVisited, libVisited:!!BD._libVisited, augments:(BD._augments||[]).slice(), damiSeen:(BD._damiSeen||[]).slice(), codex:BD.codex||{}, ultUnlocked:!!BD._ultUnlocked, pendingSkillIntro:BD._pendingSkillIntro||null,
    crystal:BD.crystal, unlockedSkills:BD.unlockedSkills.slice(), equippedSkill:BD.equippedSkill, trackedQuest:BD.trackedQuest||null, subQuestProgress:(typeof SUB_QUESTS!=='undefined'?SUB_QUESTS.map(q=>q.objectives[0].cur||0):[]), subQuestAccepted:(typeof SUB_QUESTS!=='undefined'?SUB_QUESTS.map(q=>!!q.accepted):[]), npcQuestAccepted:(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS.map(q=>!!q.accepted):[]), npcQuestProgress:(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS.map(q=>q.objectives[0].cur||0):[]),
    questIdx:BD.questIdx, purified:BD.purified, cards:BD.cards.slice(),
    mainQuestProgress:(typeof QUESTS!=='undefined'?QUESTS.map(q=>q.objectives[0].cur||0):[]),
    regionIdx:BD.regionIdx, regionCleared:BD.regionCleared,
    equip:BD.equip, items:BD.items,
    gold: (typeof playerGold!=='undefined'?playerGold:0),
    greetedResidents: Array.isArray(BD.greetedResidents)?BD.greetedResidents.slice():[],
    gameCleared: !!BD.gameCleared,
    savedAt: Date.now(),
  };
}
function saveToSlot(i){
  try {
    /* (v147) 슬롯 저장에 «어느 맵의 어디에 서 있었는지»가 빠져 있었다.
       그래서 이어하기를 하면 진행도만 살아나고 위치는 구맵(봉담 광장)으로 돌아가,
       하던 곳이 아닌 엉뚱한 데서 다시 시작됐다. */
    var d = currentSaveData();
    try{
      d.stage  = (typeof currentStage !== 'undefined') ? currentStage : 1;
      d.heroX  = (typeof heroX !== 'undefined') ? heroX : 0.5;
      d.heroY  = (typeof heroY !== 'undefined') ? heroY : 0.8;
      d.hpLive = (typeof heroHP !== 'undefined') ? heroHP : null;
      d.savedAt = Date.now();
    }catch(e2){}
    localStorage.setItem(slotKey(i), JSON.stringify(d)); return true;
  }
  catch(e){ return false; }
}
function loadSlotMeta(i){
  try {
    const raw = localStorage.getItem(slotKey(i));
    if(!raw) return null;
    const d = JSON.parse(raw);
    const chapter = (typeof QUESTS!=='undefined' && QUESTS[d.questIdx]) ? QUESTS[d.questIdx].chapter : '';
    const region = (typeof REGIONS!=='undefined' && REGIONS[d.regionIdx]) ? REGIONS[d.regionIdx].name : '';
    return { lv:d.lv||1, chapter, region, savedAt:d.savedAt||0, cards:(d.cards||[]).length };
  } catch(e){ return null; }
}
function loadFromSlot(i){
  try {
    const raw = localStorage.getItem(slotKey(i));
    if(!raw) return false;
    // 슬롯 데이터를 메인 SAVE_KEY에 복사한 뒤 bdLoad
    localStorage.setItem(SAVE_KEY, raw);
    bdLoad();
    /* (v147) 저장해 둔 맵·위치로 그대로 복귀 */
    try{
      var d = JSON.parse(raw);
      if (d && typeof d.stage !== 'undefined' && typeof STAGES !== 'undefined' && STAGES[d.stage]){
        currentStage = Number(d.stage);
        if (typeof d.heroX === 'number') heroX = d.heroX;
        if (typeof d.heroY === 'number') heroY = d.heroY;
        try{ camX = heroX; camY = heroY; }catch(eC){}
        if (typeof d.hpLive === 'number' && typeof heroHP !== 'undefined'){
          heroHP = d.hpLive;
          try{ if (typeof window.BD_syncHP === 'function') window.BD_syncHP(heroHP, false); }catch(eH){}
        }
        try{
          var _loc = document.getElementById('gs-loc');
          if (_loc && STAGES[currentStage]) _loc.textContent = STAGES[currentStage].name;
        }catch(eL){}
      }
    }catch(e2){}
    return true;
  } catch(e){ return false; }
}
function deleteSlot(i){ try { localStorage.removeItem(slotKey(i)); return true; } catch(e){ return false; } }
function anySlotHasSave(){ for(let i=0;i<SLOT_COUNT;i++){ if(loadSlotMeta(i)) return true; } return false; }
function fmtSaveTime(ts){
  if(!ts) return '';
  const d = new Date(ts);
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
window.BD_saveToSlot = saveToSlot;
window.BD_loadFromSlot = loadFromSlot;
window.BD_slotMeta = loadSlotMeta;
window.BD_anySlotHasSave = anySlotHasSave;

// 세이브 슬롯 UI (mode: 'load' 불러오기 / 'save' 저장하기)
function openSlotUI(mode){
  let modal = document.getElementById('bd-slot-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-slot-modal'; modal.className='bd-modal bd-modal-top'; document.body.appendChild(modal); }
  const isLoad = (mode === 'load');
  let rows = '';
  for(let i=0;i<SLOT_COUNT;i++){
    const meta = loadSlotMeta(i);
    if(meta){
      rows += '<div class="bd-slot' + (isLoad?' bd-slot-click':'') + '"' + (isLoad?(' onclick="window.BD_slotAction(\'load\','+i+')"'):'') + '>'
        + '<div class="bd-slot-num">슬롯 ' + (i+1) + '</div>'
        + '<div class="bd-slot-info">'
        + '<div class="bd-slot-line1">Lv.' + meta.lv + ' · ' + (meta.chapter||'진행 중') + '</div>'
        + '<div class="bd-slot-line2">' + (meta.region||'') + ' · 카드 ' + meta.cards + '개 · ' + fmtSaveTime(meta.savedAt) + '</div>'
        + '</div>'
        + (isLoad
            ? '<button class="bd-slot-del" onclick="event.stopPropagation();window.BD_slotAction(\'delete\','+i+')">🗑</button>'
            : '<button class="bd-slot-save" onclick="window.BD_slotAction(\'save\','+i+')">덮어쓰기</button>')
        + '</div>';
    } else {
      rows += '<div class="bd-slot bd-slot-empty">'
        + '<div class="bd-slot-num">슬롯 ' + (i+1) + '</div>'
        + '<div class="bd-slot-info"><div class="bd-slot-line1" style="color:#64748b;">— 비어 있음 —</div></div>'
        + (isLoad ? '' : '<button class="bd-slot-save" onclick="window.BD_slotAction(\'save\','+i+')">여기 저장</button>')
        + '</div>';
    }
  }
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:460px;">'
    + '<div class="bd-modal-title">' + (isLoad ? '📂 이어하기 — 슬롯 선택' : '💾 저장하기 — 슬롯 선택') + '</div>'
    + '<div class="bd-slot-list">' + rows + '</div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-slot-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
}
window.BD_openSlotUI = openSlotUI;
window.BD_slotAction = function(action, i){
  if(action === 'load'){
    if(loadFromSlot(i)){
      window.__bdCurrentSlot = i;  // 이후 자동저장이 이 슬롯에 반영됨
      try { document.getElementById('bd-slot-modal').classList.remove('show'); } catch(e){}
      try { hideTitle(); } catch(e){}
      try {
        if(typeof enterGameScreen === 'function') enterGameScreen('지킴이', true);
        else if(typeof window.enterGameScreen === 'function') window.enterGameScreen('지킴이', true);
      } catch(e){}
      try { bdToast('슬롯 ' + (i+1) + ' 불러오기 완료'); } catch(e){}
    } else { try { bdToast('빈 슬롯이에요'); } catch(e){} }
  } else if(action === 'save'){
    if(saveToSlot(i)){ try { bdToast('슬롯 ' + (i+1) + '에 저장했어요'); } catch(e){} openSlotUI('save'); }
  } else if(action === 'delete'){
    if(deleteSlot(i)){ try { bdToast('슬롯 ' + (i+1) + ' 삭제'); } catch(e){} openSlotUI('load'); }
  }
};

// ---- 토스트 ----
let toastTimer=null;
function bdToast(msg, ms){
  const el = document.getElementById('bd-toast');
  if(!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), ms||1800);
}
window.BD_toast = bdToast;

// ---- 퀘스트 HUD ----
window.__bdRQH = function(){ try{ return renderQuestHud(); }catch(e){} };   /* (v332) 검수용 노출 */
function renderQuestHud(){
  const hud = document.getElementById('bd-quest-hud');
  if(!hud) return;
  /* (v287) 배지를 받기 전에는 임무 HUD를 숨긴다 — «대화 전에 배지를 받은» 듯 보이던 문제 */
  try{
    if (window.BD_PROGRESS && BD_PROGRESS.story && BD_PROGRESS.story.tutorialFlags
        && !BD_PROGRESS.story.tutorialFlags.badgeGiven && (BD.questIdx||0) === 0 && !BD.trackedQuest){
      hud.style.display = 'none'; return;
    }
  }catch(eHB){}
  // (v240c) 추적 중이면 그 임무를, 아니면 현재 메인 임무를 '참고용'으로 표시.
  //  안내선·화살표는 여전히 추적 중일 때만 (자유 탐험).
  const tid = BD.trackedQuest;
  const all = QUESTS.concat(typeof SUB_QUESTS!=='undefined'?SUB_QUESTS:[]).concat(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS:[]);
  let q = tid ? all.find(x => (x.id||('main'+QUESTS.indexOf(x))) === tid) : null;
  const untracked = !q;
  if(!q){
    const idx = (typeof BD.questIdx === 'number') ? BD.questIdx : 0;
    q = QUESTS[idx] || QUESTS[0];
  }
  if(!q){ hud.style.display='none'; return; }
  try{
    const head = hud.querySelector('.bd-hud-head');
    if(head) head.textContent = untracked ? '◇ 현재 임무 (J: 임무창)' : '◈ 추적 중인 임무';
  }catch(e){}
  hud.style.display='block';
  // EXP 바 하단 바로 아래에 오도록 top을 동적 계산 (전체화면/큰 화면에서 겹침 방지)
  try {
    const cv = document.getElementById('game-canvas');
    if(cv && window.__bdExpBarBottom){
      const rect = cv.getBoundingClientRect();
      // 캔버스 내부 픽셀 → 화면 CSS 픽셀 변환
      const cssY = rect.top + window.__bdExpBarBottom * (rect.height / cv.height);
      hud.style.top = Math.round(cssY + 10) + 'px';
    }
  } catch(e){}
  const chLabel = q.chapter ? (q.chapter + ' · ' + q.title) : (q.giver ? (q.giver+' · '+q.title) : q.title);
  /* (v332) 부탁·서브 퀘스트 추적 중에도 «지금 몇 장·무슨 임무»가 보이게 메인 제목을 함께 표시 */
  let __mainLine = '';
  try{
    const __mq = QUESTS[(typeof BD.questIdx === 'number') ? BD.questIdx : 0];
    if (__mq && __mq !== q) __mainLine = (__mq.chapter ? __mq.chapter + ' · ' : '') + __mq.title;
  }catch(eML){}
  const __chEl = hud.querySelector('.bd-ch');
  __chEl.style.whiteSpace = 'pre-line';
  __chEl.textContent = __mainLine ? (__mainLine + '\n\u21b3 ' + chLabel) : chLabel;
  const o = q.objectives[0];
  const cur = Math.min(o.cur||0, o.need);
  const done = cur >= o.need;
  hud.querySelector('.bd-obj').innerHTML =
    o.t + ' <b>(' + cur + '/' + o.need + ')</b>';
  // 완료 상태: 초록 체크 + "임무 완료" 표시
  hud.classList.toggle('done', done);
}
window.BD_renderQuest = renderQuestHud;
// 첫 목표 자동 추적 — 아직 아무 임무도 추적하지 않을 때, 현재 진행 중인 메인 임무를 추적한다.
// (프롤로그/세이브 로드 직후 길안내가 뜨도록. 수동으로 조작한 뒤에는 다시 개입하지 않음.)
window.BD_autoTrackFirstQuest = function(){
  try {
    if(window.__bdAutoTrackDone) return;                  // 세션당 1회만
    if(!window.BD || BD.trackedQuest) return;             // 이미 추적 중이면 그대로 둠
    if(typeof QUESTS === 'undefined' || !QUESTS.length) return;
    // 현재 진행 중인 메인 임무 (questIdx 기준)
    const idx = (typeof BD.questIdx === 'number') ? BD.questIdx : 0;
    const target = QUESTS[idx] || QUESTS[0];
    if(!target || !target.id) return;
    BD.trackedQuest = target.id;
    window.__bdAutoTrackDone = true;
    if(typeof renderQuestHud === 'function') renderQuestHud();
    try { bdSave(); } catch(e){}
  } catch(e){}
};

// 퀘스트 추적 토글
window.BD_trackQuest = function(questId){
  window.__bdAutoTrackDone = true;  // 수동 조작 후에는 자동 추적이 개입하지 않음
  if(BD.trackedQuest === questId){ BD.trackedQuest = null; }  // 이미 추적 중이면 해제
  else { BD.trackedQuest = questId; }
  renderQuestHud();
  bdSave();
  // 퀘스트 창이 열려있으면 상세 갱신 (추적 버튼 상태 반영)
  if(window.__bdSelectedQuestIdx !== undefined && typeof window.BD_selectQuest==='function'){
    window.BD_selectQuest(window.__bdSelectedQuestIdx);
  }
  try{ bdToast(BD.trackedQuest ? '📌 임무를 추적합니다' : '추적 해제'); }catch(e){}
};

// =========================================================================
// 퀘스트 로그 (J키) — 메인 / 서브 / NPC 퀘스트 순으로 표시
// =========================================================================
function questProgressText(q){
  if(!q.objectives || !q.objectives.length) return '';
  const o = q.objectives[0];
  return o.t + ' (' + Math.min(o.cur||0, o.need) + '/' + o.need + ')';
}
window.BD_openQuestLog = function(){
  let modal = document.getElementById('bd-questlog-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'bd-questlog-modal';
    modal.className = 'bd-modal bd-modal-top';
    document.body.appendChild(modal);
  }
  // 모든 퀘스트를 카테고리별로 수집
  const mainQ = QUESTS[BD.questIdx];
  const cats = [
    { key:'main', icon:'◈', name:'메인 임무', items: mainQ ? [mainQ] : [] },
    { key:'sub',  icon:'◈', name:'전설 임무', items: (typeof SUB_QUESTS!=='undefined'?SUB_QUESTS.filter(q=>q.accepted):[]) },
    { key:'npc',  icon:'!',  name:'월드 임무', items: (typeof NPC_QUESTS!=='undefined'?NPC_QUESTS.filter(q=>q.accepted):[]) },
  ];
  // 전역에 퀘스트 목록 저장 (클릭 시 상세 표시용)
  window.__bdQuestList = [];
  cats.forEach(c => c.items.forEach(q => window.__bdQuestList.push({cat:c.key, q})));

  const box = document.createElement('div');
  box.className = 'bd-qlog2-box';

  // 좌측: 카테고리별 퀘스트 목록
  let leftHtml = '<div class="bd-qlog2-left">';
  cats.forEach(function(cat){
    leftHtml += '<div class="bd-qlog2-cat"><span class="bd-qlog2-cat-ic bd-qcat-'+cat.key+'">'+cat.icon+'</span>'+cat.name+'</div>';
    if(cat.items.length){
      cat.items.forEach(function(q){
        const idx = window.__bdQuestList.findIndex(x=>x.q===q);
        const sub = q.chapter ? q.chapter : (q.giver||'');
        const tracked = (BD.trackedQuest === q.id);
        leftHtml += '<div class="bd-qlog2-item'+(tracked?' tracked':'')+'" data-qidx="'+idx+'" onclick="window.BD_selectQuest('+idx+')">'
          + '<div class="bd-qlog2-item-diamond bd-qcat-'+cat.key+'">◇</div>'
          + '<div class="bd-qlog2-item-txt"><div class="bd-qlog2-item-title">'+q.title+(tracked?' <span class="bd-qlog2-pin">📌</span>':'')+'</div>'
          + (sub?('<div class="bd-qlog2-item-sub">'+sub+'</div>'):'')+'</div>'
          + '</div>';
      });
    } else {
      leftHtml += '<div class="bd-qlog2-empty">없음</div>';
    }
  });
  leftHtml += '</div>';

  // 우측: 상세 (초기엔 첫 퀘스트)
  const rightHtml = '<div class="bd-qlog2-right" id="bd-qlog2-detail"></div>';

  box.innerHTML = '<div class="bd-qlog2-header"><span class="bd-qlog2-htitle">📖 진행 중</span>'
    + '<button class="bd-qlog2-close" onclick="document.getElementById(\'bd-questlog-modal\').classList.remove(\'show\')">✕</button></div>'
    + '<div class="bd-qlog2-main">' + leftHtml + rightHtml + '</div>';
  modal.innerHTML = '';
  modal.appendChild(box);
  modal.classList.add('show');
  // 첫 퀘스트 상세 표시
  window.BD_selectQuest(0);
};
// 퀘스트 선택 → 우측 상세 갱신
window.BD_selectQuest = function(idx){
  window.__bdSelectedQuestIdx = idx;
  const entry = (window.__bdQuestList||[])[idx];
  const detail = document.getElementById('bd-qlog2-detail');
  if(!detail) return;
  // 선택 하이라이트
  document.querySelectorAll('.bd-qlog2-item').forEach(function(el){
    el.classList.toggle('sel', el.getAttribute('data-qidx')===String(idx));
  });
  if(!entry){ detail.innerHTML = '<div class="bd-qlog2-empty2">진행 중인 임무가 없습니다.</div>'; return; }
  const q = entry.q;
  const o = q.objectives && q.objectives[0];
  const prog = o ? (Math.min(o.cur||0, o.need) + ' / ' + o.need) : '';
  const done = o ? ((o.cur||0) >= o.need) : false;
  // 보상 아이콘 구성
  const rw = q.reward || {};
  let rewardHtml = '';
  const rewards = [];
  if(rw.lv) rewards.push({ic:'⭐', v:'Lv.'+rw.lv});
  if(rw.card) rewards.push({ic:'🗂', v:'카드'});
  if(rw.skill) rewards.push({ic:'🏅', v:'스킬'});
  if(rewards.length){
    rewardHtml = '<div class="bd-qlog2-reward-label">임무 완료 보상:</div><div class="bd-qlog2-rewards">';
    rewards.forEach(function(r){
      rewardHtml += '<div class="bd-qlog2-reward"><div class="bd-qlog2-reward-ic">'+r.ic+'</div><div class="bd-qlog2-reward-v">'+r.v+'</div></div>';
    });
    rewardHtml += '</div>';
  }
  // 추적 버튼 (현재 추적 중인지에 따라 라벨 변경)
  const qid = q.id;
  const isTracked = (BD.trackedQuest === qid);
  const trackBtn = '<button class="bd-qlog2-track'+(isTracked?' on':'')+'" onclick="window.BD_trackQuest(\''+qid+'\')">'
    + '<span class="bd-qlog2-track-ic">◈</span>' + (isTracked ? '추적 중지' : '임무 추적') + '</button>';

  detail.innerHTML = '<div class="bd-qlog2-dtitle">'+q.title+'</div>'
    + (entry.cat==='main' && q.chapter ? '<div class="bd-qlog2-dchapter">'+q.chapter+'</div>' : '')
    + (q.giver ? '<div class="bd-qlog2-dgiver">의뢰: '+q.giver+'</div>' : '')
    + '<div class="bd-qlog2-objrow'+(done?' done':'')+'"><span class="bd-qlog2-objmark">'+(done?'☑':'▷')+'</span>'
    + '<span class="bd-qlog2-objtext">'+(o?o.t:'')+'</span>'
    + (prog?'<span class="bd-qlog2-objprog">'+prog+'</span>':'')+'</div>'
    + (q.desc ? '<div class="bd-qlog2-ddesc">'+q.desc+'</div>' : '')
    + rewardHtml
    + '<div class="bd-qlog2-trackrow">'+trackBtn+'</div>';
};
window.BD_toggleQuestLog = function(){
  const modal = document.getElementById('bd-questlog-modal');
  if(modal && modal.classList.contains('show')){ modal.classList.remove('show'); }
  else { window.BD_openQuestLog(); }
};

// =========================================================================
// 튜토리얼 — 프롤로그 직후 핵심 루프(이동→조사→전투→정화)를 단계별 안내
// =========================================================================
const TUTORIAL_KEY = 'bongdam_guardian_tutorial_done';
const TUT_STEPS = [
  { id:'move',    icon:'🕹️', title:'이동하기',
    text:'W A S D 또는 방향키로 지킴이를 움직여 보세요. (8방향 이동 가능)',
    done:'좋아요! 이동을 익혔어요.' },
  { id:'find',    icon:'🔍', title:'위험 요소 찾기',
    text:'봉담 곳곳에 방치된 위험 요소가 있어요. 수상해 보이는 곳에 다가가 보세요.',
    done:'위험 요소를 발견했어요!' },
  { id:'invest',  icon:'🅵', title:'조사하기',
    text:'위험 요소 가까이에서 F 키를 눌러 조사하세요. 지킴이 배지가 반응합니다.',
    done:'조사 성공! 전투가 시작돼요.' },
  { id:'battle',  icon:'⚔️', title:'정화 전투',
    text:'「정화 스티커」로 위험 요소를 정화하세요. 약점 속성을 노리면 더 효과적이에요!',
    done:'전투를 익혔어요.' },
  { id:'clear',   icon:'✨', title:'정화 완료',
    text:'위험 요소를 정화하면 그 자리가 깨끗해지고 카드를 얻어요. 이렇게 봉담을 지켜나가요!',
    done:'튜토리얼 완료! 이제 봉담을 지켜주세요.' },
];
let _tutStep = -1;
let _tutActive = false;
function tutorialDone(){ try { return !!localStorage.getItem(TUTORIAL_KEY); } catch(e){ return false; } }
function markTutorialDone(){ try { localStorage.setItem(TUTORIAL_KEY,'1'); } catch(e){} }
function ensureTutorialUI(){
  let el = document.getElementById('bd-tutorial');
  if(!el){
    el = document.createElement('div');
    el.id = 'bd-tutorial';
    el.innerHTML = '<div class="bd-tut-inner">'
      + '<div class="bd-tut-icon"></div>'
      + '<div class="bd-tut-body"><div class="bd-tut-title"></div><div class="bd-tut-text"></div></div>'
      /* (v120) 튜토리얼 건너뛰기 제거 */
      + '</div>';
    document.body.appendChild(el);
  }
  return el;
}
function startTutorial(){
  // (v222) 구 튜토리얼 완전 비활성 — 3층 풀 프롤로그(v217)가 대체.
  //  기존엔 _tutActive만 껐고 showTutStep()이 UI를 계속 띄우는 버그가 있었다.
  return;
}
function showTutStep(){
  const step = TUT_STEPS[_tutStep];
  if(!step){ finishTutorial(); return; }
  const el = ensureTutorialUI();
  el.querySelector('.bd-tut-icon').textContent = step.icon;
  el.querySelector('.bd-tut-title').textContent = '튜토리얼 · ' + step.title;
  el.querySelector('.bd-tut-text').textContent = step.text;
  el.classList.add('show');
}
// 특정 단계를 완료 처리하고 다음으로 (게임 로직 여러 곳에서 호출)
function tutorialAdvance(stepId){
  if(!_tutActive) return;
  const cur = TUT_STEPS[_tutStep];
  if(!cur || cur.id !== stepId) return;   // 현재 기다리는 단계만 반응
  try { if(window.BDSound) BDSound.select(); } catch(e){}
  bdToast(cur.done);
  _tutStep++;
  if(_tutStep >= TUT_STEPS.length){ finishTutorial(); }
  else setTimeout(showTutStep, 700);
}
function finishTutorial(){
  _tutActive = false;
  markTutorialDone();
  const el = document.getElementById('bd-tutorial');
  if(el) el.classList.remove('show');
  // (v140) 튜토리얼이 끝나는 순간 "이제 뭘 해야 하나" 막막함을 줄이는 마무리 안내
  setTimeout(function(){
    try {
      // (v62) 첫 정화 뒤에는 곧바로 '자유롭게'가 아니라 상점 실습으로 이어진다 — 안내 순서 정리
      var __hasShop62 = false;
      try{ var __st62 = (typeof STAGES!=='undefined') && STAGES[212];
        __hasShop62 = !!(__st62 && (__st62.objects||[]).some(function(o){ return o && (o.interactable==='shop' || /약국|편의점|슈퍼|마트/.test(String(o.label||''))); }));
      }catch(e62){}
      if (__hasShop62){
        window.BD_tip && window.BD_tip('tutorial_wrapup', { icon:'🏪', title:'회복 아이템을 준비해 볼까요?',
          text:'전투에서 다칠 수 있으니, 담이를 따라 <b>가까운 가게</b>에서 회복 아이템을 사 봐요.<br>'
             + '발 앞 <b>화살표</b>가 길을 안내할 거예요!' });
      } else {
        window.BD_tip && window.BD_tip('tutorial_wrapup', { icon:'🗺️', title:'이제 자유롭게 봉담을 돌아보세요',
          text:'위험요소는 미니맵의 붉은 점! 가까이 가면 <b>F 키</b>로 조사할 수 있어요.<br>'
             + '<b>J 키</b> 임무창에서 진행 상황을 확인할 수 있어요. 어디부터 갈지는 자유!<br>'
             + '막히면 🗺️ 안전지도를 열어 확인해 보세요!' });
      }
    } catch(e){}
  }, 1200);
}
window.BD_startTutorial = startTutorial;
window.BD_tutorialAdvance = tutorialAdvance;
window.BD_skipTutorial = function(){ finishTutorial(); bdToast('튜토리얼을 건너뛰었어요'); };
window.BD_resetTutorial = function(){ try { localStorage.removeItem(TUTORIAL_KEY); } catch(e){} };

// =========================================================================
// 상황별 1회성 안내 (v126) — 실제 게임처럼, 처음 겪는 순간에만 알려주는 팁
//  · 카드: 중요 개념 (확인 버튼, 15초 자동 닫힘)  · 토스트: 가벼운 팁
//  · 한 번 본 팁은 localStorage에 기록되어 다시 안 뜸 (진행 초기화 시 함께 리셋)
// =========================================================================
const TIPS_KEY = 'bongdam_guardian_tips_v1';
function _tipsLoad(){ try{ return JSON.parse(localStorage.getItem(TIPS_KEY)||'{}'); }catch(e){ return {}; } }
function _tipMark(id){ try{ const t=_tipsLoad(); t[id]=1; localStorage.setItem(TIPS_KEY, JSON.stringify(t)); }catch(e){} }
window.BD_tipSeen = function(id){ return !!_tipsLoad()[id]; };
window.BD_resetTips = function(){ try{ localStorage.removeItem(TIPS_KEY); }catch(e){} };
window.BD_tip = function(id, opt){
  try {
    if (window.BD_tipSeen(id)) return false;
    _tipMark(id);
    opt = opt || {};
    if (opt.toast) { bdToast(opt.text || ''); return true; }
    // ── (v222) 풀스크린 포커스 안내 — 다른 입력을 잠그고 확실히 읽게 한다 ──
    window.__bdGuideQueue = window.__bdGuideQueue || [];
    window.__bdGuideQueue.push({ icon: opt.icon || '💡', title: opt.title || '도움말', text: opt.text || '' });
    if (!window.__bdGuideOpen) BD_guideNext();
    return true;
  } catch(e){ return false; }
};
function BD_guideNext(){
  const q = window.__bdGuideQueue || [];
  // (v231) 전투 결과창·대화·컷신이 진행 중이면 끝난 뒤에 표시 (순차 연출)
  // (v239) 결과창 폐지로 게이트가 뚫려, 카드가 전투 뒤에 숨은 채 모든 키를 삼키는
  //  소프트락이 있었다 — 전투·증강 드래프트 중에도 대기한다.
  if ((window.HSR && HSR.active) || window.__bdAugOpen){ setTimeout(BD_guideNext, 600); return; }
  if (window.BD_resultOpen && BD_resultOpen()){ setTimeout(BD_guideNext, 500); return; }
  try{
    const vn = document.getElementById('dialogue-box');
    const talking = (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05) || window.__bdSceneActive;
    if (talking && q.length){ setTimeout(BD_guideNext, 500); return; }
  }catch(e){}
  const item = q.shift();
  if (!item){ window.__bdGuideOpen = false; return; }
  window.__bdGuideOpen = true;
  let ov = document.getElementById('bd-guide-ov');
  if (!ov){
    ov = document.createElement('div');
    ov.id = 'bd-guide-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10080;display:none;'
      + 'background:rgba(4,8,18,.82);cursor:pointer;'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';
    document.body.appendChild(ov);
  }
  ov.innerHTML =
    '<div style="max-width:560px;width:100%;background:rgba(13,20,40,.98);border:1px solid rgba(150,185,255,.6);'
    + 'border-radius:18px;padding:26px 28px;box-shadow:0 14px 44px rgba(0,0,0,.65);cursor:default;">'
    + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'
    +   '<div style="font-size:40px;line-height:1;">' + item.icon + '</div>'
    +   '<div style="font-family:\'Noto Serif KR\',serif;font-weight:800;font-size:21px;color:#bcd4ff;">' + item.title + '</div>'
    + '</div>'
    + '<div style="font-size:16px;line-height:1.9;color:#e8eefc;">' + item.text + '</div>'
    + '</div>'
    + '<div style="margin-top:18px;font-size:14px;color:#9fb0d0;animation:bdGuidePulse 1.6s ease-in-out infinite;">'
    + '\uD654\uBA74\uC744 \uD074\uB9AD\uD558\uBA74 \uACC4\uC18D\uB3FC\uC694</div>'
    + '<style>@keyframes bdGuidePulse{0%,100%{opacity:.55}50%{opacity:1}}</style>';
  ov.style.display = 'flex';
  try{ moveKeys = {w:false,a:false,s:false,d:false}; }catch(e){}
  try { if (window.BDSound && BDSound.heal) BDSound.heal(); } catch(e){}
  const t0 = Date.now();
  function close(){
    if (Date.now() - t0 < 450) return;      // 실수 클릭 방지
    ov.style.display = 'none';
    window.removeEventListener('keydown', onKey, true);
    ov.onclick = null;
    setTimeout(BD_guideNext, 200);          // 큐 순차 진행
  }
  function onKey(e){
    // (v239) 카드가 닫혔는데 리스너만 남았으면 스스로 정리 (입력 전면 마비 방지)
    if (ov.style.display === 'none'){ window.removeEventListener('keydown', onKey, true); return; }
    // 전투·증강·수첩이 위에 떠 있으면(카드가 가려짐) 키를 삼키지 않는다
    if ((window.HSR && HSR.active) || window.__bdAugOpen) return;
    try{ const cx=document.getElementById('bd-codex-ov'); if(cx&&cx.classList.contains('show')) return; }catch(err){}
    e.preventDefault(); e.stopImmediatePropagation(); close();
  }
  ov.onclick = close;
  window.addEventListener('keydown', onKey, true);
}
window.BD_guideOpen = function(){ return !!window.__bdGuideOpen; };
// HP 저하 감시 — takeDamage에서 호출됨. 40% 이하 첫 1회 카드, 15% 이하 첫 1회 토스트.
window.BD_tipHpCheck = function(hp, maxHp){
  try {
    const r = hp / Math.max(1, maxHp);
    if (r <= 0.15) {
      window.BD_tip('hp_crit', { toast:true, text:'⚠ 체력이 위험해요! 지금 바로 🍪 간식을 쓰거나 🌳 공원으로 가세요' });
    } else if (r <= 0.40) {
      window.BD_tip('hp_low', { icon:'❤️‍🩹', title:'체력이 많이 줄었어요 — 회복하는 법',
        text:'· 🏪 <b>동네 가게</b>(약국·편의점, 건물 앞에서 F)에서 삼각김밥(15G)·샌드위치(30G) 구매 → <b>E 가방</b>에서 사용<br>'
           + '· 🌳 <b>공원</b>에 들르면 무료로 회복돼요<br>'
           + '· ✨ 위험 요소를 정화해도 조금 회복돼요' });
    }
  } catch(e){}
};
// (v220) 구 화살표 튜토리얼은 3층 풀 프롤로그(v217)로 대체됨 — 항상 비활성.
//  조건 충족 전까지 닫히지 않는 안내 VN이 새 흐름과 충돌하던 문제도 함께 해소.
window.BD_isTutorialActive = function(){ return false; };
(function watchTutorialMove(){
  return;   // (v239) 구 튜토리얼은 담이 튜토리얼로 대체됨 — 리스너 등록 자체를 하지 않는다
  let moved = false;
  document.addEventListener('keydown', function(e){
    if(!_tutActive || moved) return;
    const k = (e.key||'').toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
      moved = true;
      tutorialAdvance('move');
    }
  }, false);
})();

// ---- 퀘스트 진행 (정화 1회마다 호출) ----
function bdQuestProgress(){
  // (v89a) 같은 정화 한 번에 진행 함수가 여러 번 불려 장이 통째로 건너뛰던 문제 방지
  try{
    var __now = Date.now();
    if (window.__bdQPLast && __now - window.__bdQPLast < 600) return;
    window.__bdQPLast = __now;
  }catch(eQP){}

  const q = QUESTS[BD.questIdx];
  if(!q) return;
  const o = q.objectives[0];
  o.cur = Math.min(o.need, o.cur+1);
  renderQuestHud();
  // (v220) 중간 정화는 짧은 배너로만 — 컷신 없이 탐색 흐름 유지
  if(o.cur < o.need){
    try{ bdToast('✨ 그림자가 흩어졌다! (' + o.cur + '/' + o.need + ')'); }catch(e){}
  }
  if(o.cur >= o.need){
    // 단계 완료 → 보상 지급
    setTimeout(()=>grantReward(q), 700);
  }
  // (v133 수정) 서브 퀘스트 "깨끗한 거리 만들기"도 함께 진행하되,
  // 토스트가 위 메인 퀘스트 안내를 곧바로 덮어써 버리던 문제를 시간차로 해결
  setTimeout(function(){ bdSubQuestProgress('sub_clean3'); }, 2000);
  bdSave();
}
window.BD_questProgress = bdQuestProgress;

// 서브/NPC 퀘스트 진행 처리
function bdSubQuestProgress(questId){
  const all = (typeof SUB_QUESTS!=='undefined'?SUB_QUESTS:[]).concat(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS:[]);
  const q = all.find(x=>x.id===questId);
  if(!q || !q.objectives || !q.objectives.length) return;
  if(!q.accepted) return; // 아직 받지 않은 임무는 진행하지 않음
  const o = q.objectives[0];
  if(o.cur >= o.need) return; // 이미 완료
  o.cur = Math.min(o.need, (o.cur||0)+1);
  if(o.cur >= o.need){
    bdToast('🔹 퀘스트 완료: ' + q.title + (q.reward&&q.reward.gold?(' (+소지금 '+q.reward.gold+'G)'):''));
    if(q.reward && q.reward.gold && typeof playerGold!=='undefined'){ playerGold += q.reward.gold; }
    // (v149 버그 수정) 완료된 서브/NPC 퀘스트를 계속 추적 중인 상태로 남겨두면
    // 길안내가 이미 끝난 목표를 계속 가리키게 됨 — 완료 시 추적 자동 해제
    if(BD.trackedQuest === questId){ BD.trackedQuest = null; }
  } else {
    bdToast('🔹 ' + q.title + ' (' + o.cur + '/' + o.need + ')');
  }
  // 추적 중인 퀘스트가 진행되면 HUD 갱신
  if(BD.trackedQuest === questId && typeof renderQuestHud==='function') renderQuestHud();
  bdSave();
}
window.BD_subQuestProgress = bdSubQuestProgress;
// (v148) 길안내 시스템에서 NPC 퀘스트 완료 여부를 확인할 수 있도록 노출
window.BD_isSubQuestDone = function(questId){
  try {
    const all = (typeof SUB_QUESTS!=='undefined'?SUB_QUESTS:[]).concat(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS:[]);
    const q = all.find(x=>x.id===questId);
    if(!q || !q.objectives || !q.objectives.length) return true; // 존재 안 하면 안내 대상 아님
    return q.objectives[0].cur >= q.objectives[0].need;
  } catch(e){ return true; }
};

// 임무 받기 (NPC 대화나 조건 달성 시 호출) — 받아야 목록에 표시됨
function bdAcceptQuest(questId){
  const all = (typeof SUB_QUESTS!=='undefined'?SUB_QUESTS:[]).concat(typeof NPC_QUESTS!=='undefined'?NPC_QUESTS:[]);
  const q = all.find(x=>x.id===questId);
  if(!q || q.accepted) return false;
  q.accepted = true;
  bdToast('📜 새 임무: ' + q.title);
  bdSave();
  return true;
}
window.BD_acceptQuest = bdAcceptQuest;

function grantReward(q){
  const r = q.reward || {};
  /* (v282) 최종장은 보스를 실제로 정화했을 때만 완료 — 보상·컷신·엔딩 이전에 차단 */
  if(q.id === 'final'){
    var _bossDone282 = false;
    try{ _bossDone282 = !!(window.BD && BD.purified && BD.purified['final_boss_1']); }catch(eB282){}
    if(!_bossDone282){
      try{
        if (q.objectives && q.objectives[0]) q.objectives[0].cur = 0;
        if (typeof bdToast === 'function') bdToast('👑 마지막은 광장의 「쌓여있던 위험들」이에요!');
        setTimeout(renderQuestHud, 300); bdSave();
      }catch(eR282){}
      return;
    }
  }
  // 프롤로그(첫 임무) 완료 시 서브 퀘스트 개방 — 이제 목록에 표시됨
  if(q.id === 'prologue'){
    // (v133) 다른 보상 토스트(레벨업·스킬·카드)와 겹치지 않도록 시간차를 두고 순서대로 안내
    if(typeof bdAcceptQuest==='function'){
      setTimeout(function(){ bdAcceptQuest('sub_clean3'); }, 2800);
      setTimeout(function(){ bdAcceptQuest('sub_cards'); }, 3500);
    }
    // 서브 퀘스트가 조용히 묻히지 않도록, 존재와 확인 방법을 한 번은 카드로 짚어줌
    setTimeout(function(){
      try {
        window.BD_tip && window.BD_tip('sub_quests_intro', { icon:'📜', title:'새로운 임무가 생겼어요',
          text:'"깨끗한 거리 만들기"와 "봉담 시설 탐방" 임무가 열렸어요.<br>'
             + '위험 요소를 정화하거나 카드를 모으면 자동으로 진행돼요.<br>'
             + '<b>J 키</b>로 언제든 확인하고 추적할 수 있어요.' });
      } catch(e){}
    }, 4300);
    // (v132) 봉담 이야기 업적: 지킴이 배지
    try { if(typeof achieveTrack==='function') achieveTrack('story_prologue', 1); } catch(e){}
  }
  // 레벨업
  if(r.lv && r.lv > BD.lv){ setLevel(r.lv); bdToast('🎉 Lv.'+r.lv+' 달성! 최대 체력·공격력 상승'); }
  // 스킬 해금
  if(!window.__bdMapSkillMode && r.skill && !BD.unlockedSkills.includes(r.skill)){   // (v283) 스킬은 '지역 지도 완성' 보상으로 이관
    // (v239) 조작 설명은 전투 밖에서 해봐야 와닿지 않는다.
    //  다음 전투 첫 턴에 「NEW」 연출 + 미니게임 튜토리얼로 미룬다.
    try{ BD._pendingSkillIntro = r.skill; }catch(e){}
    BD.unlockedSkills.push(r.skill);
    const sk = SKILLS.find(s=>s.id===r.skill);
    // 스킬을 아이템으로 획득 (자동 장착 X — 인벤토리에서 직접 교체)
    setTimeout(()=>bdToast('🎁 새 스킬 아이템 획득: '+(sk?sk.name:r.skill)+' — E 가방에서 장착 가능'), 1400);
    // (v126) 첫 스킬 획득 시 장착 방법 카드
    setTimeout(function(){
      try {
        window.BD_tip && window.BD_tip('first_skill', { icon:'🎁', title:'새 스킬을 얻었어요 — 장착하는 법',
          text:'<b>E 키</b>로 인벤토리를 열고 새 스킬을 눌러 <b>장착</b>하세요.<br>'
             + '스킬마다 속성(💨 바람·🌿 자연·🔧 시설)이 달라서, 적의 약점에 맞는 스킬이 훨씬 강해요!' });
      } catch(e){}
    }, 3200);
  }
  // 시설 카드
  if(r.card && !BD.cards.includes(r.card)){
    BD.cards.push(r.card);
    setTimeout(()=>bdToast('🗂 시설 카드 획득: '+r.card), 2100);
    // 서브 퀘스트 "봉담 시설 탐방"(카드 N장) 진행 — (v133) 스킬/카드 토스트와 안 겹치게 지연
    setTimeout(function(){ if(typeof bdSubQuestProgress==='function') bdSubQuestProgress('sub_cards'); }, 2700);
  }
  // 정화 결정
  // (v135) 골드 보상 — 장별 완료 축하 골드 (다른 보상 토스트들이 끝난 뒤 표시)
  if(r.gold && typeof playerGold!=='undefined'){
    playerGold += r.gold;
    setTimeout(()=>bdToast('💰 +' + r.gold + 'G 받았어요!'), 5500);
  }
  // 완료된 장의 컷신 재생 (다음 단계로 넘어가기 전 q.id 기준)
  const doneScene = { prologue:'ch1_intro', ch1:'ch1_done', ch2:'ch2_done', ch3:'ch3_done', ch4:'ch4_done', final:'final_done' }[q.id];
  // 다음 단계로
  if(BD.questIdx < QUESTS.length-1){ BD.questIdx++; }
  // ── (v160) 동료 합류 연출 + 배지 통신 서브퀘 자동 수락 ──
  try{
    const _joinLines = {
      sea:    ['🎮 세아가 파티에 합류했다!', '세아: "겜에서 배운 대로… 버프는 제가 뿌릴게요! 대신 룰렛이라 뭐가 나올진 몰라요, 헤헤."'],
      jaei:   ['🔍 재이가 파티에 합류했다!', '재이: "사건 현장은 관찰이 절반이야. 약점은 내가 밝혀낼게. …키 얘기는 하지 말고."'],
      jaehyun:['🧢 재현이가 파티에 합류했다!', '재현: "…남 일 아니니까. 뒤는 내가 막을게."'],
    };
    Object.keys(window.BD_PARTY||{}).forEach(function(id){
      const k = window.BD_PARTY[id];
      if(k.joinAfterQuestIdx === BD.questIdx){
        const L = _joinLines[id] || ['🤝 '+k.name+'가 파티에 합류했다!'];
        setTimeout(function(){ bdToast(L[0]); }, 6200);
        if(L[1]) setTimeout(function(){ bdToast(L[1]); }, 8600);
        // (v72) 합류 = 함께 다니는 사이 → 연락처도 자연스럽게 교환 (문자 도착의 전제)
        setTimeout(function(){ try{ if(window.BD_addContact) BD_addContact(k.name); }catch(e){} }, 9600);
      }
    });
    // (v72) 구 '배지 통신 부탁'·'주민 심부름' 자동 수락 제거 —
    //  만난 적 없는 사람의 부탁이 장 전환마다 임무창에 꽂히고 추적을 가로채던 발생원.
    //  부탁은 이제 현장에서 ❗ 주민과 직접 대화해 수락하는 체계(hzq_)로 일원화한다.
  }catch(e){}
  // 완료한 임무를 추적 중이었다면 다음 메인 임무를 자동 추적 (길안내 연속성)
  try { if(BD.trackedQuest === q.id && QUESTS[BD.questIdx]) BD.trackedQuest = QUESTS[BD.questIdx].id; } catch(e){}
  // (v76) 리 클리어 → 마무리 대사 + 다음 리로 이어주는 친구 전화 연출
  try{ if (window.BD_regionClearScene) BD_regionClearScene(q.id); }catch(eRC){}
  // 4장 완료 → 최종 보스 개방 안내
  if(q.id === 'ch4'){ setTimeout(function(){ try{ bdToast('👑 쌓여있던 위험들이 와우리 광장에 나타났다!'); }catch(e){} }, 7600); }
  // (v132) 최종장 완료 — 봉담 이야기 업적 + 클리어 플래그 저장 (안전지도에서 다시보기 노출용)
  if(q.id === 'final'){
    // (v69) 최종장 완료는 '최종 보스를 실제로 정화했을 때'만 인정 —
    //  일반 위험요소 정화로도 목표가 채워져 보스를 잡지 않아도 엔딩이 나오던 문제
    var _bossDone = false;
    try{ _bossDone = !!(window.BD && BD.purified && BD.purified['final_boss_1']); }catch(eB){}
    if (!_bossDone){
      try{
        // 목표 게이지를 되돌려 '보스 정화'가 남아 있음을 명확히 한다
        if (q.objectives && q.objectives[0]) q.objectives[0].cur = 0;
        if (typeof bdToast === 'function') bdToast('👑 마지막은 광장의 「쌓여있던 위험들」이에요!');
      }catch(eR){}
    } else {
      try { if(typeof achieveTrack==='function') achieveTrack('story_final', 1); } catch(e){}
      BD.gameCleared = true;
      try { bdSave(); } catch(e){}
    }
  }
  // (버그 수정) clearRegion()이 어디서도 호출되지 않아 안전지도 퍼센트가
  // 실제 진행과 무관하게 항상 0%로 고정돼 있던 문제 — 장 완료 시 지역 클리어 처리 연결
  if (['ch1','ch2','ch3','ch4','final'].includes(q.id)) {
    try { if (typeof clearRegion === 'function') clearRegion(); } catch(e){}
  }
  setTimeout(renderQuestHud, 300);
  bdSave();
  // 컷신 재생 (완료 대사 → 필요 시 다음 장 도입)
  if(doneScene){
    // (v220) 구역당 마무리 컷신 1회만 — 다음 장 인트로는 자동 재생하지 않는다.
    //  다음 행선지는 각 마무리 대사의 마지막 줄(배지 통신)로만 안내하고, 이동은 플레이어가 직접 한다.
    const chain = { ch1:['ch1_done'], ch2:['ch2_done'], ch3:['ch3_done'], ch4:['ch4_done'], prologue:['prologue_done'], final:['final_done'] }[q.id] || [doneScene];
    const isFinal = (q.id === 'final');
    setTimeout(function(){
      // (v231) 정화 완료 결과창의 [확인]을 누른 뒤에 스토리가 이어지도록 대기
      (function waitResult(){
        if (window.BD_resultOpen && BD_resultOpen()) return setTimeout(waitResult, 400);
      let i=0;
      (function playChain(){
        if(i>=chain.length){
          // 최종장 완료 후 엔딩 화면
          if(isFinal && typeof showEnding==='function') setTimeout(showEnding, 600);
          return;
        }
        playScene(chain[i++], playChain);
      })();
      })();   // waitResult
    }, 900);
  }
}

function setLevel(lv){
  BD.lv = lv;
  // 장비 보너스까지 반영 (recalcStats는 hoisting된 function 선언)
  if(typeof recalcStats==='function'){ recalcStats(); }
  else { const t=LV_TABLE[lv]||LV_TABLE[LV_MAX]; BD.maxHp=t.maxHp; BD.maxMp=t.maxMp; BD.atk=t.atk; }
  BD.hp=BD.maxHp; BD.mp=BD.maxMp;   // 레벨업 시 전회복
  // 기존 게임 HP 동기화
  try{ if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false); }catch(e){}
}
window.BD_setLevel = setLevel;

// ── 자가수복 + 진단 (v124) ──
// 구버전 세이브에서 "정화 기록은 있는데 퀘스트 보상/진행이 누락"된 교착 상태를 복구한다.
// 현재 임무의 진행도가 이미 목표 이상이면, 컷신 없이 보상만 지급하고 다음 장으로 넘긴다.
window.BD_repairAndDiagnose = function(){
  try{ window.BD_syncQuestNeeds && BD_syncQuestNeeds(); }catch(eSN282){}
  try {
    if(!window.BD || typeof QUESTS === 'undefined') return;
    let jumped = 0;
    while (BD.questIdx < QUESTS.length - 1) {
      const q = QUESTS[BD.questIdx];
      if (!q || q.objectives[0].cur < q.objectives[0].need) break;
      const r = q.reward || {};
      if (r.lv && r.lv > BD.lv) setLevel(r.lv);
      if (r.skill && !BD.unlockedSkills.includes(r.skill)) BD.unlockedSkills.push(r.skill);
      if (r.card && !BD.cards.includes(r.card)) {
        BD.cards.push(r.card);
        try { if (typeof bdSubQuestProgress === 'function') bdSubQuestProgress('sub_cards'); } catch(e){}
      }
      if (q.id === 'prologue' && typeof bdAcceptQuest === 'function') {
        bdAcceptQuest('sub_clean3'); bdAcceptQuest('sub_cards');
      }
      const prevId = q.id;
      BD.questIdx++;
      if (BD.trackedQuest === prevId && QUESTS[BD.questIdx]) BD.trackedQuest = QUESTS[BD.questIdx].id;
      jumped++;
    }
    if (jumped > 0) {
      const nq = QUESTS[BD.questIdx];
      bdToast('⏩ 이전 정화 기록 반영 — ' + (nq ? nq.chapter + ' 「' + nq.title + '」부터 이어서!' : '진행 동기화 완료'));
      if (typeof renderQuestHud === 'function') renderQuestHud();
      bdSave();
    }
    // ── 화면 진단 토스트: 스크린샷만으로 상태를 알 수 있게 ──
    try {
      const st = (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null;
      let here = 0, hereAll = 0, g = 0, gAll = 0;
      const locked = (o) => (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(o));
      if (typeof STAGES !== 'undefined') {
        Object.keys(STAGES).forEach(function(k){
          (STAGES[k].objects || []).forEach(function(o){
            if (o.interactable !== 'hazard' || locked(o)) return;
            gAll++;
            const pur = o._purified || (typeof window.BD_isPurified === 'function' && window.BD_isPurified(o.hazardId || o.id || o.label));
            if (!pur) g++;
            if (st && STAGES[k] === st) { hereAll++; if (!pur) here++; }
          });
        });
      }
      // (v71) 개발용 진단 토스트 — 플레이 중에는 띄우지 않는다 (에디터 모드에서만)
      setTimeout(function(){
        var devOn = false;
        try{
          devOn = !!(window.BD_EDITOR && (BD_EDITOR.on || BD_EDITOR.enabled))
               || !!document.querySelector('.bd-editor-panel.open')
               || /[?&]bdDiag=1/.test(location.search);
        }catch(eD){}
        if (!devOn) return;
        bdToast('🧩 진단 — 이 지역 위험요소 ' + here + '/' + hereAll + ' · 봉담 전체 ' + g + '/' + gAll + ' 남음');
      }, 1400);
    } catch(e){}
  } catch(e){}
};

// ---- 정화 상태 ----
function isPurified(id){ return !!BD.purified[id]; }
function markPurified(id){ BD.purified[id]=true; bdSave();
  try{ renderQuestHud(); }catch(eH){}   /* (v315) 좌측 임무 HUD가 0/100 로 잠시 정체되던 문제 */
  // (v273) 노선 해금·안전 조각은 BD_Chapter.check()가 §11 조건(시설 스탬프+지역 정화)으로 전담.
  //  (v272의 '정화만으로 즉시 해금' 임시 훅은 장 완료 조건을 우회해 제거)
}
window.BD_isPurified = isPurified;
window.BD_markPurified = markPurified;

// =========================================================================
// 전투 훅: 기존 HSR 전투와 연결
// =========================================================================

// 몬스터 계열 판정: 기존 HSR.enemy에 family가 없으면 현재 지역/기본값 사용
function currentEnemyFamily(){
  try{
    if(window.HSR && HSR.enemy && HSR.enemy.bdFamily) return HSR.enemy.bdFamily;
  }catch(e){}
  // 지역 계열을 우선 반영
  try{ if(typeof currentRegion==='function'){ return currentRegion().family; } }catch(e){}
  return window.BD_currentFamily || 'pollute';
}
window.BD_currentFamily = 'pollute';

// 배지 스킬 서브메뉴 생성/토글 (전투 커맨드에 주입)
function buildSkillMenu(){
  let menu = document.getElementById('bd-skill-menu');
  if(menu) return menu;
  menu = document.createElement('div');
  menu.id = 'bd-skill-menu';
  // 커맨드 영역에 붙임
  const cmd = document.getElementById('hsr-cmd') || document.body;
  cmd.appendChild(menu);
  return menu;
}
function refreshSkillMenu(){
  const menu = buildSkillMenu();
  menu.innerHTML = '';
  SKILLS.forEach(sk=>{
    const el = document.createElement('div');
    const unlocked = BD.unlockedSkills.includes(sk.id);
    // (v239) 자원은 SP 가 아니라 PP(사용 횟수)
    const inBattle = !!(window.HSR && HSR.active);
    const ppLeft = window.BD_PP ? BD_PP.get(sk.id) : Infinity;
    const ppOk = !inBattle || !window.BD_PP || BD_PP.canUse(sk.id);
    el.className = 'bd-skill' + (!unlocked?' bd-locked':'') + (unlocked&&!ppOk?' bd-nomp':'');
    const e = ELEM[sk.elem];
    // 상성 마크 — 현재 상대하는 위험요소 기준
    let markHtml = '';
    try{
      if(inBattle && window.BD_MATCH){
        const _fam = (typeof currentEnemyFamily==='function') ? currentEnemyFamily() : null;
        const m = BD_MATCH.of(sk.elem, _fam);
        if(m !== 'none'){
          markHtml = '<span class="bd-match" style="color:'+BD_MATCH.color(m)+';font-weight:900;margin-left:4px">'
                   + BD_MATCH.mark(m) + '</span>';
        }
      }
    }catch(err){}
    const mgBadge = window.BD_MG ? BD_MG.badge(BD_MG.typeOf(sk.id)) : '';
    const ppText = window.BD_PP ? BD_PP.dots(sk.id) : '';
    el.innerHTML =
      '<div class="bd-ic">'+e.icon+'</div>'+
      '<div class="bd-nm"><b>'+(unlocked?sk.name:'??? (미해금)')+markHtml+'</b>'+
        '<small>'+(unlocked?(mgBadge+' '+sk.desc):'퀘스트로 해금됩니다')+'</small></div>'+
      '<span class="bd-elem-tag '+e.cls+'">'+e.name+'</span>'+
      '<span class="bd-mp" style="letter-spacing:1px">'+ppText+'</span>';
    if(unlocked && ppOk){
      el.onclick = ()=>{ menu.classList.remove('show'); useSkill(sk); };
    }
    menu.appendChild(el);
  });
}
function toggleSkillMenu(){
  const menu = buildSkillMenu();
  if(menu.classList.contains('show')){ menu.classList.remove('show'); return; }
  refreshSkillMenu();
  menu.classList.add('show');
}
window.BD_toggleSkillMenu = toggleSkillMenu;
window.BD_refreshSkillCards = function(){
  try{
    const m = document.getElementById('bd-skill-menu');
    if(m && m.classList.contains('show')) refreshSkillMenu();
  }catch(e){}
};

// (v160) 공용 SP 표시 (전투 정보창) — MP 바를 SP 점(핍) 표시로 교체
function injectMpBar(){
  if(document.getElementById('bd-mpbar-inject')) { updateMpBar(); return; }
  const wrap = document.createElement('div');
  wrap.id = 'bd-mpbar-inject';
  wrap.className = 'bd-mpbar-wrap';
  wrap.innerHTML = '<div class="bd-mpbar-lbl" title="동료 스킬·아이템에 쓰는 공용 자원">동료</div><div class="bd-sp-pips" style="display:flex;gap:4px;align-items:center;"></div>';
  const hpText = document.getElementById('hsr-hero-hptext');
  if(hpText && hpText.parentElement){
    hpText.parentElement.insertBefore(wrap, hpText.nextSibling);
  } else {
    const hpBar = document.querySelector('.hsr-hpbar');
    if(hpBar && hpBar.parentElement){ hpBar.parentElement.appendChild(wrap); }
    else { return; }
  }
  updateMpBar();
}
function updateMpBar(){
  const inj = document.getElementById('bd-mpbar-inject');
  if(!inj) return;
  const box = inj.querySelector('.bd-sp-pips');
  if(!box) return;
  const max = (window.HSR && HSR.spMax) || 5;
  const cur = (window.HSR && typeof HSR.sp==='number') ? HSR.sp : 0;
  let html = '';
  for(let i=0;i<max;i++){
    html += '<span style="width:10px;height:10px;border-radius:50%;display:inline-block;'
      + (i<cur ? 'background:#ffd54a;box-shadow:0 0 6px rgba(255,213,74,0.6);' : 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);')
      + '"></span>';
  }
  box.innerHTML = html;
}
window.BD_refreshSp = updateMpBar;
window.refreshSpUI = updateMpBar;
window.BD_updateMp = updateMpBar;
window.BD_injectMpBar = injectMpBar;   // 전투 시작 시 호출용

// 스킬 사용 후 전투 스크립트로 넘길 콜백
let _afterActionCb = null;
window.BD_openSkillFor = function(cb){ _afterActionCb = cb || null; };

// 스킬 사용 → 상성 적용 데미지 (기존 hitEnemy 활용해 연출·게이지·브레이크 반영)
function useSkill(sk){
  if(!window.HSR || !HSR.active) return;
  // (v239) 스킬마다 다른 미니게임 + PP(사용 횟수) 체크
  if(window.BD_PP && !window.BD_PP.canUse(sk.id)){
    try{ say('「'+sk.name+'」 는 이번 판에서 다 썼어요 — 다른 걸 골라요'); }catch(e){}
    return;
  }
  if(window.BD_MG && !window.__bdAcSkip){
    var _mgType = BD_MG.typeOf(sk.id);
    HSR.state = 'anim';
    try{ setActionsEnabled(false); }catch(e){}
    window.BD_MG.run(_mgType, {}, function(mult){
      window.__bdAcSkip = true;
      window.__bdAcMult = mult;
      try{ useSkill(sk); } finally { window.__bdAcSkip = false; }
    });
    return;
  }
  if(window.BD_PP) BD_PP.consume(sk.id);
  // (v239) 공용 SP 폐지 — 스킬 비용은 PP(사용 횟수)로만 관리한다
  const spCost = 0;
  if(spCost > 0 && (HSR.sp||0) < spCost){
    bdToast('MP가 부족해요 — ☕ 음료나 시설에서 회복!');
    try { window.BD_tip && window.BD_tip('sp_low', { toast:true, text:'✨ 기본 공격을 하면 SP가 1 회복돼요' }); } catch(e){}
    return;
  }
  HSR.sp = Math.max(0, (HSR.sp||0) - spCost);
  if(typeof window.BD_refreshSp==='function') window.BD_refreshSp();
  const family = currentEnemyFamily();
  let mult = multiplier(sk.elem, family);
  // (v238) 오답 대처: 잘못된 속성 스킬은 역효과 (피해 70% 감소)
  let _wrongHit = false;
  // (v239) 약점 + PERFECT 면 사용 횟수를 돌려준다 — 잘 쓰면 소모가 없다
  try{
    const _isWeakSk = (mult > 1) && !_wrongHit;
    let _refund = (window.__bdMgGrade === 'PERFECT');
    // (v239) 증강 '알뜰한 손': GOOD 도 35% 확률로 환급
    if(!_refund && window.__bdMgGrade === 'GOOD' && window.BD_AUG && BD_AUG.has('refund_luck')){
      _refund = Math.random() < 0.35;
    }
    if(_isWeakSk && _refund && window.BD_PP){
      if(BD_PP.refund(sk.id)) say('완벽한 대처! 「'+sk.name+'」 횟수를 돌려받았어요');
    }
  }catch(e){}
  try{
    const _wr = window.BD_WRONG ? window.BD_WRONG[family] : null;
    if(_wr && sk.elem === _wr.elem){
      _wrongHit = true; mult = 0.6;   // (v34) 오답 페널티 완화 0.3→0.6 — 스킬이 기본기보다 약하게 체감되던 주범
      try{ if(typeof say==='function') say(_wr.msg); }catch(e){}
      try{ if(window.BD_DAMI_TIPS) BD_DAMI_TIPS.onWrongHit(_wr.msg); }catch(e){}   // (v239) 담이 해설
      try{ if(window.BD_FX){ const en=document.getElementById('hsr-u-enemy'); BD_FX.onHit('wrong', en); } }catch(e){}
    }
  }catch(e){}
  // (v240h) 시전 연출 — 스킬별 포즈 컷 + 런지 + 스킬 이펙트 시트 (기본기·카드 공통 경로)
  try{
    try{ var __uh=document.querySelector('.hsr-hero'); if(__uh) __uh.classList.add('hsr-lunge-r'); }catch(e){}
    setTimeout(function(){ try{ var __u3=document.querySelector('.hsr-hero'); if(__u3) __u3.classList.remove('hsr-lunge-r'); }catch(e){} }, 700);
    bdHeroAtkPose(560, sk.id);
    if(window.BD_FX && BD_FX.skillSheet) BD_FX.skillSheet(sk.id);
  }catch(e){}
  let base = Math.round((BD.atk||HSR.hero.atk||14) * sk.power);
  // (v160) 공격력 버프(세아 등) 반영
  if(typeof window.BD_heroAtkMult==='function'){ base = Math.round(base * window.BD_heroAtkMult()); }
  // 작업6: 배지 코어 속성이 스킬 속성과 같으면 위력 +20%
  if(typeof coreElemMatch==='function' && coreElemMatch(sk.elem)){ base = Math.round(base*1.2); }
  // 기존 hitEnemy(base, elem, gauge)가 있으면 그걸 통해 데미지·연출 처리.
  // 단, 상성 배율은 봉담 매트릭스로 직접 곱해 반영한다.
  const dmg = Math.max(1, Math.round(base * mult));
  let applied = false;
  try{
    if(typeof window.HSR_hitEnemyRaw==='function'){
      // (v240h) raw 경로는 hitEnemy 의 피격 시트 훅을 우회하므로 여기서 직접 —
      //  속성·약점 판정이 있는 유일한 지점. 임팩트 타이밍(시전 시트 중반)에 맞춰 살짝 지연.
      try{
        const _elemFx = sk.elem, _weakFx = (mult > 1) && !_wrongHit;
        const _pfFx = (window.__bdMgGrade === 'PERFECT');
        if(_pfFx) window.__bdMgGrade = 'PERFECT_FX';   // 판정 1회 소비 (환급은 위에서 이미 읽음)
        setTimeout(function(){
          try{ if(window.BD_FX && BD_FX.hitSheet) BD_FX.hitSheet(_elemFx, _weakFx); }catch(e2){}
          try{ if(_pfFx && window.BD_FX && BD_FX.perfectFlare) BD_FX.perfectFlare(); }catch(e2){}
        }, 260);
      }catch(e2){}
      window.HSR_hitEnemyRaw(dmg, 30); applied = true;   // (v160) 스킬: 필살 게이지 +30
    } else if(HSR.enemy){
      HSR.enemy.hp = Math.max(0, HSR.enemy.hp - dmg);
    }
  }catch(e){ if(HSR.enemy) HSR.enemy.hp=Math.max(0,HSR.enemy.hp-dmg); }
  showEffPopup(sk.elem, family, dmg);
  bdSave();
  try{ if(typeof window.HSR_refreshEnemy==='function') HSR_refreshEnemy(); }catch(e){}
  // 턴 종료 콜백 (전투 스크립트의 afterPlayerAction)
  // (v239) 융합 궁극기 조건 추적 + 새 스킬 튜토리얼용 이벤트
  try{
    window.__bdLastSkillId = sk.id;
    if(window.HSR && HSR.active){
      HSR._elemsUsed = HSR._elemsUsed || {};
      HSR._elemsUsed[sk.elem] = true;
      if(typeof window.BD_checkFusionUnlock === 'function') window.BD_checkFusionUnlock();
    }
    window.dispatchEvent(new CustomEvent('bd-skill-used', { detail:{ id: sk.id, elem: sk.elem } }));
  }catch(e){}
  const cb=_afterActionCb; _afterActionCb=null;
  if(typeof cb==='function'){ setTimeout(cb, 300); }
  // (v239) 콜백을 안 걸고 호출된 경우에도 턴이 멈추지 않게 — 전투 정지 버그 방지
  else if(typeof window.BD_afterPlayerAction==='function'){ setTimeout(window.BD_afterPlayerAction, 300); }
}
window.BD_useSkill = useSkill;

function showEffPopup(elem, family, dmg){
  // 이전 팝업 제거 (겹침 방지)
  document.querySelectorAll('.bd-eff-pop').forEach(p=>p.remove());
  const eff = effLabel(elem, family);
  const enemy = document.querySelector('.hsr-enemy') || document.body;
  const pop = document.createElement('div');
  pop.className = 'bd-eff-pop ' + eff.c;
  pop.textContent = (eff.t? eff.t+'  ':'') + '-' + dmg;
  const r = enemy.getBoundingClientRect();
  pop.style.left = (r.left + r.width*0.4) + 'px';
  pop.style.top  = (r.top + r.height*0.3) + 'px';
  document.body.appendChild(pop);
  setTimeout(()=>pop.remove(), 1000);
}
window.BD_showEffPopup = showEffPopup;   // (v199) 검증·외부 연출용 노출

// 적 약점 힌트 표시
function showWeakHint(){
  let hint = document.getElementById('bd-weak-hint');
  if(!hint){
    hint = document.createElement('div'); hint.id='bd-weak-hint';
    document.body.appendChild(hint);
  }
  const family = currentEnemyFamily();
  const f = FAMILY[family];
  const e = ELEM[f.weak];
  hint.innerHTML = '약점 '+e.icon+' '+e.name;
  const enemy = document.querySelector('.hsr-enemy');
  if(enemy){
    const r = enemy.getBoundingClientRect();
    hint.style.left = r.left+'px'; hint.style.top=(r.top-30)+'px';
    hint.style.display='block';
  }
}
window.BD_showWeakHint = showWeakHint;
function hideWeakHint(){ const h=document.getElementById('bd-weak-hint'); if(h)h.style.display='none'; }
window.BD_hideWeakHint = hideWeakHint;

// =========================================================================
// 작업5: 다지역 스테이지 (5개 지역 + 게이팅)
// =========================================================================
const REGIONS = [
  { id:'wawoo',  name:'와우리',   family:'pollute', facility:'봉담와우도서관',
    desc:'문화의집으로 가는 길. 오염·정리(B) 위험이 많다.' },
  { id:'sang',   name:'상리',     family:'pollute', facility:'봉담도서관',
    desc:'도서관과 공원길. 정리 정돈이 필요한 구역.' },
  { id:'dongh',  name:'동화리',   family:'smoke',   facility:'어린이문화센터',
    desc:'문화와 체험의 거리. 연기·소음(A) 위험 지대.' },
  { id:'suyeong',name:'수영리',   family:'dark',    facility:'안전지킴이집',
    desc:'안전하게 돌아가는 길. 어둠(C) 위험 구역.' },
  { id:'house',  name:'문화의집', family:'dark',    facility:'봉담청소년문화의집',
    desc:'최종 복귀 지점. 쌓여있던 위험들과 대면.' },
];
window.BD_REGIONS = REGIONS;
function currentRegion(){ return REGIONS[BD.regionIdx] || REGIONS[0]; }
window.BD_currentRegion = currentRegion;
// 지역 잠금 여부: 이전 지역 클리어해야 열림
function regionUnlocked(idx){
  if(idx<=0) return true;
  const prev = REGIONS[idx-1];
  return !!BD.regionCleared[prev.id];
}
window.BD_regionUnlocked = regionUnlocked;
// 지역 클리어 처리 (모든 위험 정화 시 호출)
function clearRegion(){
  const r = currentRegion();
  if(BD.regionCleared[r.id]) return;
  BD.regionCleared[r.id] = true;
  bdToast('✅ '+r.name+' 정화 완료! 다음 지역이 열렸습니다.');
  // 시설 카드 지급
  if(r.facility && !BD.cards.includes(r.facility)){
    BD.cards.push(r.facility);
    setTimeout(()=>bdToast('🗂 시설 카드 획득: '+r.facility), 1400);
  }
  if(BD.regionIdx < REGIONS.length-1) BD.regionIdx++;
  bdSave();
  if(typeof window.autoSave==='function') window.autoSave('지역 클리어');
}
window.BD_clearRegion = clearRegion;

// =========================================================================
// 작업6: 장비 3슬롯 + 강화 (+0~+5)
// =========================================================================
const EQUIP_MAX = 5;
const CRYSTAL_PER_UP = [0,1,1,2,2,3]; // +1~+5 강화에 필요한 정화결정 (인덱스=목표레벨)
// 장비 보너스 계산
function coreBonus(){ // 배지 코어: 정화력(atk) 증가 + 속성 스킬 위력
  return 0;   // (v160) 강화 시스템 제거
}
function armorBonus(){ // (v160) 보호구: 기본 피해 10% 감소 + 적 계열 일치 시 추가 감소는 BD_protectorReduction에서
  BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
  return BD.equipV2.protector ? 0.10 : 0;
}
function charmBonus(){ return 0; }   // (v160) MP 시스템 제거
// (v160) 같은 속성 보호구: 해당 계열 피해 25% 감소
function protectorReduction(family){
  try{
    BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
    if(!BD.equipV2.protector) return 0;
    const f = FAMILY[family];
    if(f && f.weak === BD.equipV2.protector) return 0.25;
  }catch(e){}
  return 0;
}
window.BD_protectorReduction = protectorReduction;
// (v160) 기념품 보너스
function mementoHp(){ BD.equipV2 = BD.equipV2||{}; return BD.equipV2.memento==='hp' ? 30 : 0; }
function mementoSpd(){ BD.equipV2 = BD.equipV2||{}; return BD.equipV2.memento==='spd' ? 10 : 0; }
window.BD_mementoSpd = mementoSpd;
window.BD_coreBonus = coreBonus;
window.BD_armorBonus = armorBonus;
window.BD_charmBonus = charmBonus;
// 스킬 속성이 코어 속성과 일치하면 위력 보너스
function coreElemMatch(skillElem){ return false; }   // (v160) 코어 강화 제거
window.BD_coreElemMatch = coreElemMatch;
// (v163+) 강화 시스템 폐지 — 장비는 구매 즉시 최종 성능. 이 함수는 호출되지 않음(호환용 스텁)
function upgradeEquip(slot){
  bdToast('이 버전에서는 장비 강화가 없어요. 상점에서 새 장비를 구매하세요.');
  return false;
}
window.BD_upgradeEquip = upgradeEquip;
// 장비 속성 변경(장착)
function setEquipElem(slot, elem){
  if(slot==='core'||slot==='armor'){ BD.equip[slot].elem = elem; bdSave(); }
}
window.BD_setEquipElem = setEquipElem;

// =========================================================================
// 작업7: 레벨·스탯 성장 (장비 보너스 합산)
// =========================================================================
function recalcStats(){
  const t = LV_TABLE[BD.lv] || LV_TABLE[LV_MAX];
  BD.maxHp = t.maxHp + mementoHp() + (BD._parkBonus||0) + (BD._houseVisited ? 5 : 0);   // (v237 병합) 문화의집 첫 이용 보너스 유지
  // (v163+) 안전 스킬 트리 "체력 강화"(max_hp) 보너스 반영 — 스킬로 올린 HP가 전투에도 적용되도록
  try {
    if(typeof window.BD_getSafetyBonus === 'function'){
      BD.maxHp += window.BD_getSafetyBonus('max_hp') * 10;
    }
  } catch(e){}
  BD.maxMp = t.maxMp + (BD._libVisited ? 1 : 0);   // (v237 병합) 도서관 첫 방문 보너스 유지
  BD.atk = t.atk + (BD._fitAtk || 0);   // (v281b) 공원 운동 단련 보너스 — 재계산에도 유지
  // (v128) 시작 시 고른 지킴이 유형 보너스
  // (v270) 기획서 §5.3 — 시작 유형 능력치 보너스 제거 (외형·이름만 남김, 남·여 능력치 동일)
  if(BD.hp>BD.maxHp) BD.hp=BD.maxHp;
  if(BD.mp>BD.maxMp) BD.mp=BD.maxMp;
  try { if(typeof window.BD_syncHP === 'function') window.BD_syncHP(BD.hp, false); } catch(e){}
}
window.BD_recalcStats = recalcStats;
// (v160) 파티 공용 경험치 — 필요치: 현재 레벨 × 50. 최대 Lv.10
function xpNeed(lv){ return lv * 50; }
function gainXp(amount){
  if(BD.lv >= LV_MAX) return;
  BD.xp = (BD.xp||0) + amount;
  bdToast('✨ 파티 경험치 +' + amount);
  let leveled = false;
  while(BD.lv < LV_MAX && BD.xp >= xpNeed(BD.lv)){
    BD.xp -= xpNeed(BD.lv);
    BD.lv++;
    leveled = true;
  }
  if(leveled){
    recalcStats();
    BD.hp = BD.maxHp;   // 레벨업 시 전회복
    if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false);
    bdToast('🎉 파티 레벨 업! Lv.' + BD.lv + ' — 최대 체력·공격력 상승');
  }
  bdSave();
}
window.BD_gainXp = gainXp;

// =========================================================================
// 작업8: 시설 카드 수집 화면
// =========================================================================
const FACILITY_CARDS = {
  '문화의집':      { region:'-', desc:'봉담청소년문화의집. 청소년의 안전한 배움과 놀이 공간.' },
  '봉담와우도서관':{ region:'와우리', desc:'조용히 책과 함께하는 지식의 안전지대.' },
  '봉담도서관':    { region:'상리', desc:'지역 주민 모두를 위한 열린 도서관.' },
  '어린이문화센터':{ region:'동화리', desc:'어린이 문화·체험 프로그램의 중심.' },
  '안전지킴이집':  { region:'수영리', desc:'위기 상황에 도움을 받을 수 있는 안전 거점.' },
  '봉담청소년문화의집':{ region:'문화의집', desc:'봉담 안전 지도의 심장. 지킴이의 본거지.' },
  '봉담안전지도':  { region:'전지역', desc:'정화한 모든 시설을 이은 완성된 안전 지도!' },
};
window.BD_FACILITY_CARDS = FACILITY_CARDS;
// 카드 컬렉션 모달 열기
function openCardCollection(){
  let modal = document.getElementById('bd-card-modal');
  if(!modal){
    modal = document.createElement('div'); modal.id='bd-card-modal';
    modal.className='bd-modal';
    document.body.appendChild(modal);
  }
  const all = Object.keys(FACILITY_CARDS);
  const cells = all.map(name=>{
    const got = BD.cards.includes(name);
    const info = FACILITY_CARDS[name];
    return '<div class="bd-card '+(got?'':'bd-card-locked')+'">'
      + '<div class="bd-card-name">'+(got?name:'？？？')+'</div>'
      + '<div class="bd-card-region">'+(got?info.region:'미획득')+'</div>'
      + '<div class="bd-card-desc">'+(got?info.desc:'정화하여 획득하세요')+'</div>'
      + '</div>';
  }).join('');
  modal.innerHTML = '<div class="bd-modal-box">'
    + '<div class="bd-modal-title">🗂 시설 카드 ('+BD.cards.length+'/'+all.length+')</div>'
    + '<div class="bd-card-grid">'+cells+'</div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-card-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
}
// (v275) 기획서 §18 — 카드 메뉴 = '봉담 장소수첩': 시설 수집 기록 섹션을 함께 표시
(function bindRelease(){
  var b = document.getElementById('bge-release-export');
  if (!b) { setTimeout(bindRelease, 1200); return; }
  if (b.__bdBound) return; b.__bdBound = true;
  b.addEventListener('click', function () {
    window.__bdReleaseExport = true;
    try {
      if (typeof window.BD_exportForWeb === 'function') window.BD_exportForWeb();
      else document.getElementById('bge-web-export').click();
    } catch (e) { }
    setTimeout(function () { window.__bdReleaseExport = false; }, 4000);
  });
})();
window.BD_openCardCollection = function () {
  openCardCollection();
  try {
    setTimeout(function () {
      var modal = document.querySelector('.show[id*="card"], #bd-card-modal.show') ||
                  (function () { var els = document.querySelectorAll('.show'); return els.length ? els[els.length - 1] : null; })();
      if (!modal || modal.querySelector('#bd-place-book')) return;
      var fp = BD_PROGRESS.facility, defs = Object.values(BD_REGISTRY.FACILITY_DEFINITIONS);
      var total = defs.length, stamped = fp.facilityStampIds.length;
      var rows = defs.map(function (f) {
        var s = BD_Facility.status(f.id);
        var known = s.visited || s.stamped;
        var name = known ? f.displayName : '???';
        var chips = (s.stamped ? '🏅' : (s.experienced ? '✔체험' : (s.guided ? '📖안내' : (s.visited ? '👀발견' : '－'))));
        return '<div style="display:flex;justify-content:space-between;padding:4px 2px;border-bottom:1px dashed rgba(184,134,47,.25);font-size:12px;">' +
          '<span style="color:' + (known ? '#f3e6c8' : '#6d5c3c') + ';">' + name + '</span>' +
          '<span style="color:#d8b26a;">' + chips + '</span></div>';
      }).join('');
      var sec = document.createElement('div');
      sec.id = 'bd-place-book';
      sec.style.cssText = 'margin-top:12px;padding:10px 12px;background:rgba(29,20,8,.55);border:1px solid rgba(184,134,47,.4);border-radius:10px;text-align:left;';
      sec.innerHTML = '<div style="font-size:13px;font-weight:800;color:#f0d492;margin-bottom:6px;">📔 봉담 장소수첩 — 활동 스탬프 ' + stamped + ' / ' + total + '</div>' + rows +
        '<div style="margin-top:6px;font-size:10px;color:#9b8657;">게임 내 위치와 이동 거리는 플레이 편의를 위해 축약·재구성되었습니다.</div>';
      var inner = modal.firstElementChild || modal;
      inner.appendChild(sec);
    }, 120);
  } catch (e) { }
};

// ── 개선: 봉담 안전 지도 (정화 동기 부여) ──
//  5개 지역이 얼마나 안전해졌는지 시각화. 정화할수록 지도가 밝아짐.
function computeRegionSafety(){
  return REGIONS.map((r, idx)=>{
    let pct = 0;
    if(BD.regionCleared[r.id]) pct = 100;
    else if(idx === BD.regionIdx){
      const q = (typeof QUESTS!=='undefined') ? QUESTS[BD.questIdx] : null;
      if(q && q.objectives && q.objectives[0]){
        const o = q.objectives[0];
        pct = o.need ? Math.round(o.cur/o.need*100) : 0;
      }
    }
    return { region:r, pct, cleared:!!BD.regionCleared[r.id], unlocked:regionUnlocked(idx), current:(idx===BD.regionIdx) };
  });
}
function openSafetyMap(){
  let modal = document.getElementById('bd-safety-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-safety-modal'; modal.className='bd-modal'; document.body.appendChild(modal); }
  const data = computeRegionSafety();
  const totalPct = Math.round(data.reduce((s,d)=>s+d.pct,0) / data.length);
  const rows = data.map(d=>{
    const r = d.region;
    const stateIcon = d.cleared ? '✅' : (d.current ? '📍' : (d.unlocked ? '🔓' : '🔒'));
    const barColor = d.cleared ? '#8effa0' : (d.pct>0 ? '#ffd84d' : 'rgba(255,255,255,.15)');
    const nameStyle = d.unlocked ? '' : 'opacity:.45';
    return '<div class="bd-safety-row" style="'+nameStyle+'">'
      + '<div class="bd-safety-head"><span>'+stateIcon+' <b>'+r.name+'</b></span><span class="bd-safety-pct">'+(d.unlocked?d.pct+'%':'잠김')+'</span></div>'
      + '<div class="bd-safety-bar-wrap"><div class="bd-safety-bar" style="width:'+(d.unlocked?d.pct:0)+'%;background:'+barColor+'"></div></div>'
      + '<div class="bd-safety-desc">'+(d.unlocked? r.desc : '이전 지역을 먼저 안전하게 만들어야 열려요') + (d.cleared&&r.facility?' · 🗂 '+r.facility:'')+'</div>'
      + '</div>';
  }).join('');
  const doneCount = data.filter(d=>d.cleared).length;
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:440px;">'
    + '<div class="bd-modal-title">🗺️ 봉담 안전 지도</div>'
    + '<div class="bd-safety-total">'
    + '<div class="bd-safety-total-label">봉담 전체 안전도</div>'
    + '<div class="bd-safety-total-bar-wrap"><div class="bd-safety-total-bar" style="width:'+totalPct+'%"></div></div>'
    + '<div class="bd-safety-total-num">'+totalPct+'% 안전 · '+doneCount+'/'+data.length+' 지역 정화</div>'
    + '</div>'
    + '<div class="bd-safety-list">'+rows+'</div>'
    + (totalPct>=100 ? '<div class="bd-safety-complete">🎉 봉담이 완전히 안전해졌어요!</div>' : '')
    + (BD.gameCleared ? '<button class="bd-choice-btn" style="margin-top:8px;" onclick="document.getElementById(\'bd-safety-modal\').classList.remove(\'show\'); window.BD_showEnding&&window.BD_showEnding();">🎬 엔딩 다시 보기</button>' : '')
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-safety-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
}
window.BD_openSafetyMap = openSafetyMap;

// 업적 모달 (체력바 옆 🏆 버튼에서 열림)
window.BD_openAchievements = function(){
  let modal = document.getElementById('bd-achieve-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'bd-achieve-modal';
    modal.className = 'bd-modal bd-modal-top';
    document.body.appendChild(modal);
  }
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:520px;max-height:80vh;display:flex;flex-direction:column;">'
    + '<div class="bd-modal-title">🏆 업적</div>'
    + '<div id="bd-achieve-modal-body" style="flex:1;overflow-y:auto;padding:2px;"></div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-achieve-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
  // 원본 스코프의 렌더 함수로 업적 목록 그리기
  try { if(typeof window.BD_renderAchievePanel==='function') window.BD_renderAchievePanel('bd-achieve-modal-body'); } catch(e){}
};
window.BD_computeRegionSafety = computeRegionSafety;

// (v160) 장비 모달 — 배지/보호구/기념품 3슬롯. 강화·등급·판매 없음.
function openEquipModal(){
  if(window.HSR && HSR.active){ bdToast('전투 중에는 장비를 바꿀 수 없어요'); return; }
  BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
  let modal = document.getElementById('bd-equip-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-equip-modal'; modal.className='bd-modal'; document.body.appendChild(modal); }
  const skName = (function(){ try{ const s=SKILLS.find(x=>x.id===BD.equippedSkill); return s?(ELEM[s.elem].icon+' '+s.name):'-'; }catch(e){ return '-'; } })();
  const protOpts = Object.keys(EQUIP_SHOP).filter(k=>EQUIP_SHOP[k].slot==='protector'&&BD.equipV2.owned[k]);
  const memoOpts = Object.keys(EQUIP_SHOP).filter(k=>EQUIP_SHOP[k].slot==='memento'&&BD.equipV2.owned[k]);
  const optRow = (slot, opts)=>{
    if(!opts.length) return '<small style="color:#8b93a7">보유한 장비 없음 — 상점에서 구매하세요</small>';
    return opts.map(k=>{
      const e=EQUIP_SHOP[k]; const on = BD.equipV2[slot]===e.val;
      return '<button class="bd-equip-up" style="'+(on?'border-color:#ffd54a;color:#ffd54a;':'')+'" '
        + 'onclick="window.BD_setEquipV2(\''+slot+'\',\''+(on?'':e.val)+'\')">'+e.icon+' '+e.name+(on?' ✓':'')+'</button>';
    }).join(' ');
  };
  modal.innerHTML = '<div class="bd-modal-box">'
    + '<div class="bd-modal-title">🎒 장비 (주인공 전용)</div>'
    + '<div class="bd-equip-row"><span class="bd-equip-ic">🏅</span><span class="bd-equip-nm">배지 — 사용할 스킬 결정<br><b>'+skName+'</b> <small style="color:#9fb3d1">(전투 준비 화면에서 교체)</small></span></div>'
    + '<div class="bd-equip-row"><span class="bd-equip-ic">🛡</span><span class="bd-equip-nm">보호구<br>'+optRow('protector',protOpts)+'</span></div>'
    + '<div class="bd-equip-row"><span class="bd-equip-ic">🎁</span><span class="bd-equip-nm">기념품<br>'+optRow('memento',memoOpts)+'</span></div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-equip-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
}
// (v160) 장비 교체 — 전투 밖에서만 (openEquipModal에서 이미 차단)
window.BD_setEquipV2 = function(slot, val){
  BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
  BD.equipV2[slot] = val || null;
  if(typeof recalcStats==='function') recalcStats();
  bdSave();
  openEquipModal();   // 갱신
};
window.BD_openEquipModal = openEquipModal;

// =========================================================================
// 작업9: NPC 대화 + 상호작용 선택창
// =========================================================================
// 대사창: 여러 줄을 순차 출력, 스페이스/E/클릭으로 넘김
let _dlgLines=[], _dlgIdx=0, _dlgCb=null;
function ensureDialogBox(){
  let box = document.getElementById('bd-dialog');
  if(box) return box;
  box = document.createElement('div'); box.id='bd-dialog';
  box.innerHTML = '<div class="bd-dlg-name" id="bd-dlg-name"></div>'
    + '<div class="bd-dlg-text" id="bd-dlg-text"></div>'
    + '<div class="bd-dlg-hint">▶ 클릭 / Space / E 로 계속</div>';
  document.body.appendChild(box);
  box.addEventListener('click', advanceDialog);
  return box;
}
function showDialogLegacy(name, lines, onDone){
  const box = ensureDialogBox();
  _dlgLines = Array.isArray(lines)?lines:[String(lines)];
  _dlgIdx = 0; _dlgCb = onDone||null;
  document.getElementById('bd-dlg-name').textContent = name||'';
  box.classList.add('show');
  renderDialogLine();
}
// ── (v199) 모든 대사창을 비주얼노벨 대화창으로 통일 ──
//  showDialog 호출을 전부 playSceneVN(초상화·이름표·클릭/Space 진행)으로 위임한다.
//  VN 재생 중 새 대사가 오면 큐에 쌓았다가 순서대로 재생. VN DOM이 없을 때만 간이 창 폴백.
var _vnDlgQueue = [], _vnDlgBusy = false, _vnCurJob = null, _vnStaleAt = 0;
function _vnDlgPump(){
  if (_vnDlgBusy || !_vnDlgQueue.length) return;
  if (window.__bdSceneActive){ setTimeout(_vnDlgPump, 200); return; }   // 다른 컷신 재생 중이면 대기
  var job = _vnDlgQueue.shift();
  _vnDlgBusy = true; _vnCurJob = job;
  playSceneVN(job.arr, function(){
    _vnDlgBusy = false; _vnCurJob = null;
    try{ if (typeof job.cb === 'function') job.cb(); }
    finally { setTimeout(_vnDlgPump, 50); }
  }, true);
}
/* (v373) 대사 큐 자가 복구 — 재생 중이던 VN 이 다른 경로(주민 대화가 BD_playSceneVN 을 직접 호출·ESC·유령 정리)로 끊기면
   onDone 이 영영 안 와 _vnDlgBusy 가 참으로 남고, 이후 모든 showDialog(조사 독백→전투 시작 포함)가 조용히 사라졌다
   («조사한다» 눌러도 대사창도 전투도 안 뜸 — 한 번 꼬이면 반복). 화면에 대사창이 없는데 busy 가 0.8초 넘게 남으면 풀어 준다. */
setInterval(function(){
  try{
    if (!_vnDlgBusy){ _vnStaleAt = 0; return; }
    if (window.__bdSceneActive){ _vnStaleAt = 0; return; }
    var ov = document.getElementById('dialogue-overlay');
    var up = !!(ov && getComputedStyle(ov).display !== 'none' && ov.getBoundingClientRect().height > 2);
    if (up){ _vnStaleAt = 0; return; }
    if (!_vnStaleAt){ _vnStaleAt = Date.now(); return; }
    if (Date.now() - _vnStaleAt < 800) return;
    _vnStaleAt = 0;
    var j = _vnCurJob; _vnDlgBusy = false; _vnCurJob = null;
    try{ console.info('[v373] 끊긴 대사 큐를 복구했습니다', j && j.arr && j.arr[0] && j.arr[0].t); }catch(eI){}
    /* 끊긴 작업의 후속(예: 조사→전투)은 그대로 이어 준다 — 플레이어는 이미 «조사한다»를 골랐다 */
    try{ if (j && typeof j.cb === 'function') j.cb(); }catch(eC){}
    setTimeout(_vnDlgPump, 50);
  }catch(e){}
}, 200);
function showDialog(name, lines, onDone){
  if (!document.getElementById('dialogue-overlay')) return showDialogLegacy(name, lines, onDone);
  var arr = (Array.isArray(lines) ? lines : [String(lines)]).map(function(t){
    return { n: name || '', t: String(t) };
  });
  _vnDlgQueue.push({ arr: arr, cb: onDone || null });
  _vnDlgPump();
}
window.showDialog = showDialog;   // (v198) F키 핸들러 등 다른 스크립트 블록에서 접근
function renderDialogLine(){
  const t=document.getElementById('bd-dlg-text');
  if(t) t.textContent = _dlgLines[_dlgIdx]||'';
}
function advanceDialog(){
  _dlgIdx++;
  if(_dlgIdx>=_dlgLines.length){
    const box=document.getElementById('bd-dialog'); if(box) box.classList.remove('show');
    const cb=_dlgCb; _dlgCb=null;
    if(typeof cb==='function') cb();
  } else { renderDialogLine(); }
}
window.BD_showDialog = showDialog;

// =========================================================================
// 화자별 초상화 (비주얼 노벨 연출) — 컷신에서 화자 왼쪽에 스프라이트 표시
// =========================================================================
// 간단한 도트풍 인물 초상화 SVG 생성기 (색상만 다르게)
function _makePortrait(opts){
  const o = opts || {};
  const skin = o.skin || '#f2c9a0';
  const hair = o.hair || '#4a3423';
  const cloth = o.cloth || '#5b7bb4';
  const accent = o.accent || '#ffffff';
  const bg1 = o.bg1 || '#1a2540';
  const bg2 = o.bg2 || '#0d1428';
  const glasses = o.glasses ? `<rect x='150' y='250' width='70' height='46' rx='10' fill='none' stroke='#333' stroke-width='6'/><rect x='240' y='250' width='70' height='46' rx='10' fill='none' stroke='#333' stroke-width='6'/><line x1='220' y1='270' x2='240' y2='270' stroke='#333' stroke-width='6'/>` : '';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 640'>
    <defs><linearGradient id='pg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${bg1}'/><stop offset='1' stop-color='${bg2}'/></linearGradient></defs>
    <rect width='460' height='640' fill='url(#pg)'/>
    <ellipse cx='230' cy='560' rx='170' ry='120' fill='${cloth}'/>
    <rect x='120' y='430' width='220' height='170' rx='40' fill='${cloth}'/>
    <rect x='150' y='450' width='160' height='90' rx='20' fill='${accent}' opacity='0.25'/>
    <circle cx='230' cy='280' r='120' fill='${skin}'/>
    <path d='M110 250 Q120 120 230 120 Q340 120 350 250 Q350 180 230 175 Q110 180 110 250Z' fill='${hair}'/>
    <ellipse cx='185' cy='285' rx='13' ry='17' fill='#2a2118'/>
    <ellipse cx='275' cy='285' rx='13' ry='17' fill='#2a2118'/>
    <circle cx='189' cy='280' r='4' fill='#fff' opacity='0.8'/>
    <circle cx='279' cy='280' r='4' fill='#fff' opacity='0.8'/>
    <path d='M205 340 Q230 358 255 340' fill='none' stroke='#b5745a' stroke-width='6' stroke-linecap='round'/>
    <ellipse cx='170' cy='320' rx='16' ry='10' fill='#ffb0a0' opacity='0.5'/>
    <ellipse cx='290' cy='320' rx='16' ry='10' fill='#ffb0a0' opacity='0.5'/>
    ${glasses}
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
// 화자 이름 → 초상화 매핑 (없으면 null → 초상화 숨김, 나레이션 등)
// 문화의집 선생님 — 임현지 NPC와 같은 품질의 상세 SVG (성인 여성, 안경, 카디건)
const _TEACHER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 640'>
<defs><linearGradient id='tcd' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7a6a9a'/><stop offset='1' stop-color='#4a3f68'/></linearGradient>
<linearGradient id='tbg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2e2a48'/><stop offset='1' stop-color='#171428'/></linearGradient></defs>
<rect width='460' height='640' fill='url(#tbg)'/>
<path d='M96 476 C128 436 170 420 230 420 C290 420 332 436 364 476 C392 514 402 570 408 640 L52 640 C58 570 68 514 96 476 Z' fill='url(#tcd)'/>
<path d='M188 432 L230 474 L272 432 C298 442 314 470 320 502 L320 640 L140 640 L140 502 C146 470 162 442 188 432 Z' fill='#f0ece4'/>
<path d='M212 470 L230 640 L248 470 Z' fill='#d8d2c8' opacity='0.6'/>
<circle cx='230' cy='508' r='7' fill='#c9a86a'/><circle cx='230' cy='548' r='6' fill='#c9a86a'/>
<path d='M200 360 Q202 404 230 416 Q258 404 260 360 Z' fill='#f0c19a'/>
<path d='M230 140 C168 140 140 198 140 258 C140 330 180 388 230 388 C280 388 320 330 320 258 C320 198 292 140 230 140 Z' fill='#fce0c8'/>
<ellipse cx='142' cy='266' rx='12' ry='18' fill='#fce0c8'/><ellipse cx='318' cy='266' rx='12' ry='18' fill='#fce0c8'/>
<ellipse cx='172' cy='314' rx='24' ry='13' fill='#ffb0a0' opacity='0.45'/><ellipse cx='288' cy='314' rx='24' ry='13' fill='#ffb0a0' opacity='0.45'/>
<path d='M160 232 Q188 220 212 230' stroke='#6a4a34' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M248 230 Q272 220 300 232' stroke='#6a4a34' stroke-width='7' fill='none' stroke-linecap='round'/>
<circle cx='186' cy='276' r='20' fill='#5a3e28'/><circle cx='186' cy='278' r='10' fill='#241611'/><circle cx='179' cy='268' r='6' fill='#fff'/>
<circle cx='274' cy='276' r='20' fill='#5a3e28'/><circle cx='274' cy='278' r='10' fill='#241611'/><circle cx='267' cy='268' r='6' fill='#fff'/>
<rect x='158' y='256' width='58' height='44' rx='14' fill='none' stroke='#4a4048' stroke-width='6'/>
<rect x='244' y='256' width='58' height='44' rx='14' fill='none' stroke='#4a4048' stroke-width='6'/>
<line x1='216' y1='274' x2='244' y2='274' stroke='#4a4048' stroke-width='6'/>
<path d='M224 300 q6 8 -3 12' stroke='#e6a684' stroke-width='3' fill='none' stroke-linecap='round'/>
<path d='M206 334 Q230 342 254 334 Q246 360 230 362 Q214 360 206 334 Z' fill='#c85a6a'/>
<path d='M212 337 Q230 342 248 337 L245 346 Q230 350 215 346 Z' fill='#fff'/>
<path d='M140 254 C120 158 156 92 230 92 C304 92 340 158 320 254 C310 206 296 178 270 170 C250 150 210 150 190 170 C164 178 150 206 140 254 Z' fill='#4a3826'/>
<path d='M140 254 C128 320 132 384 156 436 C144 366 150 300 154 258 Z' fill='#3e2f1f'/>
<path d='M320 254 C332 320 328 384 304 436 C316 366 310 300 306 258 Z' fill='#3e2f1f'/>
<path d='M230 96 C300 96 332 158 322 232 C318 196 306 172 286 164 C292 146 280 116 230 114 Z' fill='#5a4632' opacity='0.6'/>
</svg>`;
// 주인공(나) — 지킴이. 갈색 포니테일 소녀 (필드 스프라이트와 톤 맞춤)
const _HERO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 640'>
<defs><linearGradient id='hcd' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8a5a3a'/><stop offset='1' stop-color='#5c3a22'/></linearGradient>
<linearGradient id='hbg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a3450'/><stop offset='1' stop-color='#141c30'/></linearGradient></defs>
<rect width='460' height='640' fill='url(#hbg)'/>
<path d='M96 476 C128 436 170 420 230 420 C290 420 332 436 364 476 C392 514 402 570 408 640 L52 640 C58 570 68 514 96 476 Z' fill='url(#hcd)'/>
<path d='M190 432 L230 470 L270 432 C296 442 312 470 318 502 L318 640 L142 640 L142 502 C148 470 164 442 190 432 Z' fill='#c98a5a'/>
<path d='M200 360 Q202 404 230 416 Q258 404 260 360 Z' fill='#f5cba0'/>
<path d='M230 140 C168 140 140 198 140 258 C140 330 180 388 230 388 C280 388 320 330 320 258 C320 198 292 140 230 140 Z' fill='#ffe0c4'/>
<ellipse cx='142' cy='266' rx='12' ry='18' fill='#ffe0c4'/><ellipse cx='318' cy='266' rx='12' ry='18' fill='#ffe0c4'/>
<ellipse cx='170' cy='316' rx='24' ry='13' fill='#ff9d9d' opacity='0.5'/><ellipse cx='290' cy='316' rx='24' ry='13' fill='#ff9d9d' opacity='0.5'/>
<path d='M160 234 Q188 222 212 232' stroke='#7c5030' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M248 232 Q272 222 300 234' stroke='#7c5030' stroke-width='7' fill='none' stroke-linecap='round'/>
<circle cx='186' cy='278' r='22' fill='#7a4e2c'/><circle cx='186' cy='280' r='11' fill='#241611'/><circle cx='178' cy='269' r='6' fill='#fff'/>
<circle cx='274' cy='278' r='22' fill='#7a4e2c'/><circle cx='274' cy='280' r='11' fill='#241611'/><circle cx='266' cy='269' r='6' fill='#fff'/>
<path d='M226 300 q6 8 -3 12' stroke='#e6a684' stroke-width='3' fill='none' stroke-linecap='round'/>
<path d='M204 332 Q230 342 256 332 Q248 362 230 364 Q212 362 204 332 Z' fill='#c85a5a'/>
<path d='M210 335 Q230 341 250 335 L247 345 Q230 350 213 345 Z' fill='#fff'/>
<path d='M138 256 C122 160 156 96 230 96 C304 96 338 160 322 256 C312 208 300 180 276 170 C284 210 268 236 248 242 C255 206 240 178 230 178 C220 178 205 206 212 242 C192 236 176 210 184 170 C160 180 148 208 138 256 Z' fill='#8a5a34'/>
<ellipse cx='104' cy='300' rx='30' ry='60' fill='#8a5a34'/>
<ellipse cx='356' cy='300' rx='30' ry='60' fill='#8a5a34'/>
<circle cx='104' cy='250' r='16' fill='#ff8fa8'/><circle cx='356' cy='250' r='16' fill='#ff8fa8'/>
<path d='M230 100 C300 100 332 160 322 234 C318 198 306 174 286 166 C292 148 280 118 230 116 Z' fill='#a4703f' opacity='0.5'/>
</svg>`;
const SPEAKER_PORTRAITS = {
  '문화의집 선생님': "data:image/webp;base64,@@B64:e939dfcf_asset.webp@@",
  '나':             "data:image/webp;base64,@@B64:d1dd123e_asset.webp@@",   // (v196) 기본 여캐, 아래 헬퍼에서 성별 반영
  '지킴이':          "data:image/webp;base64,@@B64:d1dd123e_asset.webp@@",
  '은지':        "data:image/webp;base64,@@B64:3d477a67_asset.webp@@",
  '재현':      "data:image/webp;base64,@@B64:5e7dac26_asset.webp@@",
  '사서 도현':   "data:image/webp;base64,@@B64:d008d45c_asset.webp@@",
  '서연': "data:image/webp;base64,@@B64:b7e26bba_asset.webp@@",
  '하늘': "data:image/webp;base64,@@B64:f161b89e_asset.webp@@",
  '은지 어머니':          "data:image/webp;base64,@@B64:4ba32f6b_asset.webp@@",
  '약사 도윤':        "data:image/webp;base64,@@B64:19097841_asset.webp@@",
  '세아': "data:image/webp;base64,@@B64:7b98251d_asset.webp@@",
  '재이': "data:image/webp;base64,@@B64:12adfb28_asset.webp@@",
};
window.BD_SPEAKER_PORTRAITS = SPEAKER_PORTRAITS;
// (v196) 주인공 VN 초상화 — selectedCharacter(1=여,2=남)에 따라 분기
const BD_HERO_VN_PORTRAITS = { 1: "data:image/webp;base64,@@B64:d1dd123e_asset.webp@@", 2: "data:image/webp;base64,@@B64:0935f823_asset.webp@@" };
window.BD_HERO_VN_PORTRAITS = BD_HERO_VN_PORTRAITS;
function bdSpeakerPortrait(name){
  if(name==='나' || name==='지킴이'){
    const cid = (typeof selectedCharacter!=='undefined' && BD_HERO_VN_PORTRAITS[selectedCharacter]) ? selectedCharacter : 1;
    return BD_HERO_VN_PORTRAITS[cid];
  }
  // (v239) 에셋 슬롯 우선: npc.<이름> 이 등록돼 있으면 그 그림을 쓴다
  try{
    if(window.BD_ASSETS){
      const u = BD_ASSETS.get('npc.' + String(name||'').trim());
      if(u) return u;
    }
  }catch(e){}
  return SPEAKER_PORTRAITS[name];
}
window.bdSpeakerPortrait = bdSpeakerPortrait;
// (v190) 주민 대화창용 고화질 LD 초상화 (녹색배경 제거 상반신)
const BD_NPC_LD_PORTRAITS = {};   /* (v381) 구 광장 주민 초상 10종 제거 — 해당 화자 미사용 */
// SPEAKER_PORTRAITS에 병합 (주민 이름으로 조회되면 LD 초상화 사용)
try { Object.assign(SPEAKER_PORTRAITS, BD_NPC_LD_PORTRAITS); } catch(e){}
window.BD_NPC_LD_PORTRAITS = BD_NPC_LD_PORTRAITS;
// 컷신 재생용 비주얼 노벨 대화 (기존 #dialogue-overlay 재사용)
function playSceneVN(scene, onDone, _fromQueue){
  /* (v373) 다른 VN 이 재생 중인데 직접 호출되면(주민 대화 등) 앞 장면을 덮어쓰지 않고 큐 뒤에 세운다 —
     덮어쓰면 앞 장면의 onDone 이 사라져 후속(전투 시작·보상)이 증발한다 */
  if (!_fromQueue && window.__bdSceneActive && document.getElementById('dialogue-overlay')){
    _vnDlgQueue.push({ arr: (scene||[]).slice(), cb: onDone || null });
    setTimeout(_vnDlgPump, 50);
    return;
  }
  const overlay = document.getElementById('dialogue-overlay');
  const portrait = document.getElementById('dialogue-portrait');
  const nameEl = document.getElementById('dialogue-name');
  const textEl = document.getElementById('dialogue-text');
  const nextEl = document.getElementById('dialogue-next');
  // 기존 대화창이 없으면 폴백(봉담 간이 대화창)
  if(!overlay || !portrait || !nameEl || !textEl){
    let i=0;
    (function n(){ if(i>=scene.length){ if(onDone)if(typeof onDone==='function') onDone(); return; } const l=scene[i++]; showDialog(l.n,[l.t],n); })();
    return;
  }
  let i = 0;
  window.__bdSceneActive = true;
  function show(){
    if(i >= scene.length){
      overlay.classList.remove('show');
      overlay.style.display = 'none';
      window.__bdSceneActive = false;
      window.__bdSceneAdvance = null;
      if(typeof onDone === 'function') if(typeof onDone==='function') onDone();
      return;
    }
    const line = scene[i++];
    const src = bdSpeakerPortrait(line.n);   // (v196) 성별 반영 조회
    if(src){
      portrait.src = src;
      portrait.style.display = 'block';
      portrait.style.opacity = '1';
    } else {
      // 나레이션 등 화자 없음 → 초상화 숨김
      portrait.style.display = 'none';
    }
    nameEl.textContent = line.n || '';
    nameEl.style.display = line.n ? 'block' : 'none';
    textEl.textContent = line.t || '';
    if(nextEl) nextEl.textContent = '▼ [클릭 / Space / F]';
    overlay.style.display = 'flex';
    overlay.classList.add('show');
  }
  window.__bdSceneAdvance = show;
  show();
}
window.BD_playSceneVN = playSceneVN;
// 클릭/키로 컷신 진행
document.addEventListener('click', function(e){
  if(window.__bdSceneActive && typeof window.__bdSceneAdvance === 'function'){
    const box = document.getElementById('dialogue-overlay');
    if(box && (e.target === box || box.contains(e.target))){ window.__bdSceneAdvance(); }
  }
}, false);
document.addEventListener('keydown', function(e){
  if(!window.__bdSceneActive) return;
  if(e.key === ' ' || e.key === 'f' || e.key === 'F' || e.key === 'Enter'){
    e.preventDefault();
    if(typeof window.__bdSceneAdvance === 'function') window.__bdSceneAdvance();
  }
}, true);

// (v236) 전투 결과창('정화 완료') — 스페이스/엔터로도 '돌아가기'가 눌리도록
//  결과창이 실제로 보일 때만 동작한다. 중복 실행은 '표시 여부'로 막는다:
//  finishClose 가 hsr-show2 클래스를 즉시 제거하므로 다음 입력은 가드에서 걸러진다.
(function(){
  function resultVisible(){
    var r = document.getElementById('hsr-result');
    if(!r) return false;
    try { return getComputedStyle(r).display !== 'none'; } catch(err){ return false; }
  }
  document.addEventListener('keydown', function(e){
    if(e.repeat) return;                                  // 키 홀드 무시
    var k = e.key;
    if(k !== ' ' && k !== 'Spacebar' && k !== 'Enter') return;
    if(window.__bdSceneActive) return;                    // 컷신 진행이 우선
    if(window.__bdAugOpen) return;                        // (v238) 증강 선택 중엔 무시
    if(!resultVisible()) return;                          // 결과창이 떠 있을 때만
    var btn = document.getElementById('hsr-result-btn');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();                                  // 대사 진행 등 다른 핸들러로 새지 않게
    btn.click();                                          // 현재 바인딩된 finishClose 실행
  }, true);
})();

// =========================================================================
// 시나리오 — 기획서 세계관 기반 스토리 대사집 (대대적 개선)
//  각 장 도입/완료 컷신을 순차 대화로 재생. window.BD_playScene(key, onDone).
// =========================================================================
const SCENARIO = {
  /* (v370) 구 프롤로그 컷신(prologue_intro)은 v-tut2 «문화의집 선생님» 실대화로 대체되어 미사용 → 삭제 */
  // 1장: 와우리
  ch1_intro: [
    { n:'', t:'— 와우리. 문화의집으로 가는 길. —' },
    { n:'나', t:'(배지가 살짝 반응하네. 이 근처에 뭔가 있나 보다.)' },
    { n:'나', t:'(❗ 표시가 있는 사람들에게 먼저 이야기를 들어보자.)' },
  ],
  prologue_done: [
    { n:'담이', t:'봤죠? 그림자가 걷히니까 진짜로 깨끗해졌어요. 이게 정화예요!' },
    { n:'담이', t:'제 빛만으론 안 돼요. 당신이 앞에 서 줘야 힘이 생기거든요.' },
    { n:'담이', t:'봉담 곳곳에 이런 곳이 아직 남아 있어요. 우선 이 동네부터 차근차근 해요.' },
    { n:'담이', t:'❗ 표시가 뜬 주민에게 말을 걸면 부탁을 받을 수 있어요. 한 동네를 다 돌보면 다음 동네 소식이 올 거예요!' }
  ],
  ch1_done: [
    { n:'', t:'— 세아와 함께 와우도서관에서 즐거운 오후를 보냈다. —' },
    { n:'담이', t:'잘했어요! "노트 부채질"을 배웠네요. 탁한 공기를 걷어내면 그 속에 뭉쳐 있던 그림자도 흩어져요.' },
    { n:'담이', t:'…그리고요, 배지가 조금 따뜻해졌어요. 기분 탓일까요?', face:'base' }   /* (v370) 복선 1 */
  ],
  // 2장: 상리
  ch2_intro: [
    { n:'', t:'— 상리. 도서관과 공원길. —' },
    { n:'담이', t:'공원이 많은 동네네요! 그런데… 벤치 쪽에서 차가운 기운이 느껴져요.', face:'worry' },
    { n:'사서 도현', t:'공원에서 늘 놀던 서연이가 요즘 저녁엔 안 보여요. 무슨 일인지 물어봐 주시겠어요?' },   /* (v370) 인물 지목 */
    { n:'나', t:'네, 먼저 이야기부터 들어볼게요.' },
  ],
  ch2_done: [
    { n:'서연', t:'우와, 공원이 깨끗해졌어! 이제 저녁에도 놀 수 있겠다. 고마워!' },
    { n:'담이', t:'"물청소 정화"를 배웠어요! 더러워진 자리를 직접 씻어내면, 거기 붙어 있던 그림자도 함께 씻겨 나가요.' },
    { n:'담이', t:'이 동네는 이제 안심해도 되겠어요. 잠깐 숨 돌리고 가요!' },
    { n:'담이', t:'가끔 배지가 혼자 깜빡여요. 뭘 가리키는진 아직 몰라요.', face:'worry' }   /* (v370) 복선 2 */
  ],
  // 3장: 동화리
  ch3_intro: [
    { n:'', t:'— 동화리. 문화와 체험의 거리. —' },
    { n:'나', t:'(아이들이 많이 다니는 길인데… 배지가 반응하네.)' },
    { n:'담이', t:'아이들 웃음소리가 들려요. 이 거리는 꼭 지켜주고 싶어요.', face:'base' },
    { n:'나', t:'(❗ 표시가 있는 분들께 먼저 이야기를 들어보자.)' },
  ],
  ch3_done: [
    { n:'하늘', t:'거리가 훨씬 깔끔해졌어요. 정말 고마워요!' },
    { n:'담이', t:'재현이, 걱정하는 거 맞죠? 티 났어요.', face:'proud' },   /* (v370) 상점 안내는 가게 튜토가 담당 — 담이는 이야기로 */
    { n:'담이', t:'거리에 아이들 웃음소리가 다시 들리네요. 잘하고 있어요!' },
    { n:'담이', t:'…배지에 뭔가 모이고 있어요. 어디로 가는지는 아직 몰라요.', face:'worry' }   /* (v370) 복선 3 */
  ],
  // 4장: 수영리
  ch4_intro: [
    { n:'', t:'— 수영리. 안전하게 돌아가는 길. —' },
    { n:'나', t:'(해가 지면 이 길은 꽤 어둡겠는데….)' },
    { n:'담이', t:'해가 지고 있어요. 어두운 곳일수록 그림자가 힘을 내요 — 서둘러요!', face:'worry' },
    { n:'나', t:'(❗ 표시가 있는 분들께 먼저 이야기를 들어보자.)' },
  ],
  ch4_done: [
    { n:'약사 도윤', t:'가로등이 다시 켜졌네요. 밤길이 한결 낫겠어요.' },
    { n:'담이', t:'"안전 점검 라이트"를 배웠어요! 어두워서 안 보이던 위험을 밝히면, 숨어 있던 그림자는 버티지 못해요.' },
    { n:'담이', t:'어라…? 배지가 아까부터 자꾸 반짝여요. 문화의집 쪽인가….' }
  ],
  // 최종장: 문화의집 복귀
  final_intro: [
    { n:'', t:'— 봉담청소년문화의집. 모든 지역을 정화하고 돌아왔다. —' },
    { n:'문화의집 선생님', t:'다 둘러봐줬구나, 고마워. 근데... 하나가 더 남았어.' },
    { n:'문화의집 선생님', t:'작은 위험들이 오래 방치되면서 뭉친 거야. "쌓여있던 위험들"래.' },
    { n:'문화의집 선생님', t:'네가 치운 자리들이 밝아질수록, 안 치운 것들이 한군데로 몰린 모양이야. 그래서 배지가 그쪽으로 반짝였던 거고.' },   /* (v370) 복선 회수 */
    { n:'나', t:'여기까지 왔는데 마저 끝내야죠.' },
    { n:'담이', t:'…이 기운, 지금까지 중 제일 커요. 그래도 우리라면 할 수 있어요.', face:'surprise' },
    { n:'', t:'— 물러날 수 없는 상대다. 조심하자! —' }
  ],
  final_done: [
    { n:'', t:'— 쌓여있던 위험들이 천천히 힘을 잃고, 빛 속으로 흩어졌다. —' },
    { n:'나', t:'…사라졌어. 그런데 이상하게, 이긴 기분보다 홀가분한 기분이 더 커.' },
    { n:'문화의집 선생님', t:'그럴 거야. 저건 물리쳐야 할 괴물이라기보다, 아무도 돌보지 않아 쌓인 것들이었으니까.' },
    { n:'문화의집 선생님', t:'네가 한 건 싸움이 아니라 치우기였어. 그래서 더 오래 갈 거고.' },
    { n:'나', t:'저 혼자 한 건 아니에요. 은지도, 세아도, 재이도, 재현이도, 하늘 씨도, 도윤 약사님도… 다들 먼저 말을 걸어 줬어요.' },
    { n:'나', t:'말해 주는 사람이 있으면 보이더라고요. 안 보이면 그냥 지나쳤을 것들이.' },
    { n:'문화의집 선생님', t:'그게 지킴이야. 대단한 힘이 아니라, 먼저 알아채고 먼저 손을 대는 것.' },
    { n:'문화의집 선생님', t:'그동안 모은 카드로 "봉담 안전 지도"가 완성됐어. 어디가 안전하고, 어디를 더 살펴야 하는지 한눈에 보일 거야.' },
    { n:'문화의집 선생님', t:'많이 돌아다녔나 보네. 배지가 처음보다 훨씬 반짝이는 것 같아.' },
    { n:'나', t:'봉담에 갈 수 있는 좋은 곳이 생각보다 정말 많았어요. 도움이 필요할 때 어디로 가야 하는지도 알게 됐고요.' },
    { n:'문화의집 선생님', t:'그걸 알게 됐다면 배지를 준 보람이 있네.' },
    { n:'담이', t:'저희 둘만 아는 비밀도 생겼고요.' },
    { n:'나', t:'응. 앞으로도 잘 부탁해, 담이.' },
    { n:'담이', t:'지도에 아직 빈칸이 남았다면 언제든 같이 채우러 가요. 새로운 장소와 이야기는 계속 생기니까요.' },
    { n:'', t:'— 지도는 완성됐지만, 이야기는 오늘도 이어진다. —' },
    { n:'', t:'— 누군가 먼저 알아채고, 먼저 치우는 한 봉담은 계속 조금씩 안전해질 것이다. —' },
    { n:'', t:'— 봉담 안전 지도 완성! 함께해 주셔서 고맙습니다. —' }
  ],
};
let _sceneShown = {};
function playScene(key, onDone){
  const scene = SCENARIO[key];
  if(!scene){ if(typeof onDone==='function') onDone(); return; }
  /* (v284) 컷신-담이 인터리브 — 담이 줄을 컷신 종료 후 한 덩어리로 붙이던 방식(v135)을
     장면 순서 그대로 교차 재생으로 교체. 담이는 전용 말풍선(줄 단위·표정 지원), 사람 대사는 VN. */
  const segs = [];
  scene.forEach(function(l){
    if (l && l.n === '담이'){
      if (!segs.length || !segs[segs.length-1].dami) segs.push({ dami: [] });
      segs[segs.length-1].dami.push({ t: l.t, face: l.face || 'base' });
    } else {
      if (!segs.length || !segs[segs.length-1].vn) segs.push({ vn: [] });
      segs[segs.length-1].vn.push(l);
    }
  });
  function playDami(lines, done){
    let di = 0;
    (function next(){
      if (di >= lines.length){ if (done) setTimeout(done, 250); return; }
      const L = lines[di++];
      let shown = false;
      try{ shown = !!(window.BD_DAMI && BD_DAMI.show(L.t, { face: L.face, forceAwake: true, channel: 'story' })); }catch(eD){}   /* (v374) 컷신 줄 = 이야기 채널 */
      setTimeout(next, shown ? Math.max(2600, String(L.t).length * 85) + 420 : 200);
    })();
  }
  let si = 0;
  (function nextSeg(){
    if (si >= segs.length){ if(typeof onDone==='function') onDone(); return; }
    const s = segs[si++];
    if (s.vn && s.vn.length) playSceneVN(s.vn, nextSeg);
    else if (s.dami && s.dami.length) playDami(s.dami, nextSeg);
    else nextSeg();
  })();
}
function playSceneOnce(key, onDone){
  if(_sceneShown[key]){ if(typeof onDone==='function') if(typeof onDone==='function') onDone(); return; }
  _sceneShown[key] = true;
  playScene(key, onDone);
}
window.BD_playScene = playScene;
window.BD_playSceneOnce = playSceneOnce;
window.BD_SCENARIO = SCENARIO;
// 키보드로 대사 넘기기
window.addEventListener('keydown', (e)=>{
  const box=document.getElementById('bd-dialog');
  if(box && box.classList.contains('show') && (e.key===' '||e.key==='e'||e.key==='E'||e.key==='Enter')){
    e.preventDefault(); e.stopPropagation(); advanceDialog();
  }
}, true);

// NPC 대사: 퀘스트 상태 + NPC 역할에 따라 달라짐 (기획서 6-9번)
//  에디터에서 오브젝트(NPC)에 npcRole 을 지정하면 역할별 대사가 나옴.
//  npcRole 예: 'teacher'(선생님), 'friend'(친구), 'librarian'(사서), 'kid'(초등학생), 'shopkeeper'(점주)
const NPC_LINES = {
  teacher: {
    pre:  ['"어서 와요, 지킴이님."', '"봉담 곳곳에 불안의 그림자가 퍼지고 있어요."', '"배지의 힘으로 지켜주세요."'],
    mid:  ['"잘 하고 있어요!"', '"위험 요소를 하나씩 정화할 때마다 봉담이 안전해지고 있답니다."'],
    done: ['"당신 덕분에 봉담이 안전해졌어요."', '"정말 고마워요, 지킴이님!"'],
  },
  friend: {
    pre:  ['"오, 지킴이 배지 받았구나!"', '"멋진데? 조심해서 다녀와."'],
    mid:  ['"저쪽에서 이상한 기운을 봤어.", "너라면 정화할 수 있을 거야!"'],
    done: ['"네가 봉담을 다 지켰다며?", "역시 대단해!"'],
  },
  librarian: {
    pre:  ['"도서관은 조용히 쉬기 좋은 곳이에요."', '"위험한 곳을 만나면 여기서 정보를 얻어 가세요."'],
    mid:  ['"MP가 부족하면 도서관에서 회복할 수 있어요."'],
    done: ['"안전해진 봉담, 책 읽기에도 좋은 동네가 됐네요."'],
  },
  kid: {
    pre:  ['"형/누나, 저기 무서운 게 있어요!"', '"지켜주실 거죠?"'],
    mid:  ['"우와, 배지가 반짝여요!"'],
    done: ['"이제 마음 놓고 놀 수 있어요! 고마워요!"'],
  },
  shopkeeper: {
    pre:  ['"어서 오세요. 필요한 물건 있으면 말해요."'],
    mid:  ['"회복 아이템이 필요하면 언제든 들러요."'],
    done: ['"동네가 안전해져서 장사도 잘 되네요. 고마워요!"'],
  },
  default: {
    pre:  ['"지킴이님, 봉담을 부탁해요."'],
    mid:  ['"조심히 다녀오세요."'],
    done: ['"봉담을 지켜주셔서 고마워요."'],
  },
};
function npcTalk(npcName, role){
  const q = QUESTS[BD.questIdx];
  // 진행 단계: 프롤로그~초반 pre, 중반 mid, 완료 done
  let phase = 'mid';
  if(BD.questIdx <= 0) phase = 'pre';
  if(!q) phase = 'done';
  const set = NPC_LINES[role] || NPC_LINES.default;
  let lines = (set[phase] || set.pre || NPC_LINES.default.pre).slice();
  // 현재 임무 안내를 마지막에 덧붙임
  lines = lines.concat(['(현재 임무: ' + (q ? q.chapter + ' - ' + q.title : '모든 임무 완수!') + ')']);
  showDialog(npcName || 'NPC', lines);
}
window.BD_npcTalk = npcTalk;
window.BD_NPC_LINES = NPC_LINES;

/* ══ (v221) 선택지 시스템 — JRPG식 키보드 탐색 ══
   화면 하단 선택 창: ▶ 커서, ↑↓(또는 W/S) 순환 이동, F/Enter/Space 확정, ESC 취소.
   마우스 올리면 커서 이동·클릭으로 확정. 열려 있는 동안 이동·대화 키를 선점한다.
   BD_showChoices({ title, items:[{id,text}], onPick(id), cancelId }) 로 재사용 가능. */
window.__bdChoiceState = { open:false, idx:0, items:[], onPick:null, cancelId:null };
function BD_showChoices(opts){
  const S = window.__bdChoiceState;
  let box = document.getElementById('bd-choice');
  if(!box){ box = document.createElement('div'); box.id = 'bd-choice'; document.body.appendChild(box); }
  box.className = 'bd-choicebox';
  try{ box.style.removeProperty('display'); box.style.removeProperty('pointer-events'); }catch(eSt){}   /* (v373) 다른 레이어가 남긴 인라인 숨김·클릭차단 잔여값 제거 */
  S.open = true; S.idx = 0; S.items = opts.items || [];
  S.tOpen = Date.now();   // (v240b) 열림 직후 오확정 방지용
  S.fArmed = false;       // (v35) F는 '한 번 뗀 뒤'에만 확정 — 연타 잔타(비반복 이벤트)가 오확정하던 문제
  S.onPick = opts.onPick || null; S.cancelId = opts.cancelId || null;
  const rows = S.items.map((it, i) =>
    '<div class="bd-choice-row" data-i="' + i + '"' + (it.id ? ' id="bd-ch-' + it.id + '"' : '') + '>'
    + '<span class="bd-choice-cursor">\u25B6</span><span class="bd-choice-label">' + it.text + '</span></div>'
  ).join('');
  box.innerHTML = '<div class="bd-choicebox-title">' + (opts.title || '') + '</div>' + rows;
  box.classList.add('show');
  try{ moveKeys = {w:false,a:false,s:false,d:false}; }catch(e){}
  BD_choiceRender();
  // 마우스 병행
  box.querySelectorAll('.bd-choice-row').forEach(function(row){
    row.addEventListener('mouseenter', function(){ S.idx = +row.dataset.i; BD_choiceRender(); });
    row.addEventListener('click', function(e){ e.stopPropagation(); S.idx = +row.dataset.i; BD_choiceConfirm(); });
  });
}
function BD_choiceRender(){
  const S = window.__bdChoiceState;
  const box = document.getElementById('bd-choice'); if(!box) return;
  box.querySelectorAll('.bd-choice-row').forEach(function(row){
    row.classList.toggle('selected', +row.dataset.i === S.idx);
  });
}
function BD_choiceClose(){
  const S = window.__bdChoiceState;
  S.open = false; S.items = []; S.onPick = null;
  window.__bdChoiceClosedAt = Date.now();   // (v240b) 닫힘 직후 재상호작용 쿨다운 기준
  const box = document.getElementById('bd-choice');
  if(box) box.classList.remove('show');
}
function BD_choiceConfirm(){
  const S = window.__bdChoiceState;
  if(!S.open) return;
  /* (v337) 마우스가 마지막으로 누른 행을 확정 직전에 최종 반영 — 캡처 순서와 무관하게 오클릭 방지 */
  try{
    var __pin = window.__bdPinIdx;
    if (__pin && Number.isFinite(+__pin.i) && Date.now() - __pin.t < 700){ S.idx = +__pin.i; }
    window.__bdPinIdx = null;
  }catch(ePin){}
  const it = S.items[S.idx]; if(!it) return;
  const cb = S.onPick;
  try{ if(window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
  BD_choiceClose();
  if(cb) setTimeout(function(){ cb(it.id); }, 60);
}
// 키 선점 (window 캡처 — 게임 핸들러보다 먼저)
window.addEventListener('keydown', function(e){
  const S = window.__bdChoiceState;
  if(!S.open) return;
  // (v240b) 키 반복(F 꾹)이 열림과 동시에 확정되던 버그 — 반복 이벤트는 삼킨다
  if(e.repeat){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  const k = e.key;
  if(k === 'ArrowUp' || k === 'w' || k === 'W'){
    S.idx = (S.idx - 1 + S.items.length) % S.items.length; BD_choiceRender();
  } else if(k === 'ArrowDown' || k === 's' || k === 'S'){
    S.idx = (S.idx + 1) % S.items.length; BD_choiceRender();
  } else if(k === 'Enter' || k === ' ' || k === 'f' || k === 'F'){
    // (v240b) 창이 열리자마자 들어온 확정 키는 상호작용 키의 잔상 — 250ms 무시
    if(Date.now() - (S.tOpen||0) < 250){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    // (v35) F 연타는 repeat 이벤트가 아니라서 250ms 가드를 뚫었다 — keyup 이후에만 F 확정
    if((k === 'f' || k === 'F') && !S.fArmed){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    BD_choiceConfirm();
  } else if(k === 'Escape' && S.cancelId !== null){
    const cb = S.onPick, cid = S.cancelId;
    BD_choiceClose();
    if(cb) setTimeout(function(){ cb(cid); }, 60);
  }
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
window.addEventListener('keyup', function(e){
  try{ const S = window.__bdChoiceState;
    if(S && S.open && (e.key === 'f' || e.key === 'F')) S.fArmed = true; }catch(err){}
}, true);   // (v35)
window.BD_showChoices = BD_showChoices;
window.BD_choiceOpen = function(){ return !!window.__bdChoiceState.open; };

// 상호작용 선택창: 위험 오브젝트 조사 시 (새 선택지 시스템 기반, 시그니처 호환)
function showInteractChoice(objName, onInvestigate, onBattle){
  BD_showChoices({
    title: '\u26A0\uFE0F ' + (objName || '위험 요소'),
    items: [
      // (v239) 「조사한다」 하나로 통일 — 비슷한 선택지 둘이 혼동을 낳았다
      { id:'investigate', text:'🔍 조사한다' },
      { id:'leave',       text:'🚶 오늘은 그냥 지나간다' },
    ],
    cancelId: 'leave',
    onPick: function(id){
      try{ console.log('[선택] 고른 항목 =', id); }catch(e){}
      if(id === 'investigate'){
        try{ console.log('[선택] 조사한다 → 정화 전투'); }catch(e){}
        try{ window.__bdInvestAt = Date.now(); }catch(eIA){}
        if(onInvestigate) onInvestigate(); else if(onBattle) onBattle();
      } else { try{ console.log('[선택] 지나가기 → 아무 일 없음'); }catch(e){} }
    },
  });
}
window.BD_showInteractChoice = showInteractChoice;

// =========================================================================
// 작업10: 시설별 회복·상점 + 아이템 3종
// =========================================================================
const ITEMS = {
  snack:{ name:'문화의집 간식', icon:'🍪', heal:'hp', amount:40, price:30, desc:'HP 40 회복' },
  // (v239) 따뜻한 음료(SP 회복)·구급 지킴이 배지(동료 부활) 제거 — SP·동료 시스템 폐지
};
// (v160) 장비 상점 목록 — 종류별 1회만 구매, 강화·등급·판매 없음
const EQUIP_SHOP = {
  prot_W:{ slot:'protector', val:'W', name:'바람막이 조끼', icon:'🌬️', price:80, desc:'방어 +10% · 💨 바람(공기·소음) 피해 25% 감소', unlockQ:1 },
  prot_G:{ slot:'protector', val:'G', name:'초록 앞치마',   icon:'🌿', price:80, desc:'방어 +10% · 🌿 자연(환경·오염) 피해 25% 감소', unlockQ:1 },
  prot_M:{ slot:'protector', val:'M', name:'안전 작업복',   icon:'🔩', price:80, desc:'방어 +10% · 🔧 시설(금속·파손) 피해 25% 감소', unlockQ:2 },
  memo_hp:{ slot:'memento', val:'hp', name:'문화의집 단체사진', icon:'📸', price:70, desc:'최대 HP +30', unlockQ:1 },
  // (v239) 봉담 마라톤 메달(속도) 제거 — 액션 게이지를 없애 체감이 사라졌다
};
window.BD_EQUIP_SHOP = EQUIP_SHOP;
window.BD_ITEMS = ITEMS;
// 시설 타입: house(전체회복+저장), park(HP회복), library(MP회복), shop(구매)
function useFacility(type){
  if(type==='house'){
    // (v231) 첫 이용 보상: 최대 HP +5 (영구)
    if(!BD._houseVisited){
      BD._houseVisited = true;
      BD.maxHp += 5;
      bdToast('🏠 문화의집 첫 이용! 최대 HP +5');
    }
    BD.hp=BD.maxHp; BD.mp=BD.maxMp;
    if(typeof window.BD_healParty==='function') window.BD_healParty();   // (v160) 파티 전원 회복+행동불능 해제
    if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false);
    bdSave();
    bdToast('🏠 문화의집: 파티 전원 회복 + 저장 완료');
  } else if(type==='park'){
    // (v160) 최초 방문 1회 보상: 최대 HP +10 (영구)
    BD._parkBonus = BD._parkBonus || 0;
    if(!BD._parkVisited){
      BD._parkVisited = true;
      BD._parkBonus = 10;
      BD.maxHp += 10;
      bdToast('🌳 공원 첫 방문 보상! 최대 HP +10');
    }
    BD.hp=Math.min(BD.maxHp, BD.hp+50);
    if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false);
    bdSave(); bdToast('🌳 공원: HP 50 회복');
    try{ bdSubQuestProgress('npc_seoyeon'); }catch(e){}   // (v160) 서연의 부탁 진행
    try{ bdSubQuestProgress('npc_junho'); }catch(e){}     // (v193) 준호의 부탁 진행
  } else if(type==='library'){
    // (v231) 첫 방문 보상: 배지 에너지 최대치 +1 (영구 — 전투 MP 한도가 늘어난다)
    if(!BD._libVisited){
      BD._libVisited = true;
      BD.maxMp = (BD.maxMp || 5) + 1;
      BD.mp = Math.min(BD.maxMp, (BD.mp || 0) + 1);
      bdToast('📚 도서관 첫 방문! 최대 MP +1');
    }
    BD.hp=BD.maxHp;
    if(typeof window.BD_healParty==='function') window.BD_healParty();
    if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false);
    bdSave(); bdToast('📚 도서관: 회복시설 — 파티 전원 회복!');
  } else if(type==='shop'){
    openShop();
  }
}
window.BD_useFacility = useFacility;
// 상점 모달
function openShop(){
  let m=document.getElementById('bd-shop-modal');
  if(!m){ m=document.createElement('div'); m.id='bd-shop-modal'; m.className='bd-modal'; document.body.appendChild(m); }
  const rows=['snack','drink','revive'].filter(k=>ITEMS[k]).map(k=>{
    const it=ITEMS[k];
    const owned = (BD.items[k]||0);
    const price = (typeof window.BD_getItemPrice === 'function') ? window.BD_getItemPrice(it.price) : it.price;
    const priceLabel = (price < it.price)
      ? '<s style="opacity:.55;">'+it.price+'G</s> '+price+'G'
      : price+'G';
    return '<div class="bd-equip-row">'
      + '<span class="bd-equip-ic">'+it.icon+'</span>'
      + '<span class="bd-equip-nm">'+it.name+' <b>x'+owned+'</b><br><small style="color:#9fb3d1">'+it.desc+'</small></span>'
      + '<button class="bd-equip-up" onclick="if(window.BD_buyItem(\''+k+'\'))window.BD_openShop()">구매 ('+priceLabel+')</button>'
      + '</div>';
  }).join('');
  // (v160) 장비 상점 — 이야기 진행(questIdx)에 따라 재고 확장, 종류별 1회 구매
  BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
  const eqRows = Object.keys(EQUIP_SHOP).map(k=>{
    const e = EQUIP_SHOP[k];
    if((BD.questIdx||0) < e.unlockQ) return '';
    const owned = !!BD.equipV2.owned[k];
    return '<div class="bd-equip-row">'
      + '<span class="bd-equip-ic">'+e.icon+'</span>'
      + '<span class="bd-equip-nm">'+e.name+(owned?' <b style="color:#8f9">보유</b>':'')+'<br><small style="color:#9fb3d1">'+e.desc+'</small></span>'
      + (owned
        ? '<button class="bd-equip-up" disabled>구매 완료</button>'
        : '<button class="bd-equip-up" onclick="if(window.BD_buyEquip(\''+k+'\'))window.BD_openShop()">구매 ('+e.price+'G)</button>')
      + '</div>';
  }).join('');
  const gold = (typeof playerGold!=='undefined')?playerGold:0;
  m.innerHTML='<div class="bd-modal-box"><div class="bd-modal-title">🛒 상점 · 소지금 '+gold+'G</div>'
    + '<div style="color:#ffd54a;font-size:12px;margin:4px 0 2px;">— 소모품 —</div>' + rows
    + (eqRows ? '<div style="color:#ffd54a;font-size:12px;margin:8px 0 2px;">— 장비 (종류별 1회) —</div>' + eqRows : '')
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-shop-modal\').classList.remove(\'show\')">닫기</button></div>';
  m.classList.add('show');
}
window.BD_openShop = openShop;
function buyItem(k){
  const it=ITEMS[k]; if(!it) return false;
  const gold=(typeof playerGold!=='undefined')?playerGold:0;
  // (버그 수정 v152) "재화 감각" 스킬 할인이 실제 구매 시 전혀 적용되지 않던 문제
  const price = (typeof window.BD_getItemPrice === 'function') ? window.BD_getItemPrice(it.price) : it.price;
  if(gold<price){ bdToast('소지금이 부족해요'); return false; }
  playerGold = gold - price;   // (v160) 소지금 단일화 — 편의점·퀘스트 보상과 같은 장부 사용
  BD.items[k]=(BD.items[k]||0)+1;
  bdSave(); bdToast('🛒 '+it.name+' 구매!');
  try{ bdSubQuestProgress('npc_haneul'); }catch(e){}   // (v160) 하늘의 부탁 진행
  try{ bdSubQuestProgress('npc_yeongja'); }catch(e){}  // (v193) 영자씨의 부탁 진행
  try{ if(typeof window.BD_renderQuest==='function') window.BD_renderQuest(); }catch(e){}
  return true;
}
window.BD_buyItem = buyItem;
// (v160) 장비 구매 — 종류별 1회, 구매 즉시 장착
function buyEquip(k){
  const e = EQUIP_SHOP[k]; if(!e) return false;
  BD.equipV2 = BD.equipV2 || { protector:null, memento:null, owned:{} };
  if(BD.equipV2.owned[k]){ bdToast('이미 가지고 있는 장비예요'); return false; }
  const gold=(typeof playerGold!=='undefined')?playerGold:0;
  if(gold<e.price){ bdToast('소지금이 부족해요'); return false; }
  if(window.HSR && HSR.active){ bdToast('전투 중에는 장비를 바꿀 수 없어요'); return false; }
  playerGold = gold - e.price;
  BD.equipV2.owned[k] = true;
  BD.equipV2[e.slot] = e.val;   // 구매 즉시 장착
  if(typeof recalcStats==='function') recalcStats();
  bdSave(); bdToast('🛒 '+e.name+' 구매 & 장착!');
  return true;
}
window.BD_buyEquip = buyEquip;
// 전투 중 아이템 사용
function useItem(k){
  const it=ITEMS[k]; if(!it||it.heal===null) return false;
  if((BD.items[k]||0)<=0){ bdToast('아이템이 없어요'); return false; }
  // (v38) 필드 인벤토리(playerInventory)와 소비 동기화 — 두 저장소 카운트가 어긋나던 문제
  try { if (typeof playerInventory !== 'undefined' && playerInventory[k] && playerInventory[k].count > 0){
    playerInventory[k].count--; if (playerInventory[k].count <= 0) delete playerInventory[k]; } } catch (eSync) { }
  // 전투 중에는 실제 전투 캐릭터의 HP를 기준으로 판정한다. 최대 HP면 소비하지 않는다.
  if(it.heal==='hp'){
    const battleHero = (window.HSR && HSR.active && HSR.hero) ? HSR.hero : null;
    const currentHp = battleHero && typeof battleHero.hp==='number' ? battleHero.hp : heroHP;
    const maxHp = battleHero && typeof battleHero.maxhp==='number' ? battleHero.maxhp : getMaxHP();
    if(currentHp >= maxHp){ bdToast('체력이 이미 가득해요'); return false; }
  }
  // (v160) SP 회복/부활 아이템은 전투 중에만 사용 가능 — 소비 전에 먼저 확인
  if((it.heal==='mp'||it.heal==='revive') && !(window.HSR && HSR.active)){ bdToast('전투 중에만 사용할 수 있어요'); return false; }
  if(it.heal==='revive'){
    // 행동불능인 파티원 중 첫 번째를 회복 (주인공 우선)
    let target = null;
    if(window.HSR){
      if(HSR.hero && HSR.hero.ko) target = HSR.hero;
      else target = (HSR.allies||[]).find(a=>a.ko) || null;
    }
    if(!target){ bdToast('행동불능인 동료가 없습니다'); return false; }
    BD.items[k]--;
    target.ko = false;
    target.hp = Math.max(1, Math.round((target.maxhp||100)*0.4));
    if(target===HSR.hero){
      BD.hp = target.hp;
      if(typeof window.BD_syncHP==='function') window.BD_syncHP(target.hp, false);
      try{ el.uHero.style.filter=''; el.uHero.style.opacity=''; }catch(e){}
      if(typeof refreshHeroUI==='function') refreshHeroUI();
    }
    if(typeof bdRefreshParty==='function') bdRefreshParty();
    if(typeof renderSpeedbar==='function') renderSpeedbar();
    bdToast('🚑 '+(target.name||'지킴이')+'가 다시 일어났다!');
    bdSave();
    return true;
  }
  BD.items[k]--;
  if(it.heal==='hp'){
    const before = (window.HSR&&HSR.active&&HSR.hero) ? HSR.hero.hp : heroHP;
    const healed = Math.min(getMaxHP(), before + it.amount);
    if(window.HSR&&HSR.active&&HSR.hero) HSR.hero.hp=Math.min(HSR.hero.maxhp||getMaxHP(), healed);
    if(typeof window.BD_syncHP==='function') window.BD_syncHP(healed, false);
  } else if(it.heal==='mp'){
    HSR.sp=Math.min(HSR.spMax||5,(HSR.sp||0)+2);
    if(typeof window.BD_refreshSp==='function') window.BD_refreshSp();
  }
  bdSave(); bdToast('✨ '+it.name+' 사용');
  return true;
}
window.BD_useItem = useItem;

// =========================================================================
// 작업11: 타이틀 · 엔딩 · 안전지도 완성 화면
// =========================================================================
// (v193) 엔딩 연출 강화 — 카드 회전 컬렉션 + 단계별 등장 + 축하 파티클
const _ENDING_CARD_ICONS = {
  '문화의집':'🏠', '봉담와우도서관':'📚', '봉담도서관':'📖', '어린이문화센터':'🎨',
  '안전지킴이집':'🛡️', '봉담청소년문화의집':'⭐', '봉담안전지도':'🗺️',
};
function _endingEnsureStyle(){
  if(document.getElementById('bd-ending-style')) return;
  const st = document.createElement('style');
  st.id = 'bd-ending-style';
  st.textContent = ''
    + '#bd-ending-modal .bd-modal-box{ position:relative; }'
    + '.bd-confetti-layer{ position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:5; }'
    + '.bd-end-stage{ opacity:0; animation:bdEndIn .8s ease forwards; }'
    + '@keyframes bdEndIn{ from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }'
    + '.bd-end-title{ font-size:24px; font-weight:900; color:#ffe9a8;'
    + '  text-shadow:0 0 16px rgba(255,210,90,.55), 0 2px 8px #000; animation-delay:.15s; }'
    + '.bd-end-sub{ color:#cbd5e1; font-size:14px; line-height:1.55; margin-top:8px; animation-delay:.5s; }'
    + '.bd-end-cards{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:16px 0 4px;'
    + '  perspective:700px; animation-delay:.9s; }'
    + '.bd-end-card{ width:88px; min-height:112px; border-radius:10px; padding:8px 6px;'
    + '  background:linear-gradient(160deg,#2b3a5e,#141c30); border:1.5px solid rgba(255,215,120,.55);'
    + '  box-shadow:0 4px 14px rgba(0,0,0,.5), 0 0 12px rgba(255,210,110,.15);'
    + '  opacity:0; transform-style:preserve-3d; animation:bdCardFlip .9s cubic-bezier(.2,.9,.3,1.1) forwards; }'
    + '.bd-end-card.bd-end-card-hidden{ border-color:rgba(180,120,255,.7);'
    + '  background:linear-gradient(160deg,#3b2b5e,#1c1430); box-shadow:0 4px 14px rgba(0,0,0,.5), 0 0 14px rgba(170,110,255,.3); }'
    + '@keyframes bdCardFlip{ 0%{opacity:0; transform:rotateY(540deg) scale(.3)}'
    + '  70%{opacity:1;} 100%{opacity:1; transform:rotateY(0) scale(1)} }'
    + '.bd-end-card-icon{ font-size:30px; line-height:1.2; }'
    + '.bd-end-card-name{ font-size:10.5px; font-weight:700; color:#ffe9c0; margin-top:4px; word-break:keep-all; }'
    + '.bd-end-card-region{ font-size:9.5px; color:#93b4d8; margin-top:2px; }'
    + '.bd-end-map{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:12px 0; animation-delay:2s; }'
    + '.bd-end-stats{ color:#7dd3fc; font-size:13px; animation-delay:2.5s; }'
    + '.bd-end-extra{ animation-delay:2.8s; }'
    + '.bd-end-btn-wrap{ animation-delay:3.1s; }'
    + '.bd-confetti{ position:absolute; top:-14px; border-radius:2px; pointer-events:none; z-index:5;'
    + '  animation:bdConfettiFall linear forwards; }'
    + '@keyframes bdConfettiFall{ 0%{transform:translateY(0) rotate(0deg); opacity:1}'
    + '  85%{opacity:1} 100%{transform:translateY(560px) rotate(720deg); opacity:0} }';
  document.head.appendChild(st);
}
function showEnding(){
  _endingEnsureStyle();
  let m=document.getElementById('bd-ending-modal');
  if(!m){ m=document.createElement('div'); m.id='bd-ending-modal'; m.className='bd-modal'; document.body.appendChild(m); }
  const gotCards = BD.cards.filter(c=>c!=='봉담안전지도');
  // 1) 카드 컬렉션 (획득 순서대로 회전 등장)
  const cardCells = BD.cards.map((name, i)=>{
    const info = (typeof FACILITY_CARDS!=='undefined' && FACILITY_CARDS[name]) || { region:'-', desc:'' };
    const icon = _ENDING_CARD_ICONS[name] || '🗂';
    const hidden = (name==='봉담청소년문화의집') ? ' bd-end-card-hidden' : '';
    return '<div class="bd-end-card'+hidden+'" style="animation-delay:'+(0.9 + i*0.22)+'s">'
      + '<div class="bd-end-card-icon">'+icon+'</div>'
      + '<div class="bd-end-card-name">'+name+'</div>'
      + '<div class="bd-end-card-region">'+info.region+'</div>'
      + '</div>';
  }).join('');
  // 2) 안전 지도 노드
  const mapCells = REGIONS.map(r=>{
    const got = BD.cards.includes(r.facility);
    return '<div class="bd-map-node '+(got?'':'bd-map-locked')+'">'
      + '<div style="font-size:20px">'+(got?'✅':'❓')+'</div>'
      + '<div style="font-size:11px;margin-top:3px">'+r.name+'</div></div>';
  }).join('');
  m.innerHTML='<div class="bd-modal-box" style="text-align:center;max-width:460px;">'
    + '<div class="bd-end-stage bd-end-title">🎉 봉담 안전 지도 완성!</div>'
    + '<div class="bd-end-stage bd-end-sub">모든 위험을 정화하고 봉담을 안전하게 지켜냈습니다.<br>당신은 진정한 봉담문화의집 지킴이입니다.</div>'
    + '<div class="bd-end-stage bd-end-cards">'+cardCells+'</div>'
    + '<div class="bd-end-stage bd-end-map">'+mapCells+'</div>'
    + '<div class="bd-end-stage bd-end-stats">획득 시설 카드 '+gotCards.length+'개 · Lv.'+BD.lv+'</div>'
    + (function(){
        try{
          const totalCards = (typeof FACILITY_CARDS!=='undefined') ? Object.keys(FACILITY_CARDS).length : 7;
          const ownedCards = Array.isArray(BD.cards) ? BD.cards.length : 0;
          const hasHidden = Array.isArray(BD.cards) && BD.cards.includes('봉담청소년문화의집');
          let html = '<div class="bd-end-stage bd-end-extra" style="color:#cbd5e1;font-size:12px;margin-top:4px;">카드 수집 ' + ownedCards + '/' + totalCards + (hasHidden?' · 🗂 히든 카드 획득!':'') + '</div>';
          if(ownedCards >= totalCards){
            html += '<div class="bd-end-stage bd-end-extra" style="color:#8effa0;font-size:13px;margin-top:8px;font-weight:bold;">🏅 완벽한 지킴이! 모든 시설 카드를 모았어요!</div>';
          } else if(!hasHidden){
            html += '<div class="bd-end-stage bd-end-extra" style="color:#94a3b8;font-size:11px;margin-top:6px;">💡 동네 주민 모두와 대화하면 히든 카드를 얻을 수 있어요.</div>';
          }
          return html;
        }catch(e){ return ''; }
      })()
    + '<div class="bd-end-stage bd-end-btn-wrap">'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-ending-modal\').classList.remove(\'show\'); if(window.BD_showCredits){ window.BD_showCredits({source:\'map-complete\'}); }">엔딩 크레딧 보기</button>'
    + '<div style="margin-top:8px;color:#94a3b8;font-size:11px;">다음 · 제작진과 함께한 사람들</div></div></div>';
  m.classList.add('show');
  // 3) 축하 파티클 (모달 박스 안에서 떨어지는 색종이)
  try{
    const box = m.querySelector('.bd-modal-box');
    const layer = document.createElement('div');
    layer.className = 'bd-confetti-layer';
    box.appendChild(layer);
    const colors = ['#ffd54a','#8effa0','#7dd3fc','#f9a8d4','#c9a8ff','#ffb46b'];
    for(let i=0;i<36;i++){
      const p = document.createElement('div');
      p.className = 'bd-confetti';
      const w = 5 + Math.random()*6;
      p.style.cssText += 'left:'+(Math.random()*100)+'%;width:'+w+'px;height:'+(w*0.6+3)+'px;'
        + 'background:'+colors[i%colors.length]+';'
        + 'animation-duration:'+(2.4 + Math.random()*2.2)+'s;'
        + 'animation-delay:'+(0.3 + Math.random()*2.4)+'s;';
      layer.appendChild(p);
    }
    setTimeout(function(){ try{ layer.remove(); }catch(e){} }, 8000);
  }catch(e){}
}
window.BD_showEnding = showEnding;

// =========================================================================
// 작업12: 저장 데이터 통합 + 초기화
// =========================================================================
function resetHazardRuntimeState(){
  // 정화 상태는 BD.purified(저장용)와 오브젝트._purified(화면용)에 이중으로 남는다.
  // 새 게임/초기화 때 둘 다 비워야 같은 페이지에서도 위험요소가 정상적으로 다시 활성화된다.
  try{
    if(typeof STAGES !== 'undefined'){
      Object.keys(STAGES).forEach(function(sid){
        const st = STAGES[sid];
        if(!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){
          if(o && Object.prototype.hasOwnProperty.call(o, '_purified')) delete o._purified;
        });
      });
    }
  }catch(e){}
  BD._pendingHazard = null;
  try { if(window.HSR) HSR._pendingSecond = null; } catch(e){}
  try { window.__bdExitLockUntil = 0; } catch(e){}
}
window.BD_resetHazardRuntimeState = resetHazardRuntimeState;

function resetProgress(clearAllSaves){
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  // 구버전 키가 남아 있으면 다음 실행 때 v160으로 자동 이관되어 정화 기록이 되살아난다.
  try{ localStorage.removeItem('bongdam_guardian_v1'); }catch(e){}
  // '진행 초기화'는 수동 슬롯까지 모두 지우고, '새 게임'은 기존 슬롯을 보존한다.
  if(clearAllSaves === true){
    try{ for(let i=0;i<SLOT_COUNT;i++) localStorage.removeItem(slotKey(i)); }catch(e){}
    try{ localStorage.removeItem('fantasyRPG_save'); }catch(e){}
  }
  try{ window.__bdCurrentSlot = null; }catch(e){}
  // 상태 초기화
  BD.lv=1; BD.hp=100; BD.mp=20; BD.maxHp=100; BD.maxMp=20; BD.atk=14;
  BD.crystal=0; BD.unlockedSkills=['sticker']; BD.equippedSkill='sticker'; BD.questIdx=0;
  BD.purified={}; BD.cards=[]; BD.regionIdx=0; BD.regionCleared={};
  BD.equip={ core:{elem:'N',lv:0}, armor:{elem:'N',lv:0}, charm:{lv:0} };
  BD.items={ snack:0, drink:0, revive:0 };
  BD.partyState={}; BD.xp=0; BD.equipV2={ protector:null, memento:null, owned:{} };
  BD.greetedResidents=[]; BD.startType=null; BD._parkVisited=false; BD._parkBonus=0;
  BD._fitAtk=0; BD._fitDone={};   // (v281b) 공원 운동 단련 초기화
  BD._augments=[]; BD._damiSeen=[]; BD.codex={};   // (v238/239) 증강·담이·수첩 초기화
  BD._ultUnlocked=false; BD._pendingSkillIntro=null;   // (v239) 궁극기·신규 스킬 안내 초기화
  try{ document.body.classList.remove('bd-ult-on'); }catch(e){}
  // (v239) 새 게임이면 튜토리얼도 처음부터 — 건너뛰기 기록이 남아 영영 안 뜨던 문제
  try{ localStorage.removeItem('bd_dami_tutorial_done'); }catch(e){}
  try{ localStorage.removeItem('bd_tut2_done'); }catch(e){}
  try{ localStorage.removeItem('bd_dami_awake'); }catch(e){}   // (v240c) 담이도 다시 잠든 상태로
  // (v38) 이후 버전에서 추가된 키들 — 새 게임 리셋에 누락돼 튜토·부탁 상태가 이월되던 문제
  try{ localStorage.removeItem('bd_battle_tutorial_done'); }catch(e){}
  try{ localStorage.removeItem('bd_shop_tutorial_done'); localStorage.removeItem('bd_shop_tutorial_done_v75'); localStorage.removeItem('bd_map_tuto_done'); }catch(e){}   /* (v370) 가게 튜토 키(v75)도 새 게임에서 리셋 */
  try{ localStorage.removeItem('bd_npcq_accept_v35'); localStorage.removeItem('bd_hzquest_v57'); }catch(e){}
  try{ localStorage.removeItem('bd_npcq_claim_v34'); }catch(e){}
  BD._houseVisited=false; BD._libVisited=false;   // (v237 병합) 첫 방문 보너스 초기화
  BD.trackedQuest = null;
  BD.gameCleared = false;
  resetHazardRuntimeState();
  // (버그 수정) 퀘스트 객체 진행도도 함께 초기화 — 이전에는 BD만 리셋되고 진행도가 남았음
  try {
    if(typeof QUESTS!=='undefined') QUESTS.forEach(q=>{ q.objectives[0].cur = 0; });
    if(typeof SUB_QUESTS!=='undefined') SUB_QUESTS.forEach(q=>{ q.objectives[0].cur = 0; q.accepted = false; });
    if(typeof NPC_QUESTS!=='undefined') NPC_QUESTS.forEach(q=>{ q.objectives[0].cur = 0; q.accepted = false; });
  } catch(e){}
  window.__bdAutoTrackDone = false;  // 새 게임에서 자동 추적 다시 허용
  try { if (typeof window.BD_resetTips === 'function') window.BD_resetTips(); } catch(e){}  // 상황별 안내도 리셋
  recalcStats(); renderQuestHud();
  bdToast('🔄 봉담 진행 상황을 초기화했습니다');
}
window.BD_resetProgress = resetProgress;
// 초기화 확인 팝업
function confirmReset(){
  let m=document.getElementById('bd-reset-modal');
  if(!m){ m=document.createElement('div'); m.id='bd-reset-modal'; m.className='bd-modal'; document.body.appendChild(m); }
  m.innerHTML='<div class="bd-modal-box" style="text-align:center;min-width:280px;">'
    + '<div class="bd-modal-title" style="color:#fca5a5;">⚠ 진행 초기화</div>'
    + '<div style="color:#cbd5e1;font-size:14px;margin-bottom:16px;line-height:1.5">퀘스트·레벨·장비·카드·아이템이 모두 삭제됩니다.<br>정말 초기화할까요?</div>'
    + '<button class="bd-choice-btn bd-choice-battle" onclick="window.BD_resetProgress(true);document.getElementById(\'bd-reset-modal\').classList.remove(\'show\')">초기화</button>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-reset-modal\').classList.remove(\'show\')">취소</button></div>';
  m.classList.add('show');
}
window.BD_confirmReset = confirmReset;

// =========================================================================
// 핵심 루프: 위험 오브젝트 → 조사 → 배지 → 전투 → 정화 (기획서 6번)
//  에디터에서 오브젝트에 interactable='hazard' 를 지정하고
//  hazardFamily('smoke'|'pollute'|'dark'), hazardId 를 넣으면 자동으로 이 루프를 탑니다.
//  맵에 직접 코드를 박지 않고, 오브젝트 속성만으로 작동하게 설계.
// =========================================================================
// 위험 오브젝트와 상호작용 시작 (F키 등에서 호출)
/* (v240e) 정화 게이트 — "주민의 부탁을 받은 위험요소"만 정화할 수 있다.
   설정과 결합: 배지의 힘은 사람들의 마음(부탁)에서 나온다.
   · prologue/tutorial: 수여식에서 선생님이 이미 부탁 → 항상 허용
   · ch1~ch4: 그 장의 현지에게 말을 걸어 부탁을 들으면 해금 (hzok_chN, 세이브의 damiSeen에 영속)
   · final/보스: 4장까지 완료(questIdx>=5)하면 허용
   · 프리픽스가 없는 커스텀(에디터) 위험요소는 게이트 없이 허용 — 에디터 계약 유지 */
function BD_hazardChapterOf(hid){
  hid = String(hid || '');
  for (var n = 1; n <= 4; n++) if (hid.indexOf('ch' + n + '_') === 0) return 'ch' + n;
  if (hid.indexOf('tutorial') === 0 || hid.indexOf('prologue') === 0) return 'prologue';
  if (hid.indexOf('final') === 0 || hid.indexOf('boss') === 0) return 'final';
  return 'free';
}
window.BD_hazardAllowed = function(hid, obj){
  try{
    if (obj && obj.isBoss) return (typeof window.BD_finaleOpen==='function') ? !!BD_finaleOpen() : !!(window.BD && (BD.questIdx || 0) >= 5);
    var ch = BD_hazardChapterOf(hid);
    if (ch === 'free' || ch === 'prologue') return true;
    if (ch === 'final') return (typeof window.BD_finaleOpen==='function') ? !!BD_finaleOpen() : !!(window.BD && (BD.questIdx || 0) >= 5);
    return !!(window.BD_DAMI && BD_DAMI.seen && BD_DAMI.seen('hzok_' + ch));
  }catch(e){ return true; }
};
function hazardInteract(obj){
  if(!obj) return false;
  /* (v315) 담이 오프닝·튜토 초반(move/guide) 동안 조사 잠금 —
     안내가 나오기 전에 전투로 돌입해 튜토 단계가 꼬이던 문제. hazard 스텝부터는 조사 허용 */
  try{
    var __hold = false;
    /* (v365) 오프닝 재생은 비차단 — 담이가 말하는 중에도 조사 가능 (발화 채널 분리) */
    if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()){
      var __sid = window.__bdTutStepId || '';
      if (__sid === 'move' || __sid === 'guide') __hold = true;
    }
    if (__hold && !obj.isBoss){
      if (!window.__bdRushHoldAt || Date.now() - window.__bdRushHoldAt > 4000){
        window.__bdRushHoldAt = Date.now();
        try{ bdToast('\uD83D\uDCA0 담이의 이야기를 잠깐 들어봐요!'); }catch(eT){}
      }
      return true;
    }
  }catch(eO){}
  // (v240b) 선택창을 막 닫았는데 F가 눌린 채면 곧바로 다시 열리던 문제 — 400ms 쿨다운
  if(Date.now() - (window.__bdChoiceClosedAt||0) < 400) return false;
  // (v240e) 아직 부탁받지 않은 위험요소: 조사 대신 짧은 독백 + 담이 안내 (레벨디자인 유도)
  {
    const _hidG = obj.hazardId || obj.id || (obj.label || 'hazard');
    const _finaleOpen = obj && obj.isBoss && ((window.BD_finaleOpen && BD_finaleOpen()) || (window.BD_canStartFinale && BD_canStartFinale()));   // (v282)
    if (!_finaleOpen && !isPurified(_hidG) && window.BD_hazardAllowed && !BD_hazardAllowed(_hidG, obj)){
      const _ch = BD_hazardChapterOf(_hidG);
      showDialog('나', [
        '(…불안한 기운이 느껴져. 그런데 함부로 건드리긴 좀 그래.)',
        '(근처 사람들 이야기부터 들어봐야겠어.)',
      ], function(){
        try{
          if(window.BD_DAMI) BD_DAMI.show('주민의 부탁이 곧 제 힘이에요. 이 동네 분들과 먼저 이야기해 봐요!',
            { face:'base', once:'hz_lock_' + _ch });
        }catch(e2){}
      });
      return true;
    }
  }
  // (v57) 주민 부탁 게이트 — 부탁을 받기 전에는 조사(전투)로 이어지지 않는다
  try{
    var __g = window.BD_hzQuestGate && BD_hzQuestGate(obj);
    if (__g === 'region'){
      showDialog('나', [
        '(여긴 아직 내 차례가 아니야.)',
        '(지금 맡은 동네의 부탁부터 마무리하자.)',
      ]);
      return true;
    }
    if (__g === 'tuto'){
      showDialog('나', [
        '(우선 화살표가 가리키는 방치된 쓰레기부터 정화하자.)',
      ]);
      return true;
    }
    if (__g){
      /* (v365) 막연한 독백 대신 담당 주민 지목 + 길찾기 추적 자동 시작 */
      var __gp = null;
      try{
        var __pairs = (window.BD_hzQuestMap ? BD_hzQuestMap(Number(currentStage)) : []) || [];
        for (var __i = 0; __i < __pairs.length; __i++){
          if (__pairs[__i].id === obj.hazardId){ __gp = __pairs[__i]; break; }
        }
      }catch(eGP){}
      if (__gp && __gp.npc){
        showDialog('나', [
          '(「' + (obj.label || '위험요소') + '」… 함부로 손대기 전에,',
          '먼저 ' + __gp.npc + '의 이야기를 들어보자. ❗ 표시를 따라가면 돼.)',
        ]);
        try{
          var __st365 = STAGES[Number(currentStage)];
          var __no = __st365 && (__st365.objects || []).find(function(x){
            return x && x.resident && String(x.npcName || x.label || '').trim() === __gp.npc; });
          if (__no && window.BD_mapTrackStart){
            BD_mapTrackStart(Number(currentStage), __gp.npc + ' — 부탁 듣기',
              (Number(__no.rx) || 0) + (Number(__no.rw) || 0.04) / 2,
              (Number(__no.ry) || 0) + (Number(__no.rh) || 0.06) / 2);
          }
        }catch(eTr){}
      } else {
        showDialog('나', [
          '(…근처 주민들이 곤란해하는 눈치야.)',
          '(먼저 ❗ 표시가 있는 주민의 이야기를 들어보자.)',
        ]);
      }
      return true;
    }
  }catch(eG){}
  const hid = obj.hazardId || obj.id || (obj.label || 'hazard');
  // 이미 정화된 오브젝트면 안전 대사만 — (v153) 위험요소 종류별로 다양하게
  if(isPurified(hid)){
    const cleanedLines = {
      tutorial_trash: '깨끗하게 치워둔 자리야. 이제 사람들이 편하게 지나다녀.',
      ch1_cigarette:  '담배 연기가 걷힌 골목. 공기가 한결 맑아졌어.',
      ch1_kickboard:  '킥보드도 잘 세워뒀고, 길이 뻥 뚫렸네.',
      ch2_bottle:     '유리병을 다 치운 곳이야. 이제 맨발로 뛰어도 안전하겠다.',
      ch2_glass:      '반짝이던 유리 조각이 사라졌어. 아이들이 놀아도 걱정 없겠어.',
      ch3_graffiti:   '낙서를 지운 벽. 원래 색이 이렇게 예뻤구나.',
      ch3_noise:      '시끄럽던 곳이 조용해졌어. 다들 편히 쉬겠지.',
      ch4_streetlight:'가로등이 다시 환하게 켜졌어. 밤에도 안심이야.',
      ch4_crack:      '갈라진 길을 정비해뒀어. 이제 발 헛디딜 일 없겠다.',
    };
    let line = '여기는 이미 정리했었지. 안전한 상태야.';
    for (const key in cleanedLines) {
      if (String(hid).indexOf(key) === 0) { line = cleanedLines[key]; break; }
    }
    showDialog('나', [line]);
    return true;
  }
  const family = obj.hazardFamily || BD_currentFamilyOr('pollute');
  const famName = { smoke:'연기·소음', pollute:'오염·정리', dark:'어둠' }[family] || '위험';
  // variant별 구체적 조사 묘사
  const vid = obj.hazardVariant;
  const investLines = {
    cigarette: '매캐한 담배 연기가 자욱하다. 숨쉬기가 힘들 정도야...',
    noise_bat: '귀를 찢는 듯한 소음이 울린다. 도무지 집중할 수가 없어...',
    trash: '쓰레기가 잔뜩 쌓여 악취가 난다. 이대로 두면 병이 생길지도 몰라.',
    glass: '깨진 유리 조각이 흩어져 있다. 누가 밟으면 크게 다칠 거야!',
    bottle: '방치된 술병이 나뒹군다. 깨지면 정말 위험하겠어.',
    graffiti: '벽이 온통 낙서로 뒤덮였다. 동네가 어수선해 보여.',
    kickboard: '킥보드가 길을 완전히 막고 있다. 이러다 누가 걸려 넘어지겠어.',
    streetlight: '가로등이 깜빡이다 꺼진다. 밤이면 이 길은 칠흑같이 어둡겠지.',
    road_crack: '도로가 부서져 큰 균열이 생겼다. 발을 헛디디면 다칠 거야.',
    sign_ghost: '위험 표지판이 쓰러져 방치돼 있다. 위험을 알릴 수가 없잖아.',
    dark_alley: '가로등 하나 없는 어두운 산책로다. 밤에 지나가려면 무섭겠어...',   // (v193)
    bicycle: '자전거가 인도를 가로막고 쓰러져 있다. 걷다가 걸려 넘어지겠어.',        // (v193)
  };
  const flavor = (vid && investLines[vid]) ? investLines[vid] : ('가까이서 살펴보니 ' + famName + ' 계열의 불안한 기운이 느껴진다...');
  // 조사 대사 → 배지 선택
  showInteractChoice(obj.label || '수상한 위험 요소',
    function(){ // 조사한다 → 설명을 보고 그대로 정화에 들어간다
      showDialog('나', [
        flavor,
        '지킴이 배지가 희미하게 빛나기 시작한다. 불안의 그림자가 숨어 있어.',
        '배지를 비춰 정화하자!'
      ], function(){
        // (v239) 예전엔 여기서 끝나 「조사했는데 아무 일도 안 난다」로 느껴졌다
        setTimeout(function(){
          try{ console.log('[선택] 조사한다 → 전투 시작'); startHazardBattle(obj, family, hid); }catch(e){}
        }, 260);
      });
    },
    function(){ // 지킴이 배지를 비춘다 → 즉시 전투
      startHazardBattle(obj, family, hid);
    }
  );
  return true;
}
window.BD_hazardInteract = hazardInteract;

// =========================================================================
// 위험요소 배치 기능 (게임 화면에서 직접 배치)
// =========================================================================
// 지정한 맵 좌표(rx,ry)에 위험요소를 놓는다. 건물과 겹치면 경고.
window.BD_placeHazardAt = function(rx, ry){
  try {
    if (typeof STAGES === 'undefined') return;
    const stage = STAGES[currentStage];
    if (!stage) return;
    const rw = 0.08, rh = 0.08;
    // 건물/벽과 겹치는지 확인
    const L=rx-rw/2, R=rx+rw/2, T=ry-rh/2, B=ry+rh/2;
    let onBuilding = false;
    for (const o of stage.objects) {
      if (o.type!=='building' && o.type!=='wall') continue;
      const oL=o.rx, oR=o.rx+(o.rw||0), oT=o.ry, oB=o.ry+(o.rh||0);
      if (oL<R && oR>L && oT<B && oB>T) { onBuilding = true; break; }
    }
    // 위험요소 오브젝트 생성
    const id = 'hazard_' + Date.now().toString(36);
    const variants = ['trash','cigarette','dust','dark'];
    const families = { trash:'pollute', cigarette:'smoke', dust:'smoke', dark:'dark' };
    const variant = window.__bdHazardNextVariant || 'trash';
    const hz = {
      type:'hazard', rx:rx-rw/2, ry:ry-rh/2, rw:rw, rh:rh,
      cx:rx-rw/2, cy:ry-rh/2, cw:rw, ch:rh,
      label:'위험 요소', interactable:'hazard',
      hazardVariant:variant, hazardFamily:(families[variant]||'pollute'), hazardId:id
    };
    stage.objects.push(hz);
    if (onBuilding) { try{ bdToast('⚠️ 건물과 겹칩니다 - 다른 곳을 추천'); }catch(e){} }
    else { try{ bdToast('✅ 위험요소 배치됨! (클릭으로 계속 배치)'); }catch(e){} }
  } catch(e){}
};
// 배치 모드 토글
window.BD_toggleHazardPlace = function(){
  window.__bdHazardPlaceMode = !window.__bdHazardPlaceMode;
  window.__bdHazardPlaceArmedAt = Date.now();  // (v126) 토글 직후 300ms 무장 대기 — 클릭 관통 방지
  const btn = document.getElementById('bd-hazard-place-btn');
  if (btn) {
    btn.textContent = window.__bdHazardPlaceMode ? '🎯 배치중 (클릭!)' : '🎯 위험요소 배치';
    btn.style.background = window.__bdHazardPlaceMode ? 'rgba(255,80,60,0.9)' : 'rgba(16,24,44,.92)';
  }
  const hint = document.getElementById('bd-hazard-place-hint');
  if (hint) hint.style.display = window.__bdHazardPlaceMode ? 'block' : 'none';
  try{ bdToast(window.__bdHazardPlaceMode ? '🎯 맵을 클릭해 위험요소를 놓으세요' : '배치 모드 종료'); }catch(e){}
};
// 마지막 배치한 위험요소 되돌리기
window.BD_undoHazard = function(){
  try {
    const stage = STAGES[currentStage];
    // 에디터로 놓은(hazard_ 로 시작하는 id) 것만 제거
    for (let i=stage.objects.length-1; i>=0; i--){
      const o = stage.objects[i];
      if (o.interactable==='hazard' && (o.hazardId||'').startsWith('hazard_')){
        stage.objects.splice(i,1);
        bdToast('↩️ 마지막 배치 취소');
        return;
      }
    }
    bdToast('취소할 배치가 없습니다');
  } catch(e){}
};

function BD_currentFamilyOr(def){
  try { return (typeof currentEnemyFamily==='function') ? currentEnemyFamily() : (window.BD_currentFamily || def); }
  catch(e){ return def; }
}

// 전투 진입: HSR 전투 시스템으로 넘기고, 승리 시 정화 콜백 등록
function startHazardBattle(obj, family, hid){
  // (v277) 안전 행동 선택 퀴즈 제거 — 조사하면 바로 정화 전투 (사용자 피드백)
  // 튜토리얼: 조사→전투 단계 진행
  try {
    if(window.BD_isTutorialActive && window.BD_isTutorialActive()){
      window.BD_tutorialAdvance('invest');
      setTimeout(function(){ window.BD_tutorialAdvance('battle'); }, 900);
    }
  } catch(e){}
  // (v126) 속성 스킬을 얻은 뒤 처음 전투에 들어가면 상성 공략 팁
  try {
    if (window.BD && BD.unlockedSkills && BD.unlockedSkills.length > 1) {
      setTimeout(function(){
        window.BD_tip && window.BD_tip('battle_elem', { icon:'⚔️', title:'약점 속성을 노리세요!',
          text:'위험 요소마다 <b>약한 속성(💨 바람·🌿 자연·🔧 시설)</b>이 있어요.<br>'
             + '약점 속성 스킬로 공격하면 피해 <b>2배</b>, 저항 속성이면 0.4배로 뚝 떨어져요!<br>'
             + '전투가 어렵다면 <b>E 가방</b>에서 다른 속성 스킬로 바꿔보세요.' });
      }, 1600);
    }
  } catch(e){}
  // 전투가 끝난 뒤 실행될 정화 콜백을 예약
  BD._pendingHazard = { obj:obj, family:family, hid:hid };
  if(window.HSR && typeof HSR.start==='function'){
    // 세부 위험 요소(variant) 지정 시 계열을 자동 반영
    let fam = family;
    const vid = obj && obj.hazardVariant;
    if(vid && window.HAZARD_VARIANTS && window.HAZARD_VARIANTS[vid]){
      fam = window.HAZARD_VARIANTS[vid].fam || family;
    }
    // 적 계열을 이 위험 요소의 계열로 지정
    if(typeof window.BD_currentFamily!=='undefined') window.BD_currentFamily = fam;
    // 로스팅 개선: 보스전 지정 (오브젝트에 isBoss=true)
    HSR._isBoss = !!(obj && obj.isBoss);
    // variant 전달 (전투 중 몹 이름·교육 메시지에 사용)
    HSR.enemy.variant = (vid && !HSR._isBoss) ? vid : null;
    // 1대2 특수 전투: 오브젝트에 hazardCount>=2 지정 시 두 번째 적 예약
    if(obj && Number(obj.hazardCount) >= 2 && !HSR._isBoss){
      // (v130) 두 번째 적도 같은 장 스케일링 적용
      const _hid2 = hid || '';
      let _t2 = 0;
      const _tm2 = /^ch([1-4])_/.exec(_hid2);
      if (_tm2) _t2 = Number(_tm2[1]);
      HSR._pendingSecond = {
        maxhp: Math.round(120 * (1 + _t2 * 0.18)),
        atk: Math.round(6 * (1 + _t2 * 0.15)),
        spd: 94, bdFamily: fam
      };
    } else {
      HSR._pendingSecond = null;
    }
    try { HSR.start(); } catch(e){ bdToast('전투를 시작할 수 없습니다'); }
  } else {
    // HSR이 없으면 즉시 정화 (폴백)
    onHazardBattleEnd(true);
  }
}

// 전투 종료 시 호출 (HSR 쪽에서 window.BD_onHazardBattleEnd(win) 호출)
function onHazardBattleEnd(win){
  // (v223) 전투에서 쓴 배지 에너지를 지속 MP에 반영
  try{ if(window.BD && window.HSR && typeof HSR.sp === 'number') BD.mp = Math.max(0, Math.min(BD.maxMp || 5, HSR.sp)); }catch(e){}
  const ph = BD._pendingHazard; BD._pendingHazard = null;
  window.__bdExitLockUntil = Date.now() + 1500;   // (v220) 출구 오발 방지
  if(!ph) return;
  if(!win){
    // (v112) "다시 도전할 수 있어요"라고 안내하면서 체력은 그대로여서 실제로는 재도전이 어려웠다.
    //  체력을 임의로 채우지 않고(원래 의도인 체력 관리는 유지), 회복처를 바로 안내해 준다.
    var __lines = ['이번에는 물러났다.','다시 도전할 수 있어요.'];
    try{
      var __max = 100;
      if (typeof heroHP !== 'undefined' && heroHP < __max * 0.5){
        var __rest = (typeof window.BD_nearestRest === 'function') ? BD_nearestRest() : null;
        if (__rest && __rest.obj){
          __lines.push('(그전에… ' + (__rest.obj.label || '가까운 문화시설') + '에서 좀 쉬어야겠어.)');
          // 회복 안내 화살표를 바로 띄운다 (HP 50% 미만 안내와 같은 경로)
          window.__bdNavOverride = { rx:__rest.obj.rx, ry:__rest.obj.ry,
            rw:__rest.obj.rw, rh:__rest.obj.rh,
            label:(__rest.obj.label||'문화시설'), _guideLabel:'여기서 쉬어 가기', __rest:true };
        }
      }
    }catch(eL){}
    showDialog('', __lines);
    return;
  }
  // (v282) 최종 보스 정화 → 클리어 플래그·승급만 기록.
  //  엔딩 연출은 final_done 컷신 + showEnding 한 경로로 일원화 (기존 중복 대사 제거).
  try {
    if (ph.obj && ph.obj.isBoss) {
      try { BD.gameCleared = true; if (typeof bdSave === 'function') bdSave(); } catch (eC) { }
      try { BD_PROGRESS.story.storyPhase = 'cleared'; } catch (eC2) { }
      // 스탬프 루트로 조기 개방해 questIdx<5인 채 보스를 잡아도 챕터 카운트가 오염되지 않게 승급
      try { if (window.BD && typeof BD.questIdx === 'number' && BD.questIdx < 5) BD.questIdx = 5; } catch (eQ5) { }
      try { if (typeof autoSave === 'function') autoSave('엔딩'); } catch (e4) { }
    }
  } catch (eFin) { }
  // 정화 처리
  markPurified(ph.hid);
  // (v273) 진행 기록: 스테이지::hazardId + 장 완료 체크
  try {
    var __pk = String(currentStage) + '::' + String(ph.hid);
    if (window.BD_PROGRESS && BD_PROGRESS.safety.purifiedHazardIds.indexOf(__pk) < 0) BD_PROGRESS.safety.purifiedHazardIds.push(__pk);
    setTimeout(function () { try { window.BD_Chapter && BD_Chapter.check(); } catch (e2) { } }, 1400);
  } catch (ePr) { }
  // (v240) 필드 복귀 후, 방금 정화한 자리에서 빛 연출 + 깨끗해진 그림으로 전환
  try{
    const _src = ph.obj || (function(){
      const st = (typeof STAGES!=='undefined' && typeof currentStage!=='undefined') ? STAGES[currentStage] : null;
      if(!st) return null;
      return (st.objects||[]).find(o=>o && o.interactable==='hazard' && (o.hazardId===ph.hid));
    })();
    if(_src && typeof window.BD_purifyFX === 'function'){
      setTimeout(function(){ BD_purifyFX(_src); }, 550);
    }
  }catch(e){}
  // "정화의 보람" 강화: 정화 시 HP 회복 (스킬 레벨당 +6)
  try {
    if(typeof window.BD_getSafetyBonus === 'function'){
      const healLv = window.BD_getSafetyBonus('regen_spd');
      if(healLv > 0){
        const healAmt = healLv * 6;
        const maxHp = (typeof getMaxHP==='function') ? getMaxHP() : (BD.maxHp||100);
        if(typeof window.BD_syncHP === 'function') window.BD_syncHP(Math.min(maxHp, heroHP + healAmt), false);
        else {
          if(typeof heroHP !== 'undefined'){ heroHP = Math.min(maxHp, heroHP + healAmt); }
          BD.hp = Math.min(BD.maxHp||maxHp, (BD.hp||0) + healAmt);
        }
        setTimeout(function(){ try{ bdToast('💚 정화의 보람 — HP +' + healAmt); }catch(e){} }, 900);
      }
    }
  } catch(e){}
  // 튜토리얼: 정화 완료 단계 (마지막)
  try { if(window.BD_isTutorialActive && window.BD_isTutorialActive()) setTimeout(function(){ window.BD_tutorialAdvance('clear'); }, 1000); } catch(e){}
  try{ if(window.BDSound) BDSound.heal(); }catch(e){}
  // 정화 여부는 BD.purified 한 곳만 진실의 원천으로 사용한다.
  // 오브젝트에 _purified를 다시 기록하면 에디터 저장을 통해 새 게임까지 오염될 수 있다.
  // (v163+) 정화 보상: 결정 시스템 폐지 → 소지금 소량 지급
  const gainedGold = 10;
  if(typeof playerGold !== 'undefined') playerGold += gainedGold;
  // (v137) 안전도 경험치 지급 — 이전에는 이 정화 루프가 안전 스킬 경험치(safetyXP)를
  // 전혀 채워주지 않아서, 본편만 플레이하면 "안전 스킬"(정화의 보람 포함)이 영원히 잠겨 있었음.
  try {
    if (typeof window.BD_addSafetyXP === 'function') {
      const isBoss = !!(ph.obj && ph.obj.isBoss);
      window.BD_addSafetyXP(isBoss ? 40 : 15);
    }
  } catch(e){}
  // (v126) 첫 정화 결정 획득 시 장비 강화 안내 (결과 화면이 닫힐 즈음)
  setTimeout(function(){
    try {
      window.BD_tip && window.BD_tip('first_crystal', { icon:'💰', title:'봉담의 재화',
        text:'💰 <b>소지금</b> — 동네 가게(약국·편의점)에서 간식·음료·용품 구매<br>'
           + '⚡ <b>안전 포인트</b> — E 가방의 안전 스킬 강화 (정화의 보람 등, 정화할 때마다 조금씩 쌓여요)' });
    } catch(e){}
  }, 3000);
  // (v73) 부탁 대상 위험요소는 '주민에게 보고'할 때 목표가 오른다 (부탁 → 정화 → 보고 흐름 유지).
  //  튜토리얼 쓰레기·보스처럼 부탁이 없는 대상만 정화 즉시 카운트.
  try{
    var __hidQ = ph.obj && ph.obj.hazardId;
    var __qs = {};
    try{ __qs = JSON.parse(localStorage.getItem('bd_hzquest_v57')||'{}'); }catch(eS){}
    if (!__hidQ || !__qs[__hidQ]) bdQuestProgress();   // 부탁 대상이 아니면 즉시 +1
  }catch(eQ){ bdQuestProgress(); }
  bdSave();
  // 개선: 봉담이 얼마나 안전해졌는지 피드백 (정화 동기 부여)
  try{
    if(typeof computeRegionSafety==='function'){
      const sdata = computeRegionSafety();
      const stotal = Math.round(sdata.reduce((s,d)=>s+d.pct,0)/sdata.length);
      setTimeout(()=>{ bdToast('🗺️ 봉담 안전도 ' + stotal + '%'); }, 2200);
    }
  }catch(e){}
  // 전투 결과 화면 (variant 있으면 그 정보 우선)
  const vid = ph.obj && ph.obj.hazardVariant;
  let dispName = (ph.obj && ph.obj.label) || '위험 요소';
  if(vid && window.HAZARD_VARIANTS && window.HAZARD_VARIANTS[vid]){
    const v = window.HAZARD_VARIANTS[vid];
    dispName = (v.icon?v.icon+' ':'') + v.name;
  }
  showBattleResult({
    name: dispName,
    gold: gainedGold,
    family: ph.family,
    variant: vid || null
  });
}
window.BD_onHazardBattleEnd = onHazardBattleEnd;

// =========================================================================
// 전투 결과 화면 (기획서 18-6번)
// =========================================================================
function showBattleResult(info){
  let m = document.getElementById('bd-result-modal');
  if(!m){ m=document.createElement('div'); m.id='bd-result-modal'; m.className='bd-modal'; document.body.appendChild(m); }
  const famName = { smoke:'연기·소음', pollute:'오염·정리', dark:'어둠' }[info.family] || '';
  // 로스팅 개선: 정화 후 안전 교육 메시지 (게임의 교육 목적)
  let eduMsg = '';
  try {
    const monData = (window.HAZARD_MONSTERS && window.HAZARD_MONSTERS[info.family]) ||
                    (typeof HAZARD_MONSTERS!=='undefined' ? HAZARD_MONSTERS[info.family] : null);
    if(monData && monData.edu) eduMsg = monData.edu;
    // variant가 있으면 그 교육 메시지 우선
    if(info.variant && window.HAZARD_VARIANTS && window.HAZARD_VARIANTS[info.variant] && window.HAZARD_VARIANTS[info.variant].edu){
      eduMsg = window.HAZARD_VARIANTS[info.variant].edu;
    }
  } catch(e){}
  m.innerHTML = '<div class="bd-modal-box" style="text-align:center;max-width:380px;">'
    + '<div class="bd-modal-title" style="color:#1f8a52;font-size:22px;">✨ 정화 완료!</div>'
    + '<div style="color:#5b4a33;font-size:14px;margin:8px 0 14px;line-height:1.6">'
    + '<b>' + escapeHtmlBd(info.name) + '</b> 을(를) 안전한 상태로 되돌렸습니다.<br>'
    + (famName ? '<span style="color:#1b6ca8;font-weight:700">' + famName + '</span> 계열의 불안이 사라졌어요.' : '')
    + '</div>'
    + (eduMsg ? '<div class="bd-edu-box"><div class="bd-edu-title">💡 안전 상식</div>' + escapeHtmlBd(eduMsg) + '</div>' : '')
    + '<div class="bd-result-rewards">'
    + '<div class="bd-result-row"><span>💰 소지금</span><b>+' + (info.gold||0) + 'G</b></div>'
    + '<div class="bd-result-row"><span>🏅 지킴이 레벨</span><b>Lv.' + BD.lv + '</b></div>'
    + '<div class="bd-result-row"><span>❤️ 남은 체력</span><b>' + Math.round(BD.hp) + ' / ' + BD.maxHp + '</b></div>'
    + '</div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-result-modal\').classList.remove(\'show\')">확인</button>'
    + '</div>';
  m.classList.add('show');
}
window.BD_showBattleResult = showBattleResult;
function escapeHtmlBd(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

// =========================================================================
// 필수 UI 1번: 타이틀 화면 (게임 시작 / 이어하기 / 초기화)
//  window.BD_showTitle() 로 표시. 저장 데이터 유무에 따라 '이어하기' 활성/비활성.
//  '게임 시작' 시 onStart 콜백(맵 이동 등)을 나중에 직접 연결.
// =========================================================================
function hasSaveData(){
  try { return !!localStorage.getItem(SAVE_KEY); } catch(e){ return false; }
}
// 전역 노출: 타이틀 버튼이 인라인 onclick으로 직접 호출 (핸들러 연결 실패 방지)
window.BD_startNewGame = function(){
  // confirm 제거: 새 게임은 항상 즉시 시작 (confirm 차단/취소로 멈추던 문제 해결)
  // 저장 유무와 관계없이 런타임 정화 플래그까지 비운다. 수동 저장 슬롯은 보존한다.
  try { resetProgress(false); } catch(e){}
  try { hideTitle(); } catch(e){}
  // (v128) 캐릭터·지킴이 유형 선택 화면을 먼저 띄우고, 확정하면 실제 게임 진입
  window.BD_openStartSetup(function(){
    _sceneShown = {};
    try {
      if(typeof enterGameScreen === 'function') enterGameScreen('지킴이', false);
      else if(typeof window.enterGameScreen === 'function') window.enterGameScreen('지킴이', false);
    } catch(e){ console.warn('게임 진입 실패', e); }
    setTimeout(function(){ try {
      var _afterPrologue = function(){
      // 프롤로그 끝나면: 아직 추적 중인 임무가 없으면 메인 프롤로그 임무를 자동 추적
      // (길안내는 추적 중인 임무가 있을 때만 표시되므로, 첫 목표 안내를 위해 자동 설정)
      try {
        if(window.BD && !window.BD.trackedQuest && typeof window.BD_autoTrackFirstQuest==='function'){
          window.BD_autoTrackFirstQuest();
        }
      } catch(e){}
      // 프롤로그 끝나면 튜토리얼 시작
      try { if(typeof window.BD_startTutorial==='function') window.BD_startTutorial(); } catch(e){}
      };
      // (v199) 도서관 심부름 튜토리얼이 활성이면 프롤로그 VN을 광장 도착 시점으로 미룬다
      if (window.BD_TUT2_DEFER && window.BD_TUT2_DEFER(_afterPrologue)) { /* 심부름이 위임받음 */ }
      else {
        // (v271) 기획서 §7 — 실내 담이 오프닝 제거: 담이는 건물 밖 첫 이동에서만 깨어난다.
        _afterPrologue();
      }
    } catch(e){} }, 700);
  });
};

// ── (v128) 새 게임 시작 전: 캐릭터·지킴이 유형 선택 화면 ──
// 캐릭터는 기존 여주인공/남주인공 스프라이트를 재사용하고,
// "직업"은 봉담 세계관에 맞춰 안전 활동 유형 3종(스탯 소량 보너스)으로 재구성했다.
const BD_START_TYPES = [
  { id:'patrol', icon:'🏃', name:'순찰형', desc:'체력이 좋아 오래 돌아다녀요', bonus:'' },
  { id:'guide',  icon:'📣', name:'안내형', desc:'침착하게 상황을 안내해요',   bonus:'' },
  { id:'fix',    icon:'🔧', name:'정비형', desc:'손이 빨라 정화가 힘차요',     bonus:''   },
];
window.__bdStartCharId = 1;
window.__bdStartTypeId = 'patrol';
window.BD_openStartSetup = function(onConfirm){
  let m = document.getElementById('bd-startsetup-modal');
  if(!m){ m = document.createElement('div'); m.id='bd-startsetup-modal'; m.className='bd-modal'; document.body.appendChild(m); }
  window.__bdStartConfirm = onConfirm;
  const charImg1 = (typeof FEMALE_FRONT_STILL!=='undefined') ? FEMALE_FRONT_STILL : ((typeof _sprImgs!=='undefined' && _sprImgs['front'] && _sprImgs['front'][0]) ? _sprImgs['front'][0].src : '');
  const charImg2 = (typeof MALE_FRONT_STILL!=='undefined') ? MALE_FRONT_STILL : ((typeof _maleImgs!=='undefined' && _maleImgs['front'] && _maleImgs['front'][0]) ? _maleImgs['front'][0].src : '');
  const typesHtml = BD_START_TYPES.map(function(t){
    return '<div id="bd-type-' + t.id + '" onclick="window.BD_pickStartType(\'' + t.id + '\')" '
      + 'style="flex:1;min-width:120px;cursor:pointer;border-radius:10px;padding:12px 10px;text-align:center;'
      + 'border:2px solid rgba(120,160,255,.35);background:rgba(255,255,255,.04);">'
      + '<div style="font-size:26px">' + t.icon + '</div>'
      + '<div style="font-weight:700;color:#e8eefc;margin:4px 0 2px">' + t.name + '</div>'
      + '<div style="font-size:12px;color:#9fb3d9">' + t.desc + '</div>'
      + '<div style="font-size:11px;color:#7dd3fc;margin-top:4px">' + t.bonus + '</div>'
      + '</div>';
  }).join('');
  m.innerHTML = '<div class="bd-modal-box" style="max-width:520px;">'
    + '<div class="bd-modal-title">🛡️ 지킴이 만들기</div>'
    + '<div style="font-size:13px;color:#9fb3d9;margin-bottom:12px">함께할 지킴이를 골라주세요.</div>'
    + '<div style="font-size:13px;color:#dfe7fb;font-weight:700;margin-bottom:6px">캐릭터</div>'
    + '<div style="display:flex;gap:14px;justify-content:center;margin-bottom:16px;">'
    +   '<div id="bd-char-1" onclick="window.BD_pickStartChar(1)" style="cursor:pointer;border-radius:10px;padding:10px 16px;text-align:center;border:3px solid var(--gold,#c8902a);background:rgba(200,144,42,.18);">'
    +     '<img src="' + charImg1 + '" style="height:96px;width:auto;image-rendering:pixelated;display:block;margin:0 auto 6px;">'
    +     '<div style="font-size:12px;color:#e8eefc;">여자 지킴이</div></div>'
    +   '<div id="bd-char-2" onclick="window.BD_pickStartChar(2)" style="cursor:pointer;border-radius:10px;padding:10px 16px;text-align:center;border:2px solid rgba(120,160,255,.35);background:rgba(255,255,255,.04);">'
    +     '<img src="' + charImg2 + '" style="height:96px;width:auto;image-rendering:pixelated;display:block;margin:0 auto 6px;">'
    +     '<div style="font-size:12px;color:#e8eefc;">남자 지킴이</div></div>'
    + '</div>'
    + '<button class="modal-btn" onclick="window.BD_confirmStartSetup()">모험 시작</button>'
    + '</div>';
  m.classList.add('show');
  window.BD_pickStartChar(window.__bdStartCharId || 1);
};
window.BD_pickStartChar = function(n){
  window.__bdStartCharId = n;
  const c1 = document.getElementById('bd-char-1'), c2 = document.getElementById('bd-char-2');
  if(!c1 || !c2) return;
  const on = 'border:3px solid var(--gold,#c8902a);background:rgba(200,144,42,.18);';
  const off = 'border:2px solid rgba(120,160,255,.35);background:rgba(255,255,255,.04);';
  c1.style.cssText = 'cursor:pointer;border-radius:10px;padding:10px 16px;text-align:center;' + (n===1?on:off);
  c2.style.cssText = 'cursor:pointer;border-radius:10px;padding:10px 16px;text-align:center;' + (n===2?on:off);
};
window.BD_pickStartType = function(id){
  window.__bdStartTypeId = id;
  BD_START_TYPES.forEach(function(t){
    const el = document.getElementById('bd-type-' + t.id);
    if(!el) return;
    el.style.border = (t.id===id) ? '2px solid #7dd3fc' : '2px solid rgba(120,160,255,.35)';
    el.style.background = (t.id===id) ? 'rgba(125,211,252,.14)' : 'rgba(255,255,255,.04)';
  });
};
window.BD_confirmStartSetup = function(){
  try {
    if(typeof selectedCharacter!=='undefined') selectedCharacter = window.__bdStartCharId || 1;
    if(window.BD) BD.startType = window.__bdStartTypeId || 'patrol';
    if(typeof recalcStats==='function'){
      recalcStats(); BD.hp=BD.maxHp; BD.mp=BD.maxMp;
      if(typeof window.BD_syncHP==='function') window.BD_syncHP(BD.hp, false);
    }
    bdSave();
  } catch(e){}
  const m = document.getElementById('bd-startsetup-modal');
  if(m) m.classList.remove('show');
  const cb = window.__bdStartConfirm;
  window.__bdStartConfirm = null;
  if(typeof cb === 'function') cb();
};
window.BD_continueGame = function(){
  // 세이브 슬롯 선택 UI 열기
  try { openSlotUI('load'); } catch(e){ console.warn('슬롯 UI 실패', e); }
};
window.BD_resetGame = function(){ try { confirmReset(); } catch(e){} };

// 설정 모달 — 소리 / 길안내 토글 + 진행 초기화
window.BD_openTitleOptions = function(){
  let modal = document.getElementById('bd-settings-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-settings-modal'; modal.className='bd-modal bd-modal-top'; document.body.appendChild(modal); }
  let soundOn = true, guideOn = true;
  try { soundOn = window.BDSound ? BDSound.isEnabled() : true; } catch(e){}
  try { guideOn = (typeof QUEST_GUIDE_ON!=='undefined') ? QUEST_GUIDE_ON : true; } catch(e){}
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:400px;">'
    + '<div class="bd-modal-title">⚙️ 설정</div>'
    + '<div class="bd-set-row"><span>🔊 소리</span>'
    + '<button class="bd-set-toggle' + (soundOn?' on':'') + '" onclick="window.BD_settingsToggleSound(this)">' + (soundOn?'켜짐':'꺼짐') + '</button></div>'
    + '<div class="bd-set-row"><span>🧭 길안내</span>'
    + '<button class="bd-set-toggle' + (guideOn?' on':'') + '" onclick="window.BD_settingsToggleGuide(this)">' + (guideOn?'켜짐':'꺼짐') + '</button></div>'
    + '<div class="bd-set-row"><span>📖 튜토리얼 다시 보기</span>'
    + '<button class="bd-set-toggle" onclick="window.BD_resetTutorial&&window.BD_resetTutorial();bdToast(\'다음 새 게임에서 튜토리얼이 다시 나와요\')">다시 보기</button></div>'
    + '<div class="bd-set-row"><span>🔄 진행 초기화</span>'
    + '<button class="bd-set-danger" onclick="document.getElementById(\'bd-settings-modal\').classList.remove(\'show\'); window.BD_resetGame&&window.BD_resetGame();">초기화</button></div>'
    + '<button class="bd-modal-close" onclick="document.getElementById(\'bd-settings-modal\').classList.remove(\'show\')">닫기</button>'
    + '</div>';
  modal.classList.add('show');
};
window.BD_settingsToggleSound = function(btn){
  try {
    if(window.BDSound){
      const on = !BDSound.isEnabled();
      BDSound.setEnabled(on);
      btn.textContent = on ? '켜짐' : '꺼짐';
      btn.classList.toggle('on', on);
      // 게임 화면 버튼도 동기화
      const gb = document.getElementById('bd-sound-btn');
      if(gb){ gb.textContent = on ? '🔊 소리 ON' : '🔇 소리 OFF'; gb.style.opacity = on?'1':'0.5'; }
      if(on) BDSound.select();
    }
  } catch(e){}
};
window.BD_settingsToggleGuide = function(btn){
  try {
    const on = (typeof window.BD_toggleQuestGuide==='function') ? window.BD_toggleQuestGuide() : true;
    btn.textContent = on ? '켜짐' : '꺼짐';
    btn.classList.toggle('on', on);
  } catch(e){}
};

// 종료 확인 모달 (웹 게임이라 창을 닫는 대신 타이틀로 돌아가거나 안내)
window.BD_openQuitConfirm = function(){
  let modal = document.getElementById('bd-quit-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-quit-modal'; modal.className='bd-modal bd-modal-top'; document.body.appendChild(modal); }
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:380px;text-align:center;">'
    + '<div class="bd-modal-title">🚪 종료하기</div>'
    + '<div style="color:#c9d6ea;font-size:14px;line-height:1.6;margin:8px 0 18px;">정말 게임을 종료할까요?<br>진행 상황은 자동으로 저장되어 있어요.</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;">'
    + '<button class="bd-set-danger" style="flex:1;" onclick="window.BD_doQuit()">종료</button>'
    + '<button class="bd-modal-close" style="flex:1;margin:0;" onclick="document.getElementById(\'bd-quit-modal\').classList.remove(\'show\')">취소</button>'
    + '</div></div>';
  modal.classList.add('show');
};
window.BD_doQuit = function(){
  try { document.getElementById('bd-quit-modal').classList.remove('show'); } catch(e){}
  // 진행 자동 저장
  try { bdSave(); } catch(e){}
  // 게임 화면 정리 후 타이틀로 복귀 (웹은 탭을 못 닫으므로 이것이 실질적 종료)
  try {
    if(typeof exitGame === 'function') exitGame();
    else if(typeof window.exitGame === 'function') window.exitGame();
  } catch(e){}
  // 게임 화면 강제 숨김 + 타이틀 표시
  try {
    var gs = document.getElementById('game-screen');
    if(gs) gs.style.display = 'none';
  } catch(e){}
  try {
    window.__bdTitleShown = false;
    if(typeof window.BD_showTitle === 'function') window.BD_showTitle({onStart:function(){},onContinue:function(){}});
  } catch(e){}
  try { bdToast('게임을 종료했어요. 진행은 저장되었습니다.'); } catch(e){}
  // window.close도 시도 (사용자가 직접 연 탭이면 닫힘)
  try { window.close(); } catch(e){}
};
function showTitle(opts){
  opts = opts || {};
  let m = document.getElementById('bd-title-screen');
  if(!m){ m = document.createElement('div'); m.id='bd-title-screen'; document.body.appendChild(m); }
  const canContinue = hasSaveData() || (typeof anySlotHasSave==='function' && anySlotHasSave());
  m.innerHTML =
    '<img class="bd-title-bg" src="data:image/webp;base64,@@B64:31d9bbe8_src.webp@@" alt="봉담문화의집 지킴이">'
    + '<div class="bd-title-frame" id="bd-title-frame">'
    // 버튼 히트 영역: 이미지 원본(1672x941) 기준 % 좌표로 배치. JS가 실제 픽셀로 보정.
    + '<button class="bd-title-hit" id="bd-title-start" data-x="0.120" data-y="0.478" data-w="0.200" data-h="0.080" onclick="window.BD_startNewGame&&window.BD_startNewGame()" aria-label="시작하기"></button>'
    + '<button class="bd-title-hit' + (canContinue?'':' locked') + '" id="bd-title-continue" data-x="0.098" data-y="0.574" data-w="0.240" data-h="0.080"' + (canContinue?' onclick="window.BD_continueGame&&window.BD_continueGame()"':' disabled') + ' aria-label="이어하기"></button>'
    + '<button class="bd-title-hit" id="bd-title-options" data-x="0.120" data-y="0.671" data-w="0.200" data-h="0.080" onclick="window.BD_openTitleOptions&&window.BD_openTitleOptions()" aria-label="설정"></button>'
    + '<button class="bd-title-hit" id="bd-title-reset" data-x="0.120" data-y="0.767" data-w="0.200" data-h="0.080" onclick="window.BD_openQuitConfirm&&window.BD_openQuitConfirm()" aria-label="종료하기"></button>'
    + '</div>'
    + '<div class="bd-title-foot">Ver. 1.0.0 · Build 397</div>';
  m.classList.add('show');
  // 버튼 위치를 배경 이미지의 실제 표시 영역에 맞춰 보정
  positionTitleButtons();
}
// (v384) object-fit:contain의 검정 여백까지 고려해 원화 속 버튼 위치와 클릭 영역을 일치시킨다.
function positionTitleButtons(){
  const m = document.getElementById('bd-title-screen');
  if(!m) return;
  const IMG_W = 1672, IMG_H = 941;   // 원본 비율
  const vw = m.clientWidth, vh = m.clientHeight;
  if(!vw || !vh) return;
  const img = m.querySelector('.bd-title-bg');
  const fit = img ? getComputedStyle(img).objectFit : 'contain';
  const scale = (fit === 'cover') ? Math.max(vw/IMG_W, vh/IMG_H) : Math.min(vw/IMG_W, vh/IMG_H);
  const dispW = IMG_W*scale, dispH = IMG_H*scale;
  const offX = (vw - dispW)/2, offY = (vh - dispH)/2;
  const btns = m.querySelectorAll('.bd-title-hit');
  // ── (v193) 모바일 세로 화면 대응 ──
  //  외부 테마가 cover로 덮어쓰는 경우에도 메뉴가 크게 잘리면 중앙 세로 메뉴로 전환한다.
  let offscreen = false;
  btns.forEach(function(btn){
    const rx = parseFloat(btn.dataset.x), rw = parseFloat(btn.dataset.w);
    const L = offX + rx*dispW, R = L + rw*dispW;
    /* 버튼 폭의 78% 이상이 보이면 원래 아트 위 히트영역을 그대로 사용한다. */
    const visibleW = Math.max(0, Math.min(vw, R) - Math.max(0, L));
    if(visibleW < (R - L) * 0.78) offscreen = true;
  });
  if(offscreen){
    const FALLBACK_LABELS = {
      'bd-title-start':'▶ 새로 시작', 'bd-title-continue':'💾 이어하기',
      'bd-title-options':'⚙️ 설정', 'bd-title-reset':'🚪 종료하기',
    };
    const bw = Math.min(300, vw*0.78), bh = 50, gap = 12;
    const total = btns.length*bh + (btns.length-1)*gap;
    const startY = Math.max(vh*0.42, vh - total - vh*0.12);
    let i = 0;
    btns.forEach(function(btn){
      btn.classList.add('bd-title-hit-fallback');
      if(FALLBACK_LABELS[btn.id]) btn.textContent = FALLBACK_LABELS[btn.id];
      btn.style.left = ((vw - bw)/2) + 'px';
      btn.style.top = (startY + i*(bh+gap)) + 'px';
      btn.style.width = bw + 'px';
      btn.style.height = bh + 'px';
      i++;
    });
    return;
  }
  btns.forEach(function(btn){
    btn.classList.remove('bd-title-hit-fallback');
    btn.textContent = '';
    const rx = parseFloat(btn.dataset.x), ry = parseFloat(btn.dataset.y);
    const rw = parseFloat(btn.dataset.w), rh = parseFloat(btn.dataset.h);
    btn.style.left   = (offX + rx*dispW) + 'px';
    btn.style.top    = (offY + ry*dispH) + 'px';
    btn.style.width  = (rw*dispW) + 'px';
    btn.style.height = (rh*dispH) + 'px';
  });
}
window.BD_positionTitleButtons = positionTitleButtons;
// 창 크기 변하면 버튼 위치 재계산
window.addEventListener('resize', function(){ try { positionTitleButtons(); } catch(e){} });
function hideTitle(){
  const m = document.getElementById('bd-title-screen');
  if(m) m.classList.remove('show');
}
window.BD_showTitle = showTitle;
window.BD_hideTitle = hideTitle;

// =========================================================================
// 인게임 일시정지 (ESC) — 실제로 게임 루프를 멈추고 메뉴 표시
// =========================================================================
let _bdPaused = false;
let _bdPausedRaf = null;
function isInGame(){
  try { const gs = document.getElementById('game-screen'); return gs && getComputedStyle(gs).display !== 'none'; }
  catch(e){ return false; }
}
function openPause(){
  if(_bdPaused) return;
  if(!isInGame()) return;
  /* (v147) 에디터가 열려 있을 때 ESC가 여기까지 내려와 게임 루프를 죽였다.
     (에디터의 자체 ESC 닫기는 v51에서 Ctrl+Q로 바뀌며 사라졌고,
      일시정지 모달은 에디터 UI 뒤에 가려 유령 모달 청소기가 조용히 닫아 버려
      «루프 정지» 상태만 남았다 — 에디터를 닫아도 게임이 멈춰 있던 원인) */
  try { if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return; } catch(e){}
  // 전투 중이거나 대화 중이면 일시정지 안 함 (각자 ESC 처리가 있음)
  try { if(window.HSR && HSR.active) return; } catch(e){}
  _bdPaused = true;
  // 게임 루프 정지
  try {
    if(typeof gameRaf !== 'undefined' && gameRaf){ _bdPausedRaf = gameRaf; cancelAnimationFrame(gameRaf); } window.__gameLoopChainAlive = false;
  } catch(e){}
  try { if(typeof window.gameRaf !== 'undefined' && window.gameRaf){ cancelAnimationFrame(window.gameRaf); } } catch(e){}
  let modal = document.getElementById('bd-pause-modal');
  if(!modal){ modal = document.createElement('div'); modal.id='bd-pause-modal'; modal.className='bd-modal bd-modal-top'; document.body.appendChild(modal); }
  modal.innerHTML = '<div class="bd-modal-box" style="max-width:360px;text-align:center;">'
    + '<div class="bd-modal-title">⏸ 일시정지</div>'
    + '<div class="bd-pause-menu">'
    + '<button class="bd-pause-btn primary" onclick="window.BD_resumeGame()">▶ 계속하기</button>'
    + '<button class="bd-pause-btn" onclick="window.BD_pauseSave()">💾 저장하기</button>'
    + '<button class="bd-pause-btn" onclick="window.BD_openTitleOptions&&window.BD_openTitleOptions()">⚙️ 설정</button>'
    + ((window.BD && (BD.questIdx||0)===0) ? '' : '<button class="bd-pause-btn" onclick="window.BD_rescue&&window.BD_rescue()">⛑️ 구조 요청 (시작 지점으로)</button>') /* (v367b) 프롤로그(월드 진출 전)에는 구조 요청 숨김 — 생성 시점 차단 */
    + '<button class="bd-pause-btn danger" onclick="window.BD_pauseToTitle()">🏠 타이틀로</button>'
    + '</div></div>';
  modal.classList.add('show');
}
function closePause(){
  _bdPaused = false;
  try { const m = document.getElementById('bd-pause-modal'); if(m) m.classList.remove('show'); } catch(e){}
  // 게임 루프 재개
  try {
    if(typeof gameLoop === 'function') gameLoop();
    else if(typeof window.gameLoop === 'function') window.gameLoop();
  } catch(e){}
}
window.BD_resumeGame = function(){ closePause(); };
window.BD_pauseSave = function(){
  try { bdSave(); } catch(e){}
  try {
    // 슬롯 저장 UI도 열어서 원하는 슬롯에 저장 가능하게
    bdToast('현재 진행을 저장했어요');
    openSlotUI('save');
  } catch(e){}
};
window.BD_pauseToTitle = function(){
  try { bdSave(); } catch(e){}
  _bdPaused = false;
  try { const m = document.getElementById('bd-pause-modal'); if(m) m.classList.remove('show'); } catch(e){}
  try {
    if(typeof exitGame === 'function') exitGame();
    var gs = document.getElementById('game-screen'); if(gs) gs.style.display='none';
  } catch(e){}
  try {
    window.__bdTitleShown = false;
    if(typeof window.BD_showTitle === 'function') window.BD_showTitle({onStart:function(){},onContinue:function(){}});
  } catch(e){}
};
window.BD_togglePause = function(){ if(_bdPaused) closePause(); else openPause(); };
// ESC 리스너 (캡처 단계에서 봉담 일시정지 우선 처리)
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  // (v239) 안전 수첩이 열려 있으면 수첩부터 닫는다 (일시정지보다 우선)
  try {
    const cx = document.getElementById('bd-codex-ov');
    if (cx && cx.classList.contains('show')) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (window.BD_codexClose) BD_codexClose();
      return;
    }
  } catch(e2){}
  // 전투/대화/모달 중엔 각자 처리하므로 제외
  try { if(window.HSR && HSR.active) return; } catch(e2){}
  // 타이틀 화면이면 무시
  try { const t=document.getElementById('bd-title-screen'); if(t && getComputedStyle(t).display!=='none') return; } catch(e2){}
  // 다른 봉담 모달이 열려있으면 그것부터 닫기
  try {
    const open = document.querySelector('.bd-modal.show');
    if(open && open.id !== 'bd-pause-modal'){ open.classList.remove('show'); e.preventDefault(); e.stopPropagation(); return; }
  } catch(e2){}
  if(isInGame()){
    e.preventDefault(); e.stopPropagation();
    window.BD_togglePause();
  }
}, true);

// J키 — 퀘스트 로그 열기/닫기
document.addEventListener('keydown', function(e){
  const k = (e.key||'').toLowerCase();
  if(k !== 'j') return;
  // 전투/대화/컷신/타이틀 중엔 무시
  try { if(window.HSR && HSR.active) return; } catch(e2){}
  try { if(window.__bdSceneActive) return; } catch(e2){}
  try { const t=document.getElementById('bd-title-screen'); if(t && getComputedStyle(t).display!=='none') return; } catch(e2){}
  // 입력창에 포커스가 있으면 무시 (에디터 등)
  try { const ae=document.activeElement; if(ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable)) return; } catch(e2){}
  // 퀘스트 로그 외의 다른 봉담 모달이 열려있으면 무시
  try {
    const open = document.querySelector('.bd-modal.show');
    if(open && open.id !== 'bd-questlog-modal') return;
  } catch(e2){}
  if(isInGame()){
    e.preventDefault(); e.stopPropagation();
    window.BD_toggleQuestLog();
  }
}, true);

// 길안내 토글 — (v235) 없어진 #bd-guide-btn 대신 설정 모달의 토글 버튼을 갱신한다.
window.BD_toggleGuideBtn = function(){
  const on = (typeof window.BD_toggleQuestGuide==='function') ? window.BD_toggleQuestGuide() : true;
  try{
    const modal = document.getElementById('bd-settings-modal');
    if(modal && modal.classList.contains('show')){
      const btns = modal.querySelectorAll('.bd-set-toggle');
      if(btns[1]){ btns[1].textContent = on ? '켜짐' : '꺼짐'; btns[1].classList.toggle('on', on); }
    }
  }catch(e){}
  return on;
};

function bdInit(){
  bdLoad();
  // 옛 에디터 저장 데이터에 남은 _purified 플래그는 정식 저장값(BD.purified)과 분리한다.
  try { if(typeof window.BD_resetHazardRuntimeState === 'function') window.BD_resetHazardRuntimeState(); } catch(e){}
  window.__bdLoaded = true;   // (v124) 로드 완료 표시 — 이 전에는 어떤 훅도 bdSave 금지
  // (v131) 저장된 소리 설정을 HUD 버튼에 반영
  try {
    if (window.BDSound) {
      const _son = BDSound.isEnabled();
      const _sbtn = document.getElementById('bd-sound-btn');
      if (_sbtn) { _sbtn.textContent = _son ? '🔊 소리 ON' : '🔇 소리 OFF'; _sbtn.style.opacity = _son ? '1' : '0.5'; }
    }
  } catch(e){}
  // 장비 보너스 포함 스탯 재계산
  if(typeof recalcStats==='function') recalcStats();
  // hp/mp 정합성
  if(BD.hp>BD.maxHp) BD.hp=BD.maxHp;
  if(BD.mp>BD.maxMp) BD.mp=BD.maxMp;
  if(typeof window.BD_syncHP === 'function') window.BD_syncHP(BD.hp, false);
  renderQuestHud();
  // 게임 시작 시 타이틀 화면 표시 (에디터 모드가 아니고, 아직 안 띄웠을 때)
  try {
    var editorOn = (function(){ try { var t=document.getElementById('bge-toggle'); return t && /ON|켜짐/i.test(t.textContent||''); } catch(e){ return false; } })();
    if(!editorOn && !window.__bdTitleShown){
      window.__bdTitleShown = true;
      setTimeout(function(){
        showTitle({
          onStart: function(){ /* 새 게임: 프롤로그는 showTitle 내부에서 재생 */ },
          onContinue: function(){ bdToast('이어서 진행합니다'); }
        });
      }, 600);
    }
  } catch(e){}
}
window.BD_init = bdInit;

// DOM 준비 후 초기화
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', bdInit);
} else { bdInit(); }

// (v238) 테스트·디버그 훅
window.__bdBD = { onHazardBattleEnd: onHazardBattleEnd, startHazardBattle, currentEnemyFamily, multiplier, useSkill };

})();
