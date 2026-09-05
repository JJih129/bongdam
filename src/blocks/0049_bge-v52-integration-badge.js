
(function(){
'use strict';
if (window.BongdamEditorV52IntegrationBadgeLoaded) return;
window.BongdamEditorV52IntegrationBadgeLoaded = true;

function show(msg){
  try {
    if (typeof window.toast === 'function') window.toast(msg);
    else console.log(msg);
  } catch(e) { console.log(msg); }
}

function ensureBadge(){
  var toggle = document.getElementById('bge-toggle');
  if (toggle && !toggle.dataset.v52) {
    toggle.dataset.v52 = '1';
    toggle.title = 'Ctrl+E: 제작 모드 / Ctrl+Q: 제작 모드 끄기 / F1: 제작 UI 숨김';
  }

  var dock = document.getElementById('bge-v49-dock');
  if (dock) {
    var title = dock.querySelector('h3');
    if (title && !title.dataset.v52) {
      title.dataset.v52 = '1';
      title.textContent = '전체 오브젝트 목록 v5.2';
    }
  }
}

function init(){
  ensureBadge();
  setInterval(ensureBadge, 1000);
  show('v5.2 퀘스트 진행 버전 기준 에디터 통합 완료');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
