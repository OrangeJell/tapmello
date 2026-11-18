(() => {
  const host=document.querySelector('[data-mahjong-embed]'),frame=document.querySelector('#mahjong-frame');
  if(!host||!frame)return;
  const status=host.querySelector('[data-mahjong-status]'),retry=host.querySelector('[data-mahjong-retry]'),hi=host.dataset.language==='hi';
  const localized = document.getElementById('site-localized-copy');
  const messages = localized ? JSON.parse(localized.textContent) : {};
  const base=frame.getAttribute('data-src');let timeout,ready=false;
  const start=()=>{ready=false;host.dataset.state='loading';retry.hidden=true;status.textContent=hi?'टाइलें लोड हो रही हैं…':(messages['mahjong.loading'] ?? 'Loading the tiles…');clearTimeout(timeout);timeout=setTimeout(()=>{host.dataset.state='error';retry.hidden=false;status.textContent=hi?'खेल लोड नहीं हो सका। फिर कोशिश करें या इसे अलग पेज पर खोलें।':(messages['game.error'] ?? 'The game could not load. Try again or open it on its own.');},15000);};
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;
    const data=event.data;
    if(data.type==='tapmelo-mahjong-ready'&&Number.isFinite(data.height)&&data.height>=100&&data.height<=10000){
      clearTimeout(timeout);host.dataset.state='ready';frame.style.height=Math.ceil(data.height)+'px';
      if(!ready){ready=true;status.textContent='';}
    }
    if(!localized&&data.type==='tapmelo-mahjong-language'&&['en','hi'].includes(data.language)&&data.language!==host.dataset.language){
      const url=new URL((data.language==='hi'?'/hi':'')+'/games/mahjong/',location.origin);
      if(typeof data.route==='string'&&/^#(?:home|practice|learn\/[a-z0-9/-]+)$/.test(data.route))url.searchParams.set('resume',data.route);
      location.href=url.href;
    }
  });
  retry.addEventListener('click',()=>{start();const url=new URL(frame.dataset.src,location.origin);url.searchParams.set('retry',Date.now());frame.contentWindow.location.replace(url);});
  document.addEventListener('game-launch', start);
  const resume=new URLSearchParams(location.search).get('resume');
  if(resume&&/^#(?:home|practice|learn\/[a-z0-9/-]+)$/.test(resume))frame.dataset.src=base+resume;
})();
