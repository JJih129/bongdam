// 상점별 상품 편차(v341 varyShop) 합성 유닛 — 오버레이 강제 표시 + 제목별 품절 패턴 비교
module.exports = async (h) => {
  const { say } = h;
  await h.wait(3000); // 타이틀 화면이면 충분 — varyShop은 상시 감시
  const pattern = async (title) => await h.page.evaluate((T) => {
    let ov = document.getElementById('shop-overlay');
    if (!ov) { ov = document.createElement('div'); ov.id = 'shop-overlay'; document.body.appendChild(ov); }
    ov.style.display = 'block';
    let tt = document.getElementById('shop-title');
    if (!tt) { tt = document.createElement('div'); tt.id = 'shop-title'; ov.appendChild(tt); }
    tt.textContent = T;
    let its = document.getElementById('shop-items');
    if (!its) { its = document.createElement('div'); its.id = 'shop-items'; ov.appendChild(its); }
    its.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const r = document.createElement('div');
      r.innerHTML = '<span>상품' + i + '</span><button>구매</button>';
      its.appendChild(r);
    }
    return new Promise(res => setTimeout(() => {
      const rows = [...document.getElementById('shop-items').children];
      res({ title: T, sold: rows.map((r, i) => r.__bdSold ? i : -1).filter(i => i >= 0), first: !!rows[0].__bdSold });
    }, 1600));
  }, title);
  const a = await pattern('🏪 해피24 편의점');
  const b = await pattern('🏪 와우약국');
  const c = await pattern('🏪 스마일25 편의점');
  say('A ' + JSON.stringify(a));
  say('B ' + JSON.stringify(b));
  say('C ' + JSON.stringify(c));
  const ok = !a.first && !b.first && !c.first
    && (JSON.stringify(a.sold) !== JSON.stringify(b.sold) || JSON.stringify(b.sold) !== JSON.stringify(c.sold))
    && (a.sold.length + b.sold.length + c.sold.length) > 0;
  say((ok ? '✅' : '❌') + ' 상점별 품절 패턴 차이 + 첫 품목 보존');
  await h.page.evaluate(() => { const ov = document.getElementById('shop-overlay'); if (ov) ov.style.display = 'none'; });
  say('콘솔 오류: ' + h.consoleErrors.length);
};
