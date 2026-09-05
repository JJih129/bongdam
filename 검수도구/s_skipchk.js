// BD_TUTOR.skip 격리 검증
module.exports = async (h) => {
  const { say } = h;
  await h.wait(3000);
  const r = await h.page.evaluate(async () => {
    const out = {};
    BD_TUTOR.run([{ id: 'sk1', text: 'skip test', block: false, waitFor: { delay: 60000 } }], null, 'qa_skip');
    await new Promise(r2 => setTimeout(r2, 500));
    out.running1 = BD_TUTOR.isRunning();
    let err = null;
    out.hasReal = typeof BD_TUTOR.__skipReal;
    try { (BD_TUTOR.__skipReal || BD_TUTOR.skip).call(BD_TUTOR); } catch (e) { err = String(e).slice(0, 120); }
    out.skipErr = err;
    out.running2 = BD_TUTOR.isRunning();
    await new Promise(r2 => setTimeout(r2, 800));
    out.running3 = BD_TUTOR.isRunning();
    return out;
  });
  say(JSON.stringify(r));
};
