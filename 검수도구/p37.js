module.exports = [
  {
    name: 'v147-52 부탁이 필요한 위험요소가 옆 주민의 F를 가로채던 문제',
    from: `          else if (o.resident && !o._hyunji) candRect('resident', o, 0.075);
          else if (o.interactable === 'hazard' && o.hazardId &&
                   /* (v147) 이미 정화돼 «사라진» 위험요소가 F를 계속 가로채,
                      바로 옆에 선 주민에게 보고를 할 수 없어 장이 끝나지 않던 문제.
                      (동화리 낙서 ↔ 재현처럼, 부탁한 주민은 그 위험요소 옆에 서 있다) */
                   !o.__bdGone && !o._purified &&
                   !(typeof window.BD_isPurified === 'function' && window.BD_isPurified(o.hazardId || o.id || o.label)) &&
                   !(typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o))) cand('hazard', cx, cy, 0.10);`,
    to: `          else if (o.resident && !o._hyunji) candRect('resident', o, 0.075);
          else if (o.interactable === 'hazard' && o.hazardId &&
                   /* (v147) 이미 정화돼 «사라진» 위험요소가 F를 계속 가로채,
                      바로 옆에 선 주민에게 보고를 할 수 없어 장이 끝나지 않던 문제.
                      (동화리 낙서 ↔ 재현처럼, 부탁한 주민은 그 위험요소 옆에 서 있다) */
                   !o.__bdGone && !o._purified &&
                   !(typeof window.BD_isPurified === 'function' && window.BD_isPurified(o.hazardId || o.id || o.label)) &&
                   !(typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o))){
            /* (v147-52) 아직 부탁을 못 받은(잠긴) 위험요소는 F를 눌러 봐야
               «주민 이야기를 먼저 들어보자» 독백만 나온다.
               그런데 부탁을 줄 주민이 바로 그 옆에 서 있어서(설계),
               잠긴 위험요소가 주민보다 가까우면 그 독백만 무한 반복됐다.
               → 잠긴 위험요소는 판정 거리를 뒤로 물려 옆 주민이 이기게 한다. */
            var __gated = false;
            try{ __gated = (window.BD_hzQuestGate && BD_hzQuestGate(o)) === true; }catch(eGt){}
            if (__gated){
              var __d2 = Math.hypot(heroX - cx, heroY - cy);
              if (__d2 <= 0.10 && (!best || __d2 + 0.05 < best.d)) best = { kind: 'hazard', d: __d2 + 0.05 };
            } else {
              cand('hazard', cx, cy, 0.10);
            }
          }`,
  },
];
