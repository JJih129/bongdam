
/* (v202) 맵 충돌 전면 해제 스위치 — 새 맵 에셋 적용 후 콜라이더를 다시 잡을 때 true 로 */
window.BD_MAP_COLLISION = false;
/* (v203) 현재 스테이지 시야 배율 실시간 조정: Ctrl+Shift+] 넓게 / Ctrl+Shift+[ 좁게 */
window.addEventListener('keydown', function(e){   // (v204) Alt+[ / Alt+] — Ctrl 조합은 게임이 선점
  if (!e.altKey || e.ctrlKey) return;
  if (['[',']'].indexOf(e.key) < 0) return;
  if (!window.BD_DEV_MODE) return;                         // (v210) 게시 모드에선 비활성
  e.preventDefault(); e.stopPropagation();
  window.BD_setViewScale(currentStage, (window.BD_VIEW_SCALE[currentStage] || 1) + (e.key === ']' ? 0.02 : -0.02));
}, true);
/* 콘솔에서도 조정 가능: BD_setViewScale(1, 1.9) / 현재값 보기: BD_VIEW_SCALE */
window.BD_setViewScale = function(stage, val){
  const v = Math.max(0.6, Math.min(3, Math.round(val * 100) / 100));
  window.BD_VIEW_SCALE[stage] = v;
  try{ if (typeof bdToast === 'function')
    bdToast('\uC2DC\uC57C \uBC30\uC728 (\uC2A4\uD14C\uC774\uC9C0 ' + stage + ') \u2192 ' + v.toFixed(2)); }catch(err){}
  return v;
};
document.addEventListener('keydown', function(e){
  if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')){
    if (!window.BD_DEV_MODE) return;                       // (v210) 게시 모드에선 비활성
    e.preventDefault(); e.stopPropagation();
    window.BD_MAP_COLLISION = !window.BD_MAP_COLLISION;
    try{ if (typeof bdToast === 'function')
      bdToast(window.BD_MAP_COLLISION ? '\uCDA9\uB3CC ON (\uD30C\uB780 \uC0C1\uC790 \uD45C\uC2DC)' : '\uCDA9\uB3CC OFF'); }catch(err){}
  }
}, true);
