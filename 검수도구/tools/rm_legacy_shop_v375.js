// (v375) 구 상점 UI(#shop-overlay·랜덤 재고·legacy openShop/buyItem) 제거 — 0016 + shell.html + 0134
'use strict';
const fs = require('fs');
const P = 'D:/봉담/src/blocks/0016_anon.js';
let s = fs.readFileSync(P, 'utf8');
const lines = s.split('\n');
function idx(pred, from = 0){ for (let i = from; i < lines.length; i++) if (pred(lines[i])) return i; throw new Error('not found'); }
// ① SHOP_RESET_MS ~ formatCountdown 끝 (다음 빈 줄 뒤 'let _lastOpenStore')
const a1 = idx(l => l.startsWith('const SHOP_RESET_MS'));
const b1 = idx(l => l.startsWith('let _lastOpenStore '), a1);
// _lastOpenStore/_lastOpenStoreKey/_countdownTimer 3줄도 제거
let b1e = b1; while (lines[b1e].startsWith('let _lastOpen') || lines[b1e].startsWith('let _countdownTimer')) b1e++;
// ② openShop ~ closeShop 끝 (safety 헤더 '// ═══' 직전)
const a2 = idx(l => l.startsWith('function openShop()'), b1e);
const b2 = idx(l => l.startsWith('// ═══'), a2);
// ③ switchShopTab ~ showShopToast 끝
const a3 = idx(l => l.startsWith('function switchShopTab'), b2);
const a3b = idx(l => l.startsWith('function showShopToast'), a3);
let b3 = a3b; while (lines[b3].trim() !== '}') b3++; b3++;   // showShopToast 닫는 중괄호 다음 줄
const stub2 = [
  '/* (v375) 구 상점 UI 제거 — 랜덤 재고·#shop-overlay·구 openShop/buyItem 삭제. 상점은 bd-shop-modal(0052·0242) 한 경로.',
  '   openShop/closeShop 는 호환 스텁으로만 남긴다 (F 핸들러·ESC 정리 코드의 참조 보존). */',
  'function openShop() { try { if (typeof window.BD_openShop === \'function\') window.BD_openShop(); } catch (e) {} }',
  'function closeShop() { shopOpen = false; }',
  '',
];
const stub3 = [
  '// ── (v375) 알림은 공용 토스트로 (구 상점 토스트 DOM 제거) ──',
  'function showShopToast(msg) { try { if (typeof bdToast === \'function\') bdToast(msg); } catch (e) {} }',
  '',
];
// 뒤에서부터 잘라내기
let out = lines.slice(0, a3).concat(stub3, lines.slice(b3));
out = out.slice(0, a2).concat(stub2, out.slice(b2));
out = out.slice(0, a1).concat(out.slice(b1e));
s = out.join('\n');
// 남은 참조 점검
for (const k of ['getCurrentItems(', 'renderShopItems(', 'getNearStore(', 'generateInventory(', 'switchShopTab(', '_updateCountdown(']){
  const n = (s.match(new RegExp(k.replace(/[()]/g, m => '\\' + m), 'g')) || []).length;
  console.log('0016 잔여', k, n);
}
fs.writeFileSync(P, s);
console.log('0016 lines', lines.length, '→', out.length);

// shell.html: #shop-overlay 블록 제거
const SH = 'D:/봉담/src/shell.html';
let sh = fs.readFileSync(SH, 'latin1');
const i0 = sh.indexOf('  <div id="shop-overlay">');
if (i0 < 0) throw new Error('shop-overlay not found');
// 닫힘: 같은 들여쓰기의 '  </div>' 다음에 오는 빈 줄 — 구조: overlay > panel ... ; 안전하게 다음 '<div id="inv-overlay">' 직전까지 제거
const i1 = sh.indexOf('  <div id="inv-overlay">');
if (i1 < 0 || i1 < i0) throw new Error('inv-overlay anchor not found');
console.log('shell 제거 bytes', i1 - i0);
sh = sh.slice(0, i0) + '  <!-- (v375) 구 상점 오버레이(#shop-overlay) 제거 — 상점은 #bd-shop-modal 한 경로 -->\n' + sh.slice(i1);
fs.writeFileSync(SH, sh, 'latin1');

// 0134 비움 (shell 토큰 유지)
const P134 = 'D:/봉담/src/blocks/0134_bd-region-shop-v79.js';
fs.writeFileSync(P134, '\n/* (v79 지역 상점 — v375 에서 제거) 구 #shop-overlay 에 품목을 덧붙이던 레이어. 지역별 품목은 0242 의 새 상점 렌더러가 담당한다. */\n');
console.log('done');
