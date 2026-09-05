
/* (v285) 한글 조사 헬퍼 — '{n}가' 형태의 템플릿을 이름 받침에 맞춰 치환 */
(function(){
  'use strict';
  function hasJong(w){
    try{
      var t = String(w||'').trim(); if (!t) return false;
      var c = t.charCodeAt(t.length-1);
      if (isNaN(c) || c < 0xAC00 || c > 0xD7A3) return false;
      return ((c - 0xAC00) % 28) !== 0;
    }catch(e){ return false; }
  }
  window.BD_josaN = function(text, name){
    var j = hasJong(name);
    return String(text||'')
      .split('{n}가').join(name + (j ? '이' : '가'))
      .split('{n}는').join(name + (j ? '은' : '는'))
      .split('{n}를').join(name + (j ? '을' : '를'))
      .split('{n}와').join(name + (j ? '과' : '와'))
      .split('{n}').join(name);
  };
})();
