
(function(){
'use strict';

if (window.BongdamEditorV51CtrlQLoaded) return;
window.BongdamEditorV51CtrlQLoaded = true;

function toast51(message){
  try {
    if (typeof window.toast === 'function') window.toast(message);
    else console.log(message);
  } catch (error) {
    console.log(message);
  }
}

function isEditorOn(){
  try {
    if (window.BongdamEditor && window.BongdamEditor.state) {
      return !!window.BongdamEditor.state.enabled;
    }
  } catch (error) {}
  return false;
}

function disableEditor(){
  try {
    if (window.BongdamEditor && typeof window.BongdamEditor.disable === 'function') {
      window.BongdamEditor.disable();
      toast51('제작 모드를 껐습니다. 다시 켜려면 Ctrl+E를 누르세요.');
      return;
    }
  } catch (error) {}

  try {
    if (typeof window.setEditorEnabled === 'function') {
      window.setEditorEnabled(false);
      toast51('제작 모드를 껐습니다. 다시 켜려면 Ctrl+E를 누르세요.');
      return;
    }
  } catch (error) {}

  const toggle = document.getElementById('bge-toggle') || document.getElementById('editor-toggle');
  if (toggle && isEditorOn()) {
    toggle.click();
    toast51('제작 모드를 껐습니다. 다시 켜려면 Ctrl+E를 누르세요.');
    return;
  }

  toast51('제작 모드 끄기 요청을 받았습니다.');
}

document.addEventListener('keydown', function(event){
  const key = String(event.key || '').toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === 'q') {
    event.preventDefault();
    event.stopImmediatePropagation();
    disableEditor();
  }
}, true);

toast51('v5.1 Ctrl+Q 제작 모드 끄기 단축키 준비 완료');
})();
