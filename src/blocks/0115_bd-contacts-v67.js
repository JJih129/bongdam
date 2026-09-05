
/* (v67) 시나리오 정합 — '배지 통신(문자)'의 전제 만들기
   · 동료(세아·재이·재현)와 처음 대화하면 그 자리에서 연락처를 교환한다
   · 연락처가 없는 사람에게서는 문자가 오지 않는다 (도착 예정이면 교환 시점까지 보류)
     → "만난 적 없는 사람이 문자를 보내던" 위화감 제거 */
(function(){
  'use strict';
  var KEY = 'bd_contacts_v67';
  var FRIENDS = ['세아','재이','재현'];

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
  function save(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  window.BD_hasContact = function(name){ return get().indexOf(String(name||'').trim()) >= 0; };
  window.BD_addContact = function(name){
    name = String(name||'').trim(); if (!name) return false;
    var a = get(); if (a.indexOf(name) >= 0) return false;
    a.push(name); save(a);
    // (v107) 한글 조사 자동 선택 — "세아와(과)" 표기 제거
    try{
      var __c = String(name).trim().charCodeAt(String(name).trim().length-1);
      var __jong = (!isNaN(__c) && __c >= 0xAC00 && __c <= 0xD7A3) ? ((__c - 0xAC00) % 28) !== 0 : false;
      bdToast('📱 ' + name + (__jong ? '과' : '와') + ' 연락처를 교환했다');
    }catch(e){}
    flush();
    return true;
  };

  /* 대화 감지 — 동료와 첫 대화 시 연락처 교환 */
  var last = null;
  setInterval(function(){
    try{
      var box = document.getElementById('dialogue-box');
      var nm = document.getElementById('dialogue-name');
      if (!(box && box.offsetHeight && nm)){ last = null; return; }
      var who = String(nm.textContent||'').trim();
      if (!who || who === last) return;
      last = who;
      if (FRIENDS.indexOf(who) >= 0 && !window.BD_hasContact(who)){
        // (v68) 교환 순간을 대사로 보여준다 — 토스트만 뜨면 "언제 번호를 줬지?" 싶으므로
        (function(nm){
          setTimeout(function(){
            if (window.BD_hasContact(nm)) return;
            var line = ({
              '세아': ['아 맞다, 번호! 소식 생기면 바로 문자 보낼게.'],
              '재이': ['…연락처. 사건 진전 있으면 알려주지.'],
              '재현': ['번호 하나 줄게. 급하면 연락해. 걱정하는 건 아니고.']
            })[nm] || [nm + '의 연락처를 받았다.'];
            try{
              var busy = document.getElementById('dialogue-box');
              // 대화가 아직 진행 중이면 대사는 겹치지 않게 생략하고 교환만 처리한다
              if (!(busy && busy.offsetHeight) && typeof showDialog === 'function') showDialog(nm, line);
            }catch(e){}
            window.BD_addContact(nm);
          }, 1500);
        })(who);
      }
    }catch(e){}
  }, 500);

  /* 문자 게이트 — 연락처 없는 발신자의 문자는 보류했다가 교환 후 전달 */
  var pending = [];
  function flush(){
    if (!pending.length || !window.__bdMsgOrigShow) return;
    var rest = [];
    pending.forEach(function(m){
      if (window.BD_hasContact(m.from)) window.__bdMsgOrigShow.call(window.BD_Message, m);
      else rest.push(m);
    });
    pending = rest;
  }
  /* (v67) 폴백 — 아직 만나지 못한 동료의 소식은 12초 뒤 담이가 대신 전해 준다.
     (연락처가 없다고 다음 지역 안내를 아예 못 받으면 진행이 막히므로) */
  setInterval(function(){
    if (!pending.length) return;
    var now = Date.now();
    var rest = [];
    pending.forEach(function(m){
      if (!m.__t) m.__t = now;
      if (window.BD_hasContact(m.from)){ window.__bdMsgOrigShow.call(window.BD_Message, m); return; }
      if (now - m.__t > 7000){
        try{
          if (window.BD_DAMI) BD_DAMI.show(m.from + '한테서 소식이 왔어요 — "' + String(m.text||'').slice(0, 70) + '"', { face:'base' });
          else if (window.bdToast) bdToast('📨 ' + m.from + '의 소식이 도착했어요');
        }catch(e){}
        return;   // 전달 완료
      }
      rest.push(m);
    });
    pending = rest;
  }, 2000);
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    if (window.BD_Message && typeof BD_Message.show === 'function' && !BD_Message.__v67){
      window.__bdMsgOrigShow = BD_Message.show;
      BD_Message.show = function(m){
        try{
          if (m && m.from && FRIENDS.indexOf(String(m.from).trim()) >= 0 && !window.BD_hasContact(m.from)){
            pending.push(m);   // 아직 번호를 모르는 사람 — 만나서 교환하면 그때 도착
            return;
          }
        }catch(e){}
        return window.__bdMsgOrigShow.apply(this, arguments);
      };
      BD_Message.__v67 = true;
      clearInterval(boot);
    }
    if (tries > 400) clearInterval(boot);
  }, 250);
})();
