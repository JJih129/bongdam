
/* (v233) F 메인 버튼 상황 인지 — 대화 중 '다음', 근처 위험요소 펄스 */
(function(){
  window.BD_addTick(function(){
    try{
      var btnF = document.getElementById('tc-btn-f');
      var tc = document.getElementById('touch-controls');
      if (!btnF || !tc || tc.style.display === 'none') return;
      var icon = document.getElementById('tc-f-icon');
      var label = document.getElementById('tc-f-label');
      var vn = document.getElementById('dialogue-box');
      var talking = (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05);
      if (talking){
        if (icon) icon.textContent = '\u25B6';
        if (label) label.textContent = '\uB2E4\uC74C';
        btnF.classList.add('tc-pulse');
        return;
      }
      if (icon) icon.textContent = '\uD83D\uDD0D';
      if (label) label.textContent = '\uC870\uC0AC';
      var near = false;
      try{
        var st = STAGES[currentStage];
        if (st && st.objects) near = st.objects.some(function(o){
          if (!o || o.interactable !== 'hazard' || !o.hazardId) return false;
          if ((window.BD && BD.purified && BD.purified[o.hazardId]) || o._purified) return false;
          if (window.BD_hazardLocked && BD_hazardLocked(o)) return false;
          var cx = o.rx + (o.rw||0.08)/2, cy = o.ry + (o.rh||0.08)/2;
          return Math.hypot(cx - heroX, cy - heroY) < 0.13;
        });
      }catch(e){}
      btnF.classList.toggle('tc-pulse', near);
    }catch(e){}
  }, 350);
})();
