const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));
}

const year=document.getElementById('year');
if(year)year.textContent=new Date().getFullYear();

if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.06,rootMargin:'0px 0px -25px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
}

const viewer=document.getElementById('image-viewer');
if(viewer){
  const triggers=[...document.querySelectorAll('.zoomable-image')];
  const stage=viewer.querySelector('.viewer-stage');
  const toolbar=viewer.querySelector('.viewer-toolbar');
  const closeBtn=viewer.querySelector('.viewer-close');
  const zoomIn=viewer.querySelector('[data-zoom="in"]');
  const zoomOut=viewer.querySelector('[data-zoom="out"]');
  const zoomReset=viewer.querySelector('[data-zoom="reset"]');
  const hint=viewer.querySelector('.viewer-hint');

  let activeIndex=0;
  let scale=1;
  let baseWidth=0;
  let dragging=false;
  let dragImage=null;
  let startX=0,startY=0,startLeft=0,startTop=0;
  let scrollTimer=null;

  const prevBtn=document.createElement('button');
  prevBtn.type='button';prevBtn.className='viewer-prev';prevBtn.setAttribute('aria-label','Previous image');prevBtn.textContent='←';
  const counter=document.createElement('span');
  counter.className='viewer-counter';counter.setAttribute('aria-live','polite');
  const nextBtn=document.createElement('button');
  nextBtn.type='button';nextBtn.className='viewer-next';nextBtn.setAttribute('aria-label','Next image');nextBtn.textContent='→';
  if(zoomOut){toolbar.insertBefore(prevBtn,zoomOut);toolbar.insertBefore(counter,zoomOut);toolbar.insertBefore(nextBtn,zoomOut);}
  if(hint)hint.textContent='Scroll or use arrows to view project images';

  const track=document.createElement('div');
  track.className='viewer-track';
  const slides=triggers.map((trigger,index)=>{
    const sourceImg=trigger.querySelector('img');
    const slide=document.createElement('div');
    slide.className='viewer-slide';
    slide.dataset.index=String(index);
    const img=document.createElement('img');
    img.className='viewer-image';
    img.src=trigger.dataset.full||sourceImg.src;
    img.alt=sourceImg.alt||'';
    img.draggable=false;
    slide.appendChild(img);
    track.appendChild(slide);
    return slide;
  });
  stage.replaceChildren(track);

  function activeSlide(){return slides[activeIndex];}
  function activeImage(){return activeSlide()?.querySelector('.viewer-image');}

  function updateCounter(){
    counter.textContent=slides.length?`${activeIndex+1} / ${slides.length}`:'';
    prevBtn.disabled=activeIndex===0;
    nextBtn.disabled=activeIndex===slides.length-1;
  }

  function resetZoom(){
    const img=activeImage();
    if(img){img.style.width='';img.classList.remove('is-zoomed');}
    const slide=activeSlide();
    if(slide)slide.scrollTo(0,0);
    scale=1;baseWidth=0;
    if(zoomReset)zoomReset.textContent='100%';
  }

  function setActive(index,{reset=true}={}){
    const next=Math.max(0,Math.min(slides.length-1,index));
    if(next===activeIndex){updateCounter();return;}
    if(reset)resetZoom();
    activeIndex=next;
    scale=1;baseWidth=0;
    if(zoomReset)zoomReset.textContent='100%';
    updateCounter();
  }

  function goTo(index,behavior='smooth'){
    if(!slides.length)return;
    resetZoom();
    activeIndex=Math.max(0,Math.min(slides.length-1,index));
    updateCounter();
    stage.scrollTo({left:activeIndex*stage.clientWidth,behavior});
  }

  function applyZoom(next){
    const img=activeImage();
    const slide=activeSlide();
    if(!img||!slide)return;
    next=Math.max(1,Math.min(4,next));
    if(!baseWidth)baseWidth=img.getBoundingClientRect().width;
    scale=next;
    if(scale===1){
      img.style.width='';
      img.classList.remove('is-zoomed');
      slide.scrollTo({left:0,top:0,behavior:'smooth'});
    }else{
      img.style.width=(baseWidth*scale)+'px';
      img.classList.add('is-zoomed');
    }
    if(zoomReset)zoomReset.textContent=Math.round(scale*100)+'%';
  }

  function openViewer(index){
    activeIndex=index;
    scale=1;baseWidth=0;
    viewer.showModal();
    document.body.style.overflow='hidden';
    updateCounter();
    requestAnimationFrame(()=>{
      stage.scrollTo({left:activeIndex*stage.clientWidth,behavior:'auto'});
      const img=activeImage();
      if(img)baseWidth=img.getBoundingClientRect().width;
    });
  }

  function closeViewer(){
    resetZoom();
    viewer.close();
    document.body.style.overflow='';
  }

  triggers.forEach((el,index)=>el.addEventListener('click',()=>openViewer(index)));
  closeBtn?.addEventListener('click',closeViewer);
  prevBtn.addEventListener('click',()=>goTo(activeIndex-1));
  nextBtn.addEventListener('click',()=>goTo(activeIndex+1));
  zoomIn?.addEventListener('click',()=>applyZoom(scale+.5));
  zoomOut?.addEventListener('click',()=>applyZoom(scale-.5));
  zoomReset?.addEventListener('click',()=>applyZoom(1));

  stage.addEventListener('scroll',()=>{
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      if(!stage.clientWidth)return;
      const index=Math.round(stage.scrollLeft/stage.clientWidth);
      if(index!==activeIndex)setActive(index);
    },80);
  },{passive:true});

  stage.addEventListener('wheel',e=>{
    if(scale!==1)return;
    const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(Math.abs(delta)<2)return;
    e.preventDefault();
    stage.scrollBy({left:delta,behavior:'auto'});
  },{passive:false});

  slides.forEach(slide=>{
    const img=slide.querySelector('.viewer-image');
    slide.addEventListener('click',e=>{if(e.target===slide)closeViewer();});
    img.addEventListener('dblclick',()=>applyZoom(scale===1?2:1));
    img.addEventListener('pointerdown',e=>{
      if(scale<=1||slide!==activeSlide())return;
      dragging=true;dragImage=img;
      img.setPointerCapture(e.pointerId);
      startX=e.clientX;startY=e.clientY;startLeft=slide.scrollLeft;startTop=slide.scrollTop;
    });
    img.addEventListener('pointermove',e=>{
      if(!dragging||dragImage!==img)return;
      slide.scrollLeft=startLeft-(e.clientX-startX);
      slide.scrollTop=startTop-(e.clientY-startY);
    });
    img.addEventListener('pointerup',()=>{dragging=false;dragImage=null;});
    img.addEventListener('pointercancel',()=>{dragging=false;dragImage=null;});
  });

  viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
  document.addEventListener('keydown',e=>{
    if(!viewer.open)return;
    if(e.key==='ArrowRight'&&scale===1){e.preventDefault();goTo(activeIndex+1);}
    if(e.key==='ArrowLeft'&&scale===1){e.preventDefault();goTo(activeIndex-1);}
    if(e.key==='+'||e.key==='=')applyZoom(scale+.5);
    if(e.key==='-')applyZoom(scale-.5);
    if(e.key==='0')applyZoom(1);
  });
}
