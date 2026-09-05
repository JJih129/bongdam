// v323 — 상호작용 반경: 런타임 반영 + 에디터 UI + 핫키
module.exports = async (h) => {
  const { say } = h;
  await h.wait(2500);
  // 핫키 검증은 리로드를 유발하므로 마지막에. 먼저 dev URL로 진입한 상태 가정 (드라이버 url에 ?dev=1)
  const dev = await h.page.evaluate(() => /[?&]dev=1/.test(location.search));
  say('dev 모드: ' + dev);
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    if (window.fadeToStage) fadeToStage(212, 0.35, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ① 런타임 반경: 약국 110px 경계 안(=매칭) → 반경 70 지정 후 같은 지점에서 제외되는지
  const r1 = await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    const bw = STAGES[212].bgW, bh = STAGES[212].bgH;
    // 약국 사각형 아래 ~90px 지점
    heroX = Number(lm.rx) + Number(lm.rw) / 2;
    heroY = Number(lm.ry) + Number(lm.rh) + 110 / bh;
    camX = heroX; camY = heroY;
    const before = (BD_v24NearestFacility() || {}).facilityId || null;
    lm.interactionRadius = 70;
    const after = (BD_v24NearestFacility() || {}).facilityId || null;
    delete lm.interactionRadius;
    return { before, after };
  });
  say('① 런타임 반경: ' + JSON.stringify(r1) + ((r1.before === 'wawoo_pharmacy' && r1.after !== 'wawoo_pharmacy') ? ' ✅' : ' ❌'));

  if (dev) {
    // ② 에디터 UI: 에디터 켜고 약국 오브젝트 선택(좌표 입력 채워) → 반경 입력 표시·저장
    await h.page.evaluate(() => { BongdamEditor.enable(); });
    await h.wait(1500);
    const ui = await h.page.evaluate(() => {
      // 약국 배치 오브젝트 찾기 (facilityId 보유)
      const list = (STAGES[212].objects || []);
      const idx = list.findIndex(o => o && o.facilityId === 'wawoo_pharmacy');
      if (idx < 0) return { err: '오브젝트 없음' };
      const o = list[idx];
      // 에디터 입력 필드에 좌표를 채워 «선택» 상태를 흉내
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = Number(v).toFixed(3); };
      const form = document.getElementById('bge-obj-form'); if (form) form.style.display = 'block';
      set('bge-obj-rx', o.rx); set('bge-obj-ry', o.ry); set('bge-obj-rw', o.rw); set('bge-obj-rh', o.rh);
      return { ok: true };
    });
    await h.wait(1500);
    const box = await h.page.evaluate(() => {
      const b = document.getElementById('bd-radius-box');
      return b ? b.style.display : 'no-el';
    });
    say('② 반경 입력 UI: ' + box + (box === 'block' ? ' ✅' : ' ❌'));
    if (box === 'block') {
      await h.page.evaluate(() => { const i = document.getElementById('bd-radius-input'); i.value = '77'; i.dispatchEvent(new Event('change')); });
      await h.wait(800);
      const saved = await h.page.evaluate(() => {
        const o = (STAGES[212].objects || []).find(x => x && x.facilityId === 'wawoo_pharmacy');
        const K = JSON.parse(localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'));
        const so = ((K.stages || K)[212].objects || []).find(x => x && x.facilityId === 'wawoo_pharmacy');
        return { mem: o.interactionRadius, disk: so ? so.interactionRadius : null };
      });
      say('②-b 저장: ' + JSON.stringify(saved) + ((saved.mem === 77 && saved.disk === 77) ? ' ✅' : ' ❌'));
    }
    await h.shot('radius_editor');
  } else {
    // ③ 핫키: Shift+Z+X+C → ?dev=1 리로드
    await h.page.keyboard.down('Shift');
    await h.page.keyboard.down('z'); await h.page.keyboard.down('x'); await h.page.keyboard.down('c');
    await h.wait(400);
    await h.page.keyboard.up('c'); await h.page.keyboard.up('x'); await h.page.keyboard.up('z'); await h.page.keyboard.up('Shift');
    await h.wait(4000);
    const nowDev = await h.page.evaluate(() => /[?&]dev=1/.test(location.search)).catch(() => 'nav');
    say('③ 핫키 → dev: ' + nowDev + (nowDev === true ? ' ✅' : ' ❌'));
    await h.shot('radius_hotkey');
  }
  say('콘솔 오류: ' + h.consoleErrors.length);
};
