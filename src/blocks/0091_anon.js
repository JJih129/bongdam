
/* ══════════════════════════════════════════════════════════════════
   (v240) BD_UI — 아트팀 UI 스킨 적용 (크로마키 제거판)
   ------------------------------------------------------------------
   초록 크로마키를 알파로 키잉(스필 억제 포함)하고 내용 영역만 크롭.
   원본 PNG 24.85MB → WebP 0.13MB. DOM 은 건드리지 않는다.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = {"chroma_test": "data:image/webp;base64,@@B64:9d900a91_chroma_test.webp@@", "대화창": "data:image/webp;base64,@@B64:4e0b1146_asset.webp@@", "대화창_선택지선택O": "data:image/webp;base64,UklGRjoBAABXRUJQVlA4WAoAAAAQAAAAGQAAHwAAQUxQSEUAAAABcNBGkiPVBfKDui5/t55AREyASlq1oQ2noA1t2NCGDW3Y0IZ7QRtO4T+HGKR2YjwmeA0Q4+svxPjxEzF+fxliRG+EVdIAVlA4IM4AAABQBwCdASoaACAAPk0ci0QioaEYBgAoBMS2AFSWoL8A/ADYDOgfhXuALQBygG2zfoB7//R/6Vv7C37e+kgExbn44Jr8AP7jfwl+yjrO/X2it8jJeFR5Blyajgw+bTHfMquZ42vXAD0uD9Lg/3Ub//sIeXrphsEb9WC5tp3z//Yx3+Kj8HFFM+FG9HXb8Sqi1DvvKLjZmA7WOLpufguF8Zrugn9jx/4uZtw1Rx2p5f/9IXP/6/N/Tsdh70nFIF5bnOTz8Z6MmjtR9ZjsovvwAA==", "대화창_선택지선택X": "data:image/webp;base64,UklGRiYBAABXRUJQVlA4WAoAAAAQAAAAGQAAHwAAQUxQSFQAAAABR2AkANI4oGYr3WomIgLed3IDBm0bScr9A2EhLKSFshCKPKNjENH/CQg6aUyXcrldGsulXF6XxnYZLuVyuTTmD6hLFWZgNgr1qsIsFOpWhZkoFBpWUDggrAAAALAFAJ0BKhoAIAA+RR6KRCKhoRv9VAAoBESgCdL3bWA2wHP/+f/fKIQtNEy2XH1VpAXKA3iAAAD+7x6sG0DqNM3FsgC27G4MbX+wXY6mm5EEJS82q/51aKvrHCeESqNNFkXPEpqIi0eQJbmdLa8TEPs/RJqG2Ybwpe3IWTrO+up7/7yDx4bJ4ItgJ0+uWYi1o8FpljqDX//VGkojmGpIkEo4ChlmZ8irZersAAA=", "메뉴_메인_게임저장버튼": "data:image/webp;base64,@@B64:e97ba96a_asset.webp@@", "메뉴_메인_게임종료버튼": "data:image/webp;base64,@@B64:b09bff25_asset.webp@@", "메뉴_메인_메뉴창": "data:image/webp;base64,@@B64:d0bb5611_asset.webp@@", "메뉴_메인_설정탭": "data:image/webp;base64,@@B64:50e24c71_asset.webp@@", "메뉴_메인_안전지도탭": "data:image/webp;base64,@@B64:015372a7_asset.webp@@", "메뉴_메인_업적탭": "data:image/webp;base64,@@B64:df854c3f_asset.webp@@", "메뉴_메인_카드탭": "data:image/webp;base64,@@B64:e2ddb7f9_asset.webp@@", "메뉴_메인_타이틀로버튼": "data:image/webp;base64,@@B64:0acf72cc_asset.webp@@", "메뉴_카드_X버튼": "data:image/webp;base64,UklGRq4CAABXRUJQVlA4WAoAAAAQAAAAMwAAMwAAQUxQSLAAAAAB16CokSRlYfYYHNyb/Rs8ERGRBLNhsJR6NJt4sGQ/IDmSpEiKYcaijPj/Twd2N0O154j+TwDe7x+SSFGkJFESgyQlUQxK9z2+DqXtnzZKvXizVfI3Sg9A+R8WwsFh+XC4DodnOFSPYRGzKBZ1OLRp1JjGsAgLWoTFmEZ3KBZ1/GeaRbVo3aEOhzaPcKgewyJmUZ4Ot6PDCg5wIIB8AHDKtn7BOdcOHzPh60vJUI54D1ZQOCDYAQAA8AoAnQEqNAA0AD5RJo9GI6IhISILuHAKCWcAyB439WqN6SMMZ3spz1cvXMQrmbz2PrnU5if1t3twDLMPBr4kxp67pWnCcoF0G//0BRhNQuM9HR/S4gncHeHHLtgEQ74AAP7+bEV+IN5pHx55MbITsjY7VUcEiBVxxIlnkQbehpX2Yy8/P+e6BiVsnCUv8OH+W+vmLQc4Hqo6v1KEW431dXkW4rcagRARIoPegMunljuJkoR1jRxmaNQW/Xv5rfHdGl5htgwcOl+izMdmunKUGRebcWaWQP4nFa/RPU9u1sDx/Z65XDfkLznK7r+7hH7heh5soxoczaijLsY/6dYeT6+xfJOcmzsSzqnHo6z5xBwSGwA+4g/3U9DzYlYTgda3eS3vA/1WauFSgYB8NU1zs3z2/+yinv1zQnLHUFMU5vDnCDpTV0Amxvk+72I5TcaF/me6XxU3BT69HP4Ff5j/V1vvydqvqKkBfQrcttxOCraIScSn/+kHhX3v8kDJvc5uBzUgxlkNkq++LuzyHyYvhy7wh/+qn7r6LkbhOne+oEkiswbCcyvtrYnI66/cXv957DseaL3LC1FK+thfUG36XP+gcDOoV81EdPMFLXIBeRNucq9nHTMgAA==", "메뉴_카드_메뉴카드창": "data:image/webp;base64,@@B64:140df0eb_asset.webp@@", "메뉴_카드_선택된카드칸": "data:image/webp;base64,@@B64:8965f2f2_asset.webp@@", "메뉴_카드_선택된탭": "data:image/webp;base64,@@B64:79085538_asset.webp@@", "메뉴_카드_선택안된카드칸": "data:image/webp;base64,@@B64:5a98ae37_asset.webp@@", "메뉴_카드_잠겨있는카드칸": "data:image/webp;base64,@@B64:384143db_asset.webp@@", "상점_구매하기": "data:image/webp;base64,@@B64:8f31d22d_asset.webp@@", "상점_나가기": "data:image/webp;base64,@@B64:f95e1d67_asset.webp@@", "상점_상점창": "data:image/webp;base64,@@B64:f6640c89_asset.webp@@", "상점_선택된아이템": "data:image/webp;base64,@@B64:3320478b_asset.webp@@", "상점_선택된태그": "data:image/webp;base64,@@B64:70664b76_asset.webp@@", "상점_선택안된아이템": "data:image/webp;base64,@@B64:567d33b0_asset.webp@@", "상점_선택안된태그": "data:image/webp;base64,@@B64:c625cc1f_asset.webp@@", "인벤토리_나가기": "data:image/webp;base64,@@B64:be8cbec2_asset.webp@@", "인벤토리_사용하기": "data:image/webp;base64,@@B64:8f6999be_asset.webp@@", "인벤토리_아이템": "data:image/webp;base64,UklGRsgCAABXRUJQVlA4WAoAAAAQAAAAyQAA8QAAQUxQSKoAAAABcBtJkiK1cSc/k4y+MvO/GyuPtKR0x0kTEROAguurEXxdo/rfqH7VMMJLGeklZkZ7J+tqxB8yglEfkq5G/iFhZvR3YiZgxCSUw0QU46/CFTAZW4q5DrODDhtz/7v/3f/uf/e/+9/97/53//vaDzps5jrMoANair8KVwAqQAxoADmgAKId/poYDuxtkBq4C0g/MLdBboe3BgVZQ2HGUPHF1RXVh1eGDkMUBFZQOCD4AQAA0BkAnQEqygDyAD5RKJFGI6KhoSFYCeBwCglpbuF1S+8yMQaTwG2W56PTSY/QSRe+EC31WU1xsVzEznoarBgKdVbQH89Q/zxLicTxL08KQmaSEd08QDlos7jfbv/LUZCAAkhRi48VWWhbKmgnoPFC2VVtsv5aFsqsna2GA+3gBIOLClsqstCvFFTZVZaFrrKfcOy0LZM0SIAEkKQlKtSZpIUhMpoY7SQpCZnEIwaQzLdafMFsMGLQtlSjiXm+v0N79AczbLqys6GvwfRFhxBJQiI/zrWZC+AA/vwT7s7jdFR2i2n0CDz/XYvpvfSza8zbCWU3XsvZgzdmLr9TOdcciqef0XLs/D//sZ/1gY0thQnBJ33erpXG4Ib6j5qVYmzCAPvdr4MqQPfMv/m7nnj5tHzy66axu08NJ7+IClG9+XnjUFUQUEIinVv88ptvwbGywFB4oIVTw9FO4AckgesAAAAAAofnkzImHBOHa+Ae9Y97eXaYDtSwrYUb1GVxR4sMleLo0AjeAPElsFrzuN2xLvfMxyDYnIcPHmmK8Va/XYMofStejQN0ccoYV2p7/vthNtuT+yielItRFQLbrzE8faYTP4F/g///9dOq1UpYZlQtC9XJ25wLhXTDf9dFY5aoqVAMfieuRa2qLXe6ZegcaV//27/nSAAA", "인벤토리_아이템선택됨": "data:image/webp;base64,@@B64:483d78d3_asset.webp@@", "인벤토리_인벤토리창": "data:image/webp;base64,@@B64:3900d770_asset.webp@@", "인벤토리_태그선택됨": "data:image/webp;base64,UklGRggBAABXRUJQVlA4IPwAAADQDQCdASoWAUYAPlEijkQjoiGXdAA4BQSm7hbxvq34B+QGxY9A+QCnAfKBcmdQo+SSBkIN+KABhS7l+QxG0idAAwpdrEpaFyR5488eePPHmpD78W+LfFvi3xaCH34t8W+LfFvi0EWeOTNInQAMKXcvyGI2kTeSAAD+8pLxQv9iekCYU4oLLagyW+OxWyh81iDib5tweVOwtteHb/8XISc5Vn/qHwRW/4NkN4W/E79A9GUyPYC2p+Ql9dzCH06NSZevFw5hWPxfyf/SAc5YnKOA/WK/sb/vW7RSyJeszrlAFrpqgPzN+pNjAd8nfGu3iYM2/8EX6QBrfQGcoAA=", "전투씬_궁극기0_": "data:image/webp;base64,@@B64:3c4cfbab_0_.webp@@", "전투씬_궁극기100_": "data:image/webp;base64,@@B64:536f738a_100_.webp@@", "전투씬_물러나기": "data:image/webp;base64,@@B64:d40a6196_asset.webp@@", "전투씬_배지스킬": "data:image/webp;base64,@@B64:5eace4d7_asset.webp@@", "전투씬_아이템": "data:image/webp;base64,@@B64:14089bdb_asset.webp@@", "전투씬_적HP바": "data:image/webp;base64,UklGRlIBAABXRUJQVlA4WAoAAAAQAAAAewEAFwAAQUxQSDoAAAABUNy2jaP9l871++oqImIC6IfozIbuQyH8QCjfCekboT0Q4m988c2JeWx8eEdtHW3n6BvHqG/MmkYfVlA4IPIAAACQCQCdASp8ARgAPlEokkajoqGhIqgAcAoJZwCVz5pTqXRvxA/FV+le2wfpnllfoAfrd1oX7ReoB/aP/+Ajr6+Ig+sebU0+DQitIj6x5tTT4QkfSYwAAP3HH+VlgyxBbqUMX/8uT/2v9kP1z10laYspHqTgbsa4f/5f+b3kUAAKAmAAEeXYWYzGA+/PS9fNPU1Hftp+FGvS+M7w//xA8qfCXs1e0Ko0YBTUX/+o+xkH/vnRf8oaTf2g2vyy/mGZF+nXucAAAN4ABIgaMiC/hmY8oN9Myb+31fee/13ymQOPpekWZePKI//4EVfkbO/+CCAAAA==", "전투씬_적정보창": "data:image/webp;base64,@@B64:627c4e52_asset.webp@@", "전투씬_플레이어HP바": "data:image/webp;base64,UklGRjQBAABXRUJQVlA4WAoAAAAQAAAAewEAFwAAQUxQSGEAAAABcBvZttOc4kDSi38Zci/GveKx4RmiiJgAjrZSvHFhlurDsVa6x4GhhB92hlJ+2GglfaxKeyC9Syjxb3xhXqjXYR43vvQuAe8AwrpYMTg3sD0YN7AfvgWH364NXBiOBUcBAFZQOCCsAAAAsAcAnQEqfAEYAD5RKJJGo6KhoSK4CABwCglnAHcF9JtwzgGYAdQDeAPQA6S0AVWmMcPhCR9Y82oLA2VY82pp8ISPrHhsgAD+zoL2Lk/HxZzlj///kVe9Ymy3f2f7P6wAADx1zFRRllQfWkwaReZ19GyzbpV64L/akZdGI/64TqYdHONSBFec3L8wIAAS8fachuXHnPppa2yTHS6NIzMSOc+fcelHZlvxl3SwAA==", "전투씬_플레이어정보창": "data:image/webp;base64,@@B64:3a65d6b6_asset.webp@@", "캐릭터선택_선택됨": "data:image/webp;base64,@@B64:3d9635c7_asset.webp@@", "캐릭터선택_선택안됨": "data:image/webp;base64,@@B64:443efe18_asset.webp@@", "캐릭터선택_선택완료": "data:image/webp;base64,@@B64:9ae51920_asset.webp@@", "캐릭터선택_선택창": "data:image/webp;base64,@@B64:f27215c6_asset.webp@@"};
  window.BD_UI_ASSETS = A;
  function u(k){ return A[k] ? 'url("' + A[k] + '")' : 'none'; }
  window.BD_UI_URL = u;

  /* ── 공통 톤 ──
     나무 프레임 + 크림 패널. 기존 다크 블루 UI 를 덮어쓴다. */
  var css = ''

  /* ══════════ 1. 모달 공통 (메뉴·카드·안전지도·업적) ══════════ */
  + '.bd-modal-box{'
  +   'background-image:none !important;background:#f6f1e7 !important;'
  +   'border:12px solid #232327 !important;border-radius:22px !important;'
  +   'box-shadow:0 18px 50px rgba(0,0,0,.55) !important;'
  +   'padding:26px 30px !important;color:#4a3520 !important;'
  +   'min-width:520px !important;}'
  + '.bd-modal-title{color:#5b4127 !important;font-size:20px !important;'
  +   'text-shadow:0 1px 0 rgba(255,255,255,.45) !important;letter-spacing:.5px;}'
  + '.bd-modal-box *{color:#4a3520;}'
  + '.bd-modal-close{'
  +   'background-image:' + u('메뉴_메인_타이틀로버튼') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;color:#fdf6e3 !important;'
  +   'text-shadow:0 1px 2px rgba(0,0,0,.45) !important;border-radius:0 !important;'
  +   'height:52px;font-size:15px;}'
  + '.bd-modal-close:hover{filter:brightness(1.08);}'

  /* 카드 그리드 — 카드칸 에셋 */
  + '.bd-card{'
  +   'background-image:' + u('메뉴_카드_선택안된카드칸') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;border-radius:0 !important;'
  +   'min-height:150px !important;padding:18px 16px !important;}'
  + '.bd-card:hover{background-image:' + u('메뉴_카드_선택된카드칸') + ' !important;}'
  + '.bd-card-locked{'
  +   'background-image:' + u('메뉴_카드_잠겨있는카드칸') + ' !important;'
  +   'opacity:1 !important;filter:none !important;}'
  + '.bd-card-name{color:#5b4127 !important;}'
  + '.bd-card-region{color:#8a6a3f !important;}'
  + '.bd-card-desc{color:#6b5233 !important;}'

  /* ══════════ 2. 대화창 ══════════ */
  + '#dialogue-box{'
  +   'background-image:' + u('대화창') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border-top:none !important;'
  +   'padding:42px 68px 44px !important;}'
  + '#dialogue-name{'
  +   'background:none !important;border:none !important;color:#5b4127 !important;'
  +   'text-shadow:0 1px 0 rgba(255,255,255,.5) !important;font-weight:900 !important;}'
  + '#dialogue-text{color:#4a3520 !important;text-shadow:none !important;}'

  /* 선택지 — 나무 커서 아이콘 */
  + '.bd-choicebox{'
  +   'background-image:' + u('대화창') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;'
  +   'border-radius:0 !important;box-shadow:none !important;padding:34px 46px !important;}'
  + '.bd-choicebox-title{color:#5b4127 !important;text-shadow:0 1px 0 rgba(255,255,255,.45);}'
  + '.bd-choice-row{color:#4a3520 !important;border-radius:8px;}'
  + '.bd-choice-row .bd-choice-cursor{'
  +   'background-image:' + u('대화창_선택지선택X') + ';background-size:contain;'
  +   'background-repeat:no-repeat;background-position:center;'
  +   'width:26px;height:26px;color:transparent !important;opacity:1 !important;}'
  + '.bd-choice-row.selected{background:rgba(120,80,30,.14) !important;}'
  + '.bd-choice-row.selected .bd-choice-cursor{'
  +   'background-image:' + u('대화창_선택지선택O') + ';}'
  + '.bd-choice-label{color:#4a3520 !important;font-weight:700;}'

  /* ══════════ 3. 전투 ══════════ */
  /* 유닛 정보창 */
  + '.hsr-unit .hsr-info{'
  +   'background-image:none !important;background:#fefdf9 !important;'
  +   'border:1px solid #e4ddcf !important;border-radius:14px !important;'
  +   'box-shadow:0 8px 22px rgba(0,0,0,.35) !important;'
  +   'width:300px !important;min-width:300px !important;height:71px !important;'
  +   'padding:12px 26px 10px !important;box-sizing:border-box !important;'
  +   'display:flex;flex-direction:column;justify-content:center;gap:3px !important;}'
  + '.hsr-unit .hsr-name,.hsr-unit .hsr-lv,.hsr-unit .hsr-hptext,#hsr-hero-cls,#hsr-enemy-lv{'
  +   'color:#3a2c18 !important;text-shadow:none !important;}'
  + '.hsr-unit .hsr-lv,#hsr-enemy-lv{color:#8a7a5e !important;}'
  /* (v240b) 정보창을 각 유닛 쪽으로 — 주인공(좌하단 스프라이트)=왼쪽, 적(우측 스프라이트)=오른쪽 */
  /* (v240e) 스프라이트를 가리지 않게: 적=최상단(머리 위), 주인공=스프라이트 오른쪽 옆 */
  + '.hsr-enemy .hsr-info{left:auto !important;right:5% !important;top:14px !important;bottom:auto !important;}'
  + '.hsr-hero .hsr-info{right:auto !important;left:31% !important;bottom:214px !important;top:auto !important;}'
  /* HP 바 — 프레임 이미지를 트랙 위에 얹는다 */
  + '.hsr-hpbar{'
  +   'position:relative;background:#ece5d6 !important;border:1px solid #d8cfba !important;'
  +   'border-radius:9px !important;overflow:hidden !important;'
  +   'height:16px !important;min-height:16px !important;max-height:16px !important;flex:none !important;}'
  + '.hsr-hpbar>i{border-radius:8px;height:100%;display:block;'
  +   'background:linear-gradient(180deg,#ff6d75,#fe505b) !important;}'
  + '.hsr-hero .hsr-hpbar>i{background:linear-gradient(180deg,#4fc0ba,#42a9a4) !important;}'
  + '.hsr-unit .hsr-hptext{font-size:12px !important;margin-top:2px !important;}'
  + '.hsr-unit .hsr-name{font-size:14px !important;}'

  /* 액션 버튼 — 세로 나무 패널 3종 + 물러나기 */
  /* 세로 나무 패널(196x252) — 원본 비율 유지, 늘리지 않는다 */
  + '#hsr-actions{align-items:flex-end !important;gap:14px !important;}'
  + '.hsr-act{'
  +   'background-image:' + u('전투씬_배지스킬') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;box-shadow:none !important;'
  +   'border-radius:0 !important;padding:0 6px 14px !important;'
  +   'flex:0 0 108px !important;width:108px !important;max-width:108px !important;'
  +   'height:142px !important;min-height:0 !important;'
  +   'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;}'
  + '.hsr-act.hsr-item{background-image:' + u('전투씬_아이템') + ' !important;}'
  /* 물러나기는 가로형(390x92) */
  + '.hsr-act.hsr-flee{background-image:' + u('전투씬_물러나기') + ' !important;'
  +   'flex:0 0 170px !important;width:170px !important;max-width:170px !important;'
  +   'height:40px !important;padding:0 !important;justify-content:center;}'
  + '.hsr-act.hsr-flee .hsr-ai,.hsr-act.hsr-flee .hsr-ad{display:none !important;}'
  + '.hsr-act .hsr-ai{display:none !important;}'
  + '.hsr-act .hsr-at{font-size:12.5px !important;line-height:1.25;}'
  + '.hsr-act .hsr-ad{font-size:10px !important;line-height:1.2;opacity:.9;}'
  + '.hsr-act .hsr-at{color:#3a2c18 !important;text-shadow:none !important;font-weight:700 !important;}'
  + '.hsr-act .hsr-ad{color:#7a684c !important;text-shadow:none !important;}'
  + '.hsr-act:hover{transform:translateY(-3px);filter:brightness(1.08);box-shadow:none !important;}'
  + '.hsr-act.hsr-disabled{filter:grayscale(.6) brightness(.75);}'

  /* ══════════ 4. 상점 ══════════ */
  + '#shop-panel{'
  +   'background-image:none !important;background:#f6f1e7 !important;'
  +   'border:12px solid #232327 !important;border-radius:22px !important;'
  +   'box-shadow:0 18px 50px rgba(0,0,0,.55) !important;'
  +   'padding:22px 26px !important;}'
  + '.shop-item{'
  /* (v240e) 상품칸 에셋은 188x249 세로 카드라 가로 행에 늘리면 그림이 찢긴다 → 단색 CSS 카드 */
  +   'background-image:none !important;background:#fefdf9 !important;'
  +   'border:1px solid #e4ddcf !important;border-radius:12px !important;'
  +   'box-shadow:0 2px 8px rgba(70,50,20,.08) !important;'
  +   'color:#4a3520 !important;padding:14px 16px !important;}'
  + '.shop-item:hover,.shop-item.selected{'
  +   'background-image:none !important;background:#fff6e0 !important;border-color:#d9b96a !important;}'
  + '.shop-buy-btn,#shop-buy-btn{'
  +   'background-image:none !important;background:linear-gradient(180deg,#4b93f7,#2f6fe0) !important;'
  +   'border:1px solid #2a5fc4 !important;border-radius:10px !important;'
  +   'color:#ffffff !important;text-shadow:none !important;font-weight:700 !important;'
  +   'height:44px !important;padding:0 18px !important;}'
  + '.shop-buy-btn:hover,#shop-buy-btn:hover{filter:brightness(1.08);}'

  /* ══════════ 5. 인벤토리 ══════════ */
  + '#inv-panel{'
  +   'background-image:none !important;background:#f6f1e7 !important;'
  +   'border:12px solid #232327 !important;border-radius:22px !important;'
  +   'box-shadow:0 18px 50px rgba(0,0,0,.55) !important;'
  +   'padding:22px 26px !important;}'
  + '.inv-slot{'
  +   'background-image:' + u('인벤토리_아이템') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;color:#4a3520 !important;}'
  + '.inv-slot.selected,.inv-slot:hover{'
  +   'background-image:' + u('인벤토리_아이템선택됨') + ' !important;}'
  + '#inv-use-btn{'
  +   'background-image:' + u('인벤토리_사용하기') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;'
  +   'color:#fdf6e3 !important;height:48px;}'

  + '#inv-header,#inv-title,#inv-gold,#inv-detail-name,#inv-detail-desc,.inv-slot-count{'
  +   'color:#4a3520 !important;text-shadow:none !important;}'
  + '.inv-tab{background:rgba(120,80,30,.10) !important;border:1px solid rgba(140,100,50,.45) !important;'
  +   'color:#6b5233 !important;border-radius:8px !important;}'
  + '.inv-tab.active{'
  +   'background-image:' + u('인벤토리_태그선택됨') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;color:#3d2c18 !important;font-weight:800;}'
  + '#inv-close-btn{'
  +   'background-image:' + u('인벤토리_나가기') + ' !important;'
  +   'background-size:contain !important;background-repeat:no-repeat !important;background-position:center !important;'
  +   'background-color:transparent !important;border:none !important;color:transparent !important;'
  +   'width:42px;height:42px;}'
  + '.shop-item-name,.shop-item-desc,#shop-title{color:#4a3520 !important;}'
  + '.shop-tab{background-image:' + u('상점_선택안된태그') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;color:#6b5233 !important;}'
  + '.shop-tab.active{background-image:' + u('상점_선택된태그') + ' !important;color:#3d2c18 !important;}'

  + '#inv-body,#inv-detail,#inv-safety-panel,#inv-skill-panel,#inv-achieve-panel,#inv-tabs,#inv-header{'
  +   'background:transparent !important;border-color:rgba(140,100,50,.35) !important;}'
  + '#inv-detail{background:rgba(120,80,30,.10) !important;border:1px solid rgba(140,100,50,.4) !important;}'
  + '.inv-empty{color:#8a6a3f !important;}'
  + '#inv-detail-desc{color:#6b5233 !important;}'
  + '.inv-slot-icon{filter:none;}'
  + '#inv-gold{color:#8a5a1e !important;}'

  /* ══════════ 6. 캐릭터 선택 ══════════ */
  + '#char-select-panel,#char-select-box{'
  +   'background-image:none !important;background:#f6f1e7 !important;'
  +   'border:12px solid #232327 !important;border-radius:22px !important;'
  +   'box-shadow:0 18px 50px rgba(0,0,0,.55) !important;'
  +   'padding:26px 30px !important;}'
  + '#char-card-1,#char-card-2{'
  +   'background-image:' + u('캐릭터선택_선택안됨') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;}'
  + '#char-card-1.selected,#char-card-2.selected{background-image:' + u('캐릭터선택_선택됨') + ' !important;}'
  + '#char-confirm-btn,.char-confirm{'
  +   'background-image:' + u('캐릭터선택_선택완료') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;color:#fdf6e3 !important;}'

  /* ══════════ 7. 안전 수첩(도감) — 같은 톤으로 ══════════ */
  + '#bd-codex{'
  +   'background-image:none !important;background:#f6f1e7 !important;'
  +   'border:12px solid #232327 !important;border-radius:22px !important;'
  +   'box-shadow:0 18px 50px rgba(0,0,0,.55) !important;'
  +   'padding:24px 28px !important;color:#4a3520 !important;}'
  + '#bd-codex h3{color:#5b4127 !important;}'
  + '#bd-codex .bd-cdx-sub{color:#7a5c38 !important;}'
  + '.bd-cdx-card{'
  +   'background-image:' + u('메뉴_카드_잠겨있는카드칸') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;border-radius:0 !important;'
  +   'min-height:118px;padding:16px 14px !important;}'
  + '.bd-cdx-card.on{background-image:' + u('메뉴_카드_선택안된카드칸') + ' !important;}'
  + '.bd-cdx-card .bd-cdx-head{color:#5b4127 !important;}'
  + '.bd-cdx-card .bd-cdx-edu{color:#6b5233 !important;}'
  + '.bd-cdx-card:not(.on) .bd-cdx-edu{color:#9b7f5c !important;}'
  + '#bd-codex-close{'
  +   'background-image:' + u('메뉴_메인_타이틀로버튼') + ' !important;'
  +   'background-size:100% 100% !important;background-repeat:no-repeat !important;'
  +   'background-color:transparent !important;border:none !important;'
  +   'color:#fdf6e3 !important;height:52px;}'

  /* ══════════ 8. 담이 말풍선 — 나무 톤에 맞춰 ══════════ */
  + '#bd-dami-bubble{'
  +   'background:rgba(250,240,220,.97) !important;'
  +   'border:2px solid rgba(140,100,50,.75) !important;color:#4a3520 !important;}'
  + '#bd-dami-bubble::before{background:rgba(250,240,220,.97) !important;'
  +   'border-left-color:rgba(140,100,50,.75) !important;'
  +   'border-bottom-color:rgba(140,100,50,.75) !important;}'
  + '#bd-dami-name{color:#8a5a1e !important;}'
  + '#bd-dami-text{color:#4a3520 !important;}'
  + '#bd-dami-skip{background:rgba(120,80,30,.14) !important;'
  +   'border:1px solid rgba(140,100,50,.5) !important;color:#6b5233 !important;}';


  /* ══════════ 8. (v240b) 시안 레이아웃 재배치 ══════════
     창 에셋이 '빈 프레임'이 아니라 제목·탭·칸까지 그려진 목업 전체라
     실제 DOM 과 이중으로 겹치던 문제 → 배경은 CSS 프레임으로 바꾸고
     시안의 배치(탭 상단·격자 좌측·상세+사용 우측 등)를 CSS 로 재현. */
  css += ''
  /* ── 인벤토리: 좌 격자 / 우 상세·사용하기 ── */
  + '#inv-panel{width:min(92vw,900px) !important;max-width:none !important;height:min(86vh,640px) !important;'
  +   'display:grid !important;grid-template-columns:minmax(0,1fr) 290px !important;'
  +   'grid-template-rows:auto auto minmax(0,1fr) auto !important;gap:12px 18px !important;}'
  + '#inv-header{grid-column:1/3 !important;display:flex !important;align-items:center !important;gap:12px !important;}'
  + '#inv-title{margin-right:auto !important;}'
  + '#inv-gold{background:#fff !important;border:2px solid #e2d7c0 !important;border-radius:12px !important;padding:6px 16px !important;}'
  + '#inv-tabs{grid-column:1/2 !important;grid-row:2 !important;}'
  + '#inv-body,#inv-safety-panel,#inv-skill-panel,#inv-achieve-panel{grid-column:1/2 !important;grid-row:3 !important;overflow-y:auto !important;min-height:0 !important;}'
  + '#inv-detail{grid-column:2/3 !important;grid-row:2/4 !important;display:flex !important;flex-direction:column !important;'
  +   'align-items:center !important;text-align:center !important;gap:10px !important;'
  +   'background:#fbf7ee !important;border:2px solid #e2d7c0 !important;border-radius:14px !important;'
  +   'padding:18px 16px !important;min-height:0 !important;}'
  + '#inv-detail-icon{font-size:56px !important;line-height:1 !important;}'
  + '#inv-detail-info{flex:1 1 auto !important;display:flex !important;flex-direction:column !important;gap:6px !important;overflow:auto !important;min-width:0 !important;}'
  + '#inv-use-btn{flex:none !important;width:198px !important;height:56px !important;margin-top:auto !important;'
  +   'background-image:' + u('인벤토리_사용하기') + ' !important;background-size:100% 100% !important;'
  +   'background-color:transparent !important;border:none !important;font-size:0 !important;}'
  + '#inv-use-btn:disabled{filter:grayscale(.7) brightness(.8) !important;}'
  + '#inv-footer{grid-column:1/3 !important;}'
  /* ── 상점: 좌 태그 사이드바 / 우 상품 목록 ── */
  + '#shop-panel{width:min(92vw,880px) !important;max-width:none !important;height:min(84vh,620px) !important;'
  +   'display:grid !important;grid-template-columns:150px minmax(0,1fr) !important;'
  +   'grid-template-rows:auto auto minmax(0,1fr) auto !important;gap:10px 16px !important;}'
  + '#shop-header{grid-column:1/3 !important;display:flex !important;align-items:center !important;gap:12px !important;}'
  + '#shop-title{margin-right:auto !important;}'
  + '#shop-gold{background:#fff !important;border:2px solid #e2d7c0 !important;border-radius:12px !important;padding:6px 16px !important;}'
  + '#shop-tabs{grid-column:1/2 !important;grid-row:2/4 !important;display:flex !important;flex-direction:column !important;gap:10px !important;align-content:start !important;}'
  + '.shop-tab{width:100% !important;height:46px !important;}'
  + '#shop-countdown{grid-column:2/3 !important;grid-row:2 !important;}'
  + '#shop-body{grid-column:2/3 !important;grid-row:3 !important;overflow-y:auto !important;min-height:0 !important;}'
  + '#shop-footer{grid-column:1/3 !important;}'
  /* ── 캐릭터 확정: 에셋에 라벨이 구워져 있어 겹침 방지 ── */
  + '#char-confirm-btn,.char-confirm{font-size:0 !important;min-height:60px !important;}'
  /* ── 정화 결과창: 크림 톤 가독성 ── */
  + '.bd-edu-box{background:#fff6d8 !important;border:1px solid #ecd9a0 !important;color:#6b5233 !important;}'
  + '.bd-edu-title{color:#8a5a1e !important;}'
  + '.bd-result-row{background:#fbf7ee !important;border:1px solid #e2d7c0 !important;color:#5b4a33 !important;}'
  + '.bd-result-row b{color:#1f8a52 !important;}'
  + '#bd-result-modal .bd-modal-title{color:#1f8a52 !important;}'
  ;

  (function inject() {
    var s = document.getElementById('bd-ui-skin');
    if (!s) { s = document.createElement('style'); s.id = 'bd-ui-skin'; document.head.appendChild(s); }
    s.textContent = css;
  })();

  /* 스킨 on/off — 에셋 교체·비교 확인용 */
  window.BD_UI_SKIN = {
    on: function () { var s = document.getElementById('bd-ui-skin'); if (s) s.disabled = false; },
    off: function () { var s = document.getElementById('bd-ui-skin'); if (s) s.disabled = true; },
    keys: function () { return Object.keys(A); },
    /** 슬롯 교체: BD_UI_SKIN.set('전투씬_배지스킬', 'data:image/png;base64,...') */
    set: function (key, dataUrl) { A[key] = dataUrl; inject(); return true; }
  };
})();

