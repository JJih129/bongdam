(function(){var p=8,iv=setInterval(function(){try{
p=Math.min(92,p+(p<60?7:2));var b=document.getElementById('bd-preload-bar');if(b)b.style.width=p+'%';
var t=document.getElementById('bd-title-screen')||document.getElementById('title-screen');
var ready=(t&&t.offsetHeight>0)||window.__bdLoaded;
if(ready||document.readyState==='complete'){var d=document.getElementById('bd-preload');if(d){d.style.transition='opacity .25s';d.style.opacity='0';setTimeout(function(){try{d.remove();}catch(e){}},280);}clearInterval(iv);}
}catch(e){}},400);})();