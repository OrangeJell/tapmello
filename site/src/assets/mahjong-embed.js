(() => {
  const host=document.querySelector('[data-mahjong-embed]'),frame=document.querySelector('#mahjong-frame');
  if(!host||!frame)return;
  const localized = document.getElementById('site-localized-copy');
  const loader = createNativeLoader();
  const base = frame.dataset.src;
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;
    const data=event.data;
    if(data.type==='tapmelo-mahjong-ready'&&Number.isFinite(data.height)&&data.height>=100&&data.height<=10000){
      frame.style.height = Math.ceil(data.height) + 'px';
      loader.ready();
    }
    if(!localized&&data.type==='tapmelo-mahjong-language'&&['en','hi'].includes(data.language)&&data.language!==host.dataset.language){
      const url=new URL((data.language==='hi'?'/hi':'')+'/games/mahjong/',location.origin);
      if(typeof data.route==='string'&&/^#(?:home|practice|learn\/[a-z0-9/-]+)$/.test(data.route))url.searchParams.set('resume',data.route);
      location.href=url.href;
    }
  });
  const resume=new URLSearchParams(location.search).get('resume');
  if(resume&&/^#(?:home|practice|learn\/[a-z0-9/-]+)$/.test(resume))frame.dataset.src=base+resume;
})();
