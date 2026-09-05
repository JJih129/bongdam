// 봉담지킴이 오토파일럿 v2 — 실제 플레이어처럼 목표를 따라가며 진행 막힘을 찾는다
module.exports = (h, L) => {
  const { say } = h;
  const P = require('./path')(h);
  const A = {};
  A.P = P;
  A.script = [];
  const seen = new Set();

  A.probe = async () => await h.page.evaluate(() => {
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
    const g = id => { const e = document.getElementById(id); return on(e) ? (e.textContent || '').replace(/\s+/g, ' ').trim() : null; };
    const nav = window.__bdNavOverride;
    let guide = null; try { guide = window.BD_currentGuide && window.BD_currentGuide(); } catch (e) { }
    return {
      hero: (() => { try { return [heroX, heroY]; } catch (e) { return [0, 0]; } })(),
      stage: (() => { try { return Number(currentStage); } catch (e) { return null; } })(),
      stageName: (() => { try { return STAGES[currentStage].name; } catch (e) { return null; } })(),
      quest: (() => { try { const Q = window.QUESTS || window.BD_QUESTS; const q = Q[BD.questIdx]; return { id: q.id, t: q.title, cur: q.objectives[0].cur, need: q.objectives[0].need }; } catch (e) { return null; } })(),
      tgt: nav ? { rx: nav.rx, ry: nav.ry, rw: nav.rw || 0.05, rh: nav.rh || 0.075, label: nav.label || nav._guideLabel || '?', rest: !!nav.__rest } : (guide ? { rx: guide.t.rx, ry: guide.t.ry, rw: guide.t.rw || 0.05, rh: guide.t.rh || 0.075, label: guide.label } : null),
      qtgt: guide ? { rx: guide.t.rx, ry: guide.t.ry, rw: guide.t.rw || 0.05, rh: guide.t.rh || 0.075, label: guide.label } : null,
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      scene: !!window.__bdSceneActive,
      hsr: !!(window.HSR && HSR.active),
      spk: g('dialogue-name'), txt: g('dialogue-text') || g('dialogue-box'),
      dami: g('bd-dami-hud'),
      bdDlg: g('bd-dialog'),
      choice: (() => { const c = document.getElementById('bd-choice'); if (!on(c)) return null; return [...c.querySelectorAll('[id^="bd-ch-"]')].map(e => e.textContent.replace(/\s+/g, ' ').trim()); })(),
      placeCard: on(document.getElementById('bd-place-card')),
      badge: on(document.getElementById('bd-badge-ov')),
      aug: on(document.getElementById('bd-aug-overlay')),
      modal: (() => { const m = [...document.querySelectorAll('.bd-modal.show')].find(on); return m ? m.id : null; })(),
      panel: (() => {
        const ids = ['bd-district-facility-modal', 'inv-overlay', 'shop-overlay', 'quest-overlay', 'notebook-overlay', 'place-overlay', 'safety-map-overlay', 'equip-overlay', 'bag-overlay', 'bd-inventory', 'bd-bus-modal'];
        const m = ids.map(i => document.getElementById(i)).find(e => on(e) && (e.classList.contains('open') || e.classList.contains('show') || getComputedStyle(e).display !== 'none'));
        return m ? m.id : null;
      })(),
      toast: g('bge-toast'),
      hp: (() => { try { return heroHP; } catch (e) { return null; } })(),
      purified: (() => { try { return Object.keys(BD.purified || {}); } catch (e) { return []; } })(),
    };
  });

  A.note = (p, tag) => {
    const rec = [
      p.spk && p.txt ? `[${p.spk}] ${p.txt}` : (p.txt ? `[-] ${p.txt}` : null),
      p.dami ? `[담이] ${p.dami}` : null,
      p.bdDlg ? `[창] ${p.bdDlg}` : null,
      p.choice ? `⟨선택⟩ ${p.choice.join(' / ')}` : null,
    ].filter(Boolean);
    for (const r of rec) {
      if (seen.has(r)) continue;
      seen.add(r);
      A.script.push({ stage: p.stage, t: r });
      say(`    💬 ${r.slice(0, 130)}`);
    }
  };

  A.battleInfo = async () => await h.page.evaluate(() => {
    if (!(window.HSR && HSR.active)) return null;
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none') return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
    return {
      state: HSR.state, ehp: HSR.enemy && HSR.enemy.hp, emax: HSR.enemy && HSR.enemy.maxhp,
      ename: HSR.enemy && HSR.enemy.name, hhp: HSR.hero && HSR.hero.hp,
      acts: [...document.querySelectorAll('.hsr-act')].filter(on).map(b => ({ t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18), dis: b.disabled || b.classList.contains('disabled') || b.classList.contains('hsr-lock') })),
      aug: on(document.getElementById('bd-aug-overlay')),
      mg: ['bd-mg', 'bd-mg-ddr', 'bd-mg-light', 'bd-mg-ring', 'bd-mg-mash'].filter(id => on(document.getElementById(id))),
      dlg: (() => { const e = document.getElementById('dialogue-box'); return on(e) ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : null; })(),
    };
  });

  A.doBattle = async (maxSec = 120) => {
    const t0 = Date.now(); let n = 0, lastEhp = null, sameHp = 0;
    say('    ⚔ 전투 시작');
    while (Date.now() - t0 < maxSec * 1000) {
      const b = await A.battleInfo();
      if (!b) { say('    ⚔ 전투 종료 (' + ((Date.now() - t0) / 1000).toFixed(0) + 's)'); return true; }
      const p = await A.probe(); A.note(p);
      if (b.aug) {
        const c = await h.page.evaluate(() => {
          const ov = document.getElementById('bd-aug-overlay'); if (!ov) return null;
          const cards = [...ov.querySelectorAll('*')].filter(e => e.onclick || e.getAttribute('onclick'));
          if (!cards.length) return null; cards[0].click(); return (cards[0].textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        });
        say('    ⚔ 증강 선택 → ' + c);
        await h.wait(1100); continue;
      }
      if (b.mg.length) {
        // 타이밍 링은 «줄어드는 원이 기준 원과 겹치는 순간» 한 번만 눌러야 한다.
        // 연타하면 첫 입력이 곧바로 MISS로 확정돼 피해가 0이 된다.
        const kind = await h.page.evaluate(() => {
          const ring = document.getElementById('bd-mg-ring');
          if (ring) {
            if (ring.__bdWatch) return 'ring-watching';
            ring.__bdWatch = true;
            const shrink = ring.querySelector('.bd-mg-shrink');
            const host = ring.parentElement;
            (function w() {
              if (!document.body.contains(ring)) return;
              let sc = 99;
              try {
                const m = getComputedStyle(shrink).transform;
                if (m && m !== 'none') { const p = m.match(/matrix\(([^,]+)/); if (p) sc = Math.abs(parseFloat(p[1])); }
              } catch (e) { }
              if (sc <= 1.03) {
                try { host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } catch (e) { }
                return;
              }
              requestAnimationFrame(w);
            })();
            return 'ring';
          }
          if (document.getElementById('bd-mg-mash')) return 'mash';
          if (document.getElementById('bd-mg-ddr')) return 'ddr';
          if (document.getElementById('bd-mg-light')) return 'light';
          return 'unknown';
        });
        if (kind === 'ring' || kind === 'ring-watching') { await h.wait(1100); continue; }
        if (kind === 'mash') {
          for (let i = 0; i < 18; i++) { await h.page.keyboard.press('Space'); await h.wait(55); }
          await h.wait(500); continue;
        }
        for (let i = 0; i < 16; i++) {
          const x = 350 + (i % 6) * 110, y = 380 + (i % 4) * 70;
          await h.page.mouse.move(x, y); await h.page.mouse.click(x, y);
          await h.page.keyboard.press('Space'); await h.wait(110);
        }
        continue;
      }
      if (b.dlg) { await h.page.keyboard.press('Space'); await h.wait(350); continue; }
      if (b.state === 'player') {
        const clicked = await h.page.evaluate(() => {
          const on = e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && r.height > 2; };
          const list = [...document.querySelectorAll('.hsr-act')].filter(e => on(e) && !e.disabled && !e.classList.contains('disabled') && !e.classList.contains('hsr-lock'));
          if (!list.length) return null; list[0].click(); return (list[0].textContent || '').replace(/\s+/g, ' ').trim().slice(0, 16);
        });
        if (b.ehp === lastEhp) sameHp++; else { sameHp = 0; lastEhp = b.ehp; }
        if (n++ % 5 === 0) say(`    ⚔ ${b.ename} ${b.ehp}/${b.emax} 내HP=${b.hhp} → ${clicked} [${b.acts.map(a => a.t).join('|')}]`);
        if (sameHp > 25) { say('    ✖ 전투 교착 (적 HP 변화 없음)'); await h.shot('BLOCK_battle_stall'); return false; }
        await h.wait(650); continue;
      }
      await h.page.keyboard.press('Space'); await h.wait(400);
    }
    say('    ✖ 전투 타임아웃'); await h.shot('BLOCK_battle_timeout'); return false;
  };

  // 대화·연출을 안전하게 넘긴다 (텍스트가 멈춘 뒤에만 다음으로)
  A.advance = async (max = 90) => {
    for (let i = 0; i < max; i++) {
      const p = await A.probe();
      A.note(p);
      if (p.hsr) return 'battle';
      if (p.choice && p.choice.length) {
        const c = await h.page.evaluate(() => { const o = document.querySelector('[id^="bd-ch-"]'); if (!o) return null; o.click(); return (o.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26); });
        say('    ▸ 선택: ' + c); await h.wait(800); continue;
      }
      if (p.aug) { await h.page.evaluate(() => { const ov = document.getElementById('bd-aug-overlay'); const c = ov && [...ov.querySelectorAll('*')].filter(e => e.onclick || e.getAttribute('onclick'))[0]; if (c) c.click(); }); await h.wait(900); continue; }
      if (p.placeCard) { await h.page.keyboard.press('Space'); await h.wait(500); continue; }
      if (p.badge) { await h.page.keyboard.press('Space'); await h.wait(600); continue; }
      if (p.modal) {
        const c = await h.page.evaluate(() => {
          const m = document.querySelector('.bd-modal.show'); if (!m) return null;
          const b = [...m.querySelectorAll('button')].find(x => /닫기|확인|계속|시작|받기|나가기|✕/.test(x.textContent || ''));
          if (b) { b.click(); return (b.textContent || '').trim().slice(0, 12); } return 'no-btn:' + m.id;
        });
        say('    ▸ 모달 처리: ' + p.modal + ' → ' + c); await h.wait(700); continue;
      }
      if (p.panel) {
        // 시설 창 + 체력 낮음 → 실제 플레이어처럼 «잠시 쉬어 가기» (휴식 안내가 걷히지 않던 루프 방지)
        if (p.panel === 'bd-district-facility-modal' && (p.hp == null || p.hp < 75)) {
          const rested = await h.page.evaluate(() => {
            const m = document.getElementById('bd-district-facility-modal');
            if (!m) return false;
            const b = [...m.querySelectorAll('button')].find(x => /쉬어 가기/.test(x.textContent || ''));
            if (b) { b.click(); return true; } return false;
          });
          if (rested) { say('    ▸ 시설에서 휴식 (HP ' + p.hp + ')'); await h.wait(2800); return 'panel'; }
        }
        say('    ▸ 패널 닫기: ' + p.panel);
        await h.page.keyboard.press('Escape'); await h.wait(500);
        const still = await h.page.evaluate((id) => { const e = document.getElementById(id); if (!e) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && e.getBoundingClientRect().height > 2; }, p.panel);
        if (still) {
          const c = await h.page.evaluate((id) => {
            const e = document.getElementById(id); if (!e) return null;
            const b = [...e.querySelectorAll('button,div,span')].find(x => /닫기|나가기|✕|✖|X$/.test((x.textContent || '').trim()) && x.getBoundingClientRect().height > 2);
            if (b) { b.click(); return (b.textContent || '').trim().slice(0, 10); }
            e.classList.remove('open', 'show'); e.style.display = 'none'; return 'forced';
          }, p.panel);
          say('      · 닫기 버튼: ' + c);
        }
        await h.wait(400);
        return 'panel';
      }
      if (!p.blocked) return 'free';
      await h.page.keyboard.press('Space');
      await h.wait(340);
    }
    return 'stuck';
  };

  A.run = async (steps = 200, opts = {}) => {
    let lastStage = null, lastKey = '', same = 0, panelStreak = 0;
    for (let s = 0; s < steps; s++) {
      const r = await A.advance();
      if (r === 'battle') { await A.doBattle(); await h.wait(1500); continue; }
      const justClosedPanel = (r === 'panel');
      if (justClosedPanel) panelStreak++; else panelStreak = Math.max(0, panelStreak - 1);
      if (r === 'stuck') {
        const p = await A.probe();
        say(`  ⛔ STUCK step${s}: blocked=${p.blocked} scene=${p.scene} modal=${p.modal} placeCard=${p.placeCard} spk=${p.spk} txt=${(p.txt || '').slice(0, 60)}`);
        say('  BLOCKDETAIL ' + JSON.stringify(await L.blocked()));
        await h.shot('BLOCK_stuck_s' + s);
        return { ok: false, step: s, reason: 'input-blocked', probe: p };
      }
      const p = await A.probe();
      if (p.stage !== lastStage) {
        lastStage = p.stage;
        say(`  🗺  === 스테이지 ${p.stage} · ${p.stageName} ===`);
        await h.shot(`map_${p.stage}_s${s}`);
      }
      // (v331) 담이 각성 인트로·오프닝이 실재 재생됨(래퍼 폭풍 수복 후) —
      // 재생 중 목표 고정은 정체가 아니다. 스페이스로 진행 + 살짝 움직여 이동 튜토도 충족.
      const introBusy = await h.page.evaluate(() => !!(window.__bdDamiIntroBusy || window.__bdDamiOpeningBusy)).catch(() => false);
      if (introBusy) {
        same = 0;
        await h.page.keyboard.press(' ');
        await h.hold(['a', 'd', 'w', 's'][s % 4], 400);
        await h.wait(800);
        continue;
      }
      // 필드 튜토 «이동» 스텝 대기 중엔 실제로 움직여 스텝을 충족시킨다
      const tutMove = await h.page.evaluate(() => !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning() && /move/.test(String(window.__bdTutStepId || '')))).catch(() => false);
      if (tutMove) { await h.hold(['a', 'd', 'w', 's'][s % 4], 500); await h.wait(400); same = 0; }
      // 회복 안내에서 계속 헛돌면 임무 목표로 전환한다 (실제 플레이어도 그렇게 한다)
      let tgt = p.tgt;
      // 회복 안내는 건물 «안»을 가리켜 도달할 수 없다 — 검수에서는 임무 목표를 따른다
      if (tgt && tgt.rest && p.qtgt) tgt = p.qtgt;
      p.tgt = tgt;
      const key = p.tgt ? `${p.tgt.label}@${p.tgt.rx.toFixed(3)},${p.tgt.ry.toFixed(3)}` : 'none';
      if (key === lastKey) same++; else { same = 0; lastKey = key; }
      if (s % 4 === 0 || same === 0) say(`  · s${s} stg=${p.stage} (${p.hero[0].toFixed(3)},${p.hero[1].toFixed(3)}) hp=${p.hp} q=${p.quest ? p.quest.id + ' ' + p.quest.cur + '/' + p.quest.need : '-'} 정화=${p.purified.length} → ${key}`);

      if (!p.tgt) {
        say(`  ⚠ 목표 없음 (s${s})`);
        if (same === 0) await h.shot('NOGUIDE_s' + s);
        // F를 누르면 옆 주민과 대화가 반복돼 유휴 핀 생성(busyUI)이 계속 밀린다 —
        // 실제 플레이어처럼 잠깐 걸어 자리를 벗어나며 안내가 생기길 기다린다
        const dirs = ['a', 's', 'd', 'w'];
        await h.hold(dirs[s % 4], 700);
        await h.wait(1500);
        if (same > 9) { await h.shot('BLOCK_noguide_s' + s); return { ok: false, step: s, reason: 'no-guide', probe: p }; }
        continue;
      }

      // 목표 사각형의 «발밑 바로 아래» — 실제 상호작용이 성립하는 지점
      // 단, 도로 끝(지역 이동)·엘리베이터는 그 «안»으로 들어가야 발동한다
      const isPortal = /로 가기|나가기|엘리베이터|📍/.test(p.tgt.label || '');
      let aimX = p.tgt.rx + p.tgt.rw / 2;
      let aimY = isPortal ? (p.tgt.ry + p.tgt.rh / 2) : (p.tgt.ry + p.tgt.rh + 0.015);
      // (v368) 시설(랜드마크) 목표는 «지정 상호작용 지점»을 조준 — 폭 넓은 건물의 중앙 아래는 문이 아닐 수 있다
      try {
        const ip = await h.page.evaluate((lb) => {
          const L = (STAGES[currentStage].__v24Landmarks || []).find(x => x && String(x.label || '') === String(lb) && isFinite(Number(x.interactionX)));
          return L ? [Number(L.interactionX), Number(L.interactionY)] : null;
        }, p.tgt.label);
        if (ip) { aimX = ip[0]; aimY = ip[1]; }
      } catch (e) { }
      await P.install();
      if (process.env.BD_AUTO_DEBUG) { try { const pp = await P.probe(aimX, aimY); say(`    ↳ aim (${aimX.toFixed(3)},${aimY.toFixed(3)}) ${pp.ok ? 'ok' : pp.reason} end=${JSON.stringify(pp.end)} way=${JSON.stringify((pp.way || []).map(w => [+w[0].toFixed(2), +w[1].toFixed(2)]))}`); } catch (e) { say('    ↳ aim probe err ' + e.message); } }
      const mv = await P.walk(aimX, aimY, L);
      if (process.env.BD_AUTO_DEBUG) say(`    ↳ walk → ${JSON.stringify(mv)} hero=${JSON.stringify(await h.page.evaluate(() => [+heroX.toFixed(3), +heroY.toFixed(3), Number(currentStage)]))}`);
      if (!mv.ok) {
        if (same <= 1) { say(`  ⚠ 이동 실패 ${mv.reason} → ${key}`); await h.shot('WALL_s' + s); }
        if (mv.reason === 'no-path' || mv.reason === 'goal-unreachable-cell') {
          say(`  ⛔ 도달 불가! ${key} 로 가는 길이 없습니다 (${mv.reason})`);
          await h.shot('BLOCK_nopath_s' + s);
          if (same > 3) return { ok: false, step: s, reason: 'unreachable:' + key, probe: p };
        }
      }
      // 같은 자리에서 창만 계속 열리면 F를 잠시 쉰다 (상점 앞 무한 루프 방지)
      if (!justClosedPanel && panelStreak < 3) { await L.press('f', 2, 450); await h.wait(500); }
      else if (panelStreak >= 3) { say('    ↪ 창이 반복해서 열려 F를 잠시 멈춤'); await h.hold('s', 400); await h.hold('d', 400); }
      if (same === 7) {
        const diag = await h.page.evaluate(([ax, ay]) => {
          const out = { hero: [heroX, heroY], stage: currentStage };
          out.selfBlocked = _collidesAt(heroX, heroY);
          out.around = {};
          [['N', 0, -0.02], ['S', 0, 0.02], ['E', 0.02, 0], ['W', -0.02, 0]].forEach(([k, dx, dy]) => { out.around[k] = _collidesAt(heroX + dx, heroY + dy); });
          out.path = window.__bdPath ? window.__bdPath(ax, ay) : null;
          if (out.path) delete out.path.way;
          out.blockers = [];
          try {
            const st = STAGES[currentStage];
            (st.objects || []).forEach(o => {
              if (!o || o.hidden) return;
              const hasC = o.cx !== undefined && o.cw !== undefined;
              const L2 = hasC ? o.cx : o.rx, T = hasC ? o.cy : o.ry, W = hasC ? o.cw : o.rw, H = hasC ? o.ch : o.rh;
              if (L2 == null) return;
              if (heroX > L2 - 0.05 && heroX < L2 + W + 0.05 && heroY > T - 0.05 && heroY < T + H + 0.05)
                out.blockers.push({ l: o.label, t: o.type, hasC, r: [+L2.toFixed(3), +T.toFixed(3), +(W || 0).toFixed(3), +(H || 0).toFixed(3)], solid: o.solid, hz: o.hazardId });
            });
          } catch (e) { out.err = String(e); }
          out.dlg = (() => { const e = document.getElementById('dialogue-box'); return e ? getComputedStyle(e).display + '/' + e.getBoundingClientRect().height : '-'; })();
          out.inputBlocked = !!(window.BD_isInputBlocked && window.BD_isInputBlocked());
          out.moveKeys = (typeof moveKeys !== 'undefined') ? JSON.stringify(moveKeys) : '-';
          return out;
        }, [aimX, aimY]);
        say('  🔎 DIAG ' + JSON.stringify(diag));
      }
      // (v335→v336) 부탁 게이트에 막힌 정화 목표 — 같은 목표 8회면 이 지역 주민 «전원»을 돌며 부탁을 받는다
      if (same === 8 && /정화|위험/.test((p.tgt && p.tgt.label) || '')) {
        const residents = await h.page.evaluate(() => {
          const st = STAGES[currentStage];
          return (st.objects || []).filter(x => x && x.resident)
            .map(x => ({ x: x.rx + (x.rw || 0.04) / 2, y: x.ry + (x.rh || 0.06) + 0.012, d: Math.hypot(heroX - x.rx, heroY - x.ry) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 4);
        });
        if (residents.length) {
          say('  ↻ 부탁 게이트 우회 — 지역 주민 ' + residents.length + '명 방문');
          for (const rz of residents) {
            await h.page.evaluate((rr) => { heroX = rr.x; heroY = rr.y; camX = heroX; camY = heroY; }, rz);
            await h.wait(350);
            await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(450);
            for (let i2 = 0; i2 < 10; i2++) { await h.page.keyboard.press(' '); await h.wait(320); }
          }
        }
      }
      // (v337) 최후 폴백 — F 조준·게이트 꼬임과 무관하게 사람의 F와 같은 공식 경로를 직접 호출
      if (same === 12 && /정화|위험/.test((p.tgt && p.tgt.label) || '')) {
        say('  ↻ 직접 상호작용 폴백 (BD_hazardInteract)');
        await h.page.evaluate((tg) => {
          try {
            const st = STAGES[currentStage];
            const o = (st.objects || []).find(x => x && x.hazardId && Math.abs(x.rx - tg.rx) < 0.01 && Math.abs(x.ry - tg.ry) < 0.01)
              || (st.objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId])
                .sort((a, b) => Math.hypot(a.rx - heroX, a.ry - heroY) - Math.hypot(b.rx - heroX, b.ry - heroY))[0];
            if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY; BD_hazardInteract(o); }
          } catch (e) { }
        }, { rx: p.tgt.rx, ry: p.tgt.ry });
        for (let k2 = 0; k2 < 14; k2++) {
          const st2 = await h.page.evaluate(() => ({ choice: !!(window.__bdChoiceState && __bdChoiceState.open), hsr: !!(window.HSR && HSR.active) }));
          if (st2.hsr) break;
          if (st2.choice) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
          await h.page.keyboard.press(' '); await h.wait(380);
        }
        const nowB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
        if (nowB) { await A.doBattle(); await h.wait(1500); same = 0; continue; }
      }
      if (same > 16) { say('  ⛔ 같은 목표 반복 — 진행 불가'); await h.shot('BLOCK_loop_s' + s); return { ok: false, step: s, reason: 'loop:' + key, probe: p }; }
    }
    return { ok: true, reason: 'steps-exhausted' };
  };

  return A;
};
