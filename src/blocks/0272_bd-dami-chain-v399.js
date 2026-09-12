/* bd-dami-chain-v399 — BD_DAMI.show 바깥 래퍼 3겹을 «정해진 순서»로 한 번에 설치한다.
 *
 * 담이 발화의 소유자는 0238 조정자(v374)다 — 채널 우선순위·큐·유효기간을 거기서 정한다.
 * 그 위에 세 레이어가 각자 프로브로 덧씌워지고 있었다:
 *   0152(v129) 말 시작 효과음 — 200ms 프로브 · 0155(v137) 잠든 담이 깨우고 재시도 — 200ms 프로브 ·
 *   0191(v322) 같은 문장 8초 내 중복 억제 — 800ms 프로브.
 * 조정자는 파싱 시점에 설치되므로 실제 체인은 (바깥 → 안)
 *   0191 중복 억제 → 0155 각성 재시도 → 0152 효과음 → 0238 조정자 → 0089 BD_DAMI.show 원본
 * 이었고, 부팅 뒤 0.2~0.8초 동안은 바깥 셋이 없는 상태로 돌았다.
 * 이 블록은 같은 순서를 조정자 직후에 즉시 설치한다. 동작은 같다. (효과음이 «큐에 넣기만 한» 호출에도
 * 나는 종전 성질도 그대로다 — 고치려면 조정자 안쪽으로 옮겨야 하며 별도 결정 사항.)
 *
 * 의존: 0152 가 window.__bdSFX, 0155 가 window.__bdDamiWake 를 노출한다.
 */
(function(){
  'use strict';
  var installed = false;
  function install(){
    if (installed || !window.BD_DAMI || !BD_DAMI.show) return false;
    installed = true;
    var orig = BD_DAMI.show.bind(BD_DAMI);          /* = 0238 조정자 (없으면 원본) */
    var lastSfxAt = 0;

    function withSfx(text, opts){                                                       /* v129 */
      try{
        var now = Date.now();
        if (now - lastSfxAt > 900 && window.__bdSFX && typeof __bdSFX.damiTalk === 'function'){ __bdSFX.damiTalk(); lastSfxAt = now; }
      }catch(e){}
      return orig(text, opts);
    }
    function withWake(text, opts){                                                      /* v137 */
      var r = withSfx(text, opts);
      try{
        var inGame = !(BD_DAMI.isGameplayVisible && !BD_DAMI.isGameplayVisible());
        if (r === false && inGame && !(opts && opts.once) && typeof window.__bdDamiWake === 'function'){
          window.__bdDamiWake();
          return withSfx(text, opts);
        }
      }catch(e){}
      return r;
    }
    BD_DAMI.show = function(text, opts){                                                /* v322 — 가장 바깥 */
      try{
        if (!window.__bdDamiDedupeBusy){
          var t = String(text || '');
          if (t && window.__bdDamiLastText === t && Date.now() - (window.__bdDamiLastAt || 0) < 8000) return false;
          window.__bdDamiLastText = t; window.__bdDamiLastAt = Date.now();
        }
      }catch(e){}
      window.__bdDamiDedupeBusy = true;
      try { return withWake(text, opts); } finally { window.__bdDamiDedupeBusy = false; }
    };
    BD_DAMI.show.__v399chain = true;
    window.__bdDamiDedupeOn = true;
    return true;
  }
  if (!install()){ var iv = setInterval(function(){ if (install()) clearInterval(iv); }, 200); }
})();
