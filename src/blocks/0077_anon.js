
/* (v233) JRPG 선택창 터치 지원 — 행을 탭하면 그 항목으로 선택·확정 */
(function(){
  function handler(e){
    var row = e.target && e.target.closest ? e.target.closest('.bd-choice-row') : null;
    if (!row) return;
    var box = document.getElementById('bd-choice');
    if (!box || getComputedStyle(box).display === 'none') return;
    e.preventDefault(); e.stopPropagation();
    var rows = Array.prototype.slice.call(box.querySelectorAll('.bd-choice-row'));
    var want = rows.indexOf(row);
    var cur = rows.findIndex(function(r){ return r.querySelector('.bd-choice-cursor'); });
    if (cur < 0) cur = 0;
    function key(k){ document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); }
    var diff = want - cur;
    for (var i = 0; i < Math.abs(diff); i++) key(diff > 0 ? 'ArrowDown' : 'ArrowUp');
    setTimeout(function(){ key('Enter'); }, 80);
  }
  document.addEventListener('click', handler, true);
  document.addEventListener('touchstart', handler, { capture: true, passive: false });
})();
