/* bd-tuto-battle-yield-v399 — 필드 전용 튜토(가게·지도)가 도는 중에 전투가 시작되면, 전투 동안은 튜토를 «접어 둔다».
 *
 * 재현(완주 런 v399c): 가게 튜토(shop_tuto, 「물건 구경하기」 단계) 중 위험요소 조사로 전투 진입 →
 *   ① 0089 BD_TUTOR_keyBlocked 가 «현재 스텝에 허용 키가 없다»고 Q/E/I/ESC 를 전부 삼킴
 *   ② 스포트라이트 차단막(#bd-spot-block, z 99990)이 전투 버튼을 덮음
 *   ③ 0161 의 30초 안전망은 «같은 안내가 30초»일 때만 발동하는데 담이 전투 한마디가 끼어들어 텍스트가 바뀌니 영영 안 걸림
 *   → 2분 타임아웃 ×N. 가게 튜토는 시작 즉시 완료 마킹이라 끊으면 다시 뜨지 않으므로 «끊기»가 아니라 «접기»가 맞다.
 *
 * 동작: 전투 중이고 실행 중인 튜토 태그가 전투 스텝을 갖지 않는 것(shop_tuto·map_tuto·태그 없음)이면
 *   · BD_TUTOR_keyBlocked → false (전투 키 통과)
 *   · #bd-spot-block · #bd-spot 을 걷고 html.bd-tuto-yield 로 튜토 말풍선을 숨김
 *   전투가 끝나면 클래스만 내린다 — 튜토 자체는 살아 있어 다음 스텝 조건(가게 앞 F 등)으로 이어진다.
 */
(function () {
  'use strict';
  if (window.__bdTutoYield399) return;
  window.__bdTutoYield399 = 1;

  var BATTLE_TAGS = { dami_main: 1, battle: 1 };   /* 전투 스텝을 갖는 실행 — 손대지 않는다 */
  function inBattle() { return !!(window.HSR && HSR.active); }
  function fieldTuto() {
    try {
      if (!window.BD_TUTOR || !BD_TUTOR.isRunning || !BD_TUTOR.isRunning()) return false;
      var tag = BD_TUTOR.runningTag ? BD_TUTOR.runningTag() : null;
      if (tag && BATTLE_TAGS[tag]) return false;
      /* 태그가 없어도 전투 스텝(ring/judge/flee…)이 하나라도 있으면 전투 튜토로 본다 */
      if (BD_TUTOR.hasStep && (BD_TUTOR.hasStep('ring') || BD_TUTOR.hasStep('judge') || BD_TUTOR.hasStep('flee') || BD_TUTOR.hasStep('bars'))) return false;
      return true;
    } catch (e) { return false; }
  }
  function yielding() { return inBattle() && fieldTuto(); }

  var st = document.createElement('style');
  st.textContent = 'html.bd-tuto-yield #bd-spot,html.bd-tuto-yield #bd-spot-block{display:none!important}' +
    'html.bd-tuto-yield #bd-tutorial{display:none!important}';
  (document.head || document.documentElement).appendChild(st);

  /* 키 차단 우회 — 0051 이 부르는 BD_TUTOR_keyBlocked 를 감싼다 */
  var wired = false;
  function wire() {
    if (wired || typeof window.BD_TUTOR_keyBlocked !== 'function') return;
    wired = true;
    var orig = window.BD_TUTOR_keyBlocked;
    window.BD_TUTOR_keyBlocked = function (e) { if (yielding()) return false; return orig.apply(this, arguments); };
    window.BD_TUTOR_keyBlocked.__yield399 = true;
  }
  function tick() {
    wire();
    var y = yielding();
    document.documentElement.classList.toggle('bd-tuto-yield', y);
    if (y) { try { var b = document.getElementById('bd-spot-block'); if (b) b.remove(); } catch (e) {} }
  }
  if (window.BD_addTick) BD_addTick(tick, 250); else setInterval(tick, 250);
  window.BD_TUTO_YIELD = { yielding: yielding, fieldTuto: fieldTuto };
})();
