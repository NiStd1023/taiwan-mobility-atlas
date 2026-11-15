'use strict';
// Shared SVG map navigation. The geographic layers move together; overlays stay fixed.
(() => {
  function enableMap(svg) {
    const layer=svg.querySelector('.map-viewport'), wrap=svg.closest('.map-wrap');
    if(!layer||!wrap)return;
    const bounds=svg.viewBox.baseVal, width=bounds.width, height=bounds.height;
    let scale=1, x=0, y=0, moved=false, pinch=null;
    const pointers=new Map();
    const limit=(v,min,max)=>Math.max(min,Math.min(max,v));
    function paint(){
      x=limit(x,width-width*scale-width*.15,width*.15);
      y=limit(y,height-height*scale-height*.15,height*.15);
      layer.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);
      wrap.querySelector('[data-map-zoom-in]').disabled=scale>=8;
      wrap.querySelector('[data-map-zoom-out]').disabled=scale<=1;
      svg.dispatchEvent(new CustomEvent('mapviewchange',{detail:{scale,x,y,interacting:pointers.size>0}}));
    }
    function point(cx,cy){const p=svg.createSVGPoint();p.x=cx;p.y=cy;const m=svg.getScreenCTM();return m?p.matrixTransform(m.inverse()):{x:width/2,y:height/2}}
    function zoomAt(next,at){const newScale=limit(next,1,8),ratio=newScale/scale;x=at.x-(at.x-x)*ratio;y=at.y-(at.y-y)*ratio;scale=newScale;paint()}
    function reset(){scale=1;x=0;y=0;paint()}
    function beginPinch(){const [a,b]=[...pointers.values()];if(!a||!b)return;const p=point((a.cx+b.cx)/2,(a.cy+b.cy)/2);pinch={distance:Math.max(1,Math.hypot(a.cx-b.cx,a.cy-b.cy)),scale,worldX:(p.x-x)/scale,worldY:(p.y-y)/scale};moved=true}
    svg.addEventListener('wheel',e=>{e.preventDefault();zoomAt(scale*Math.exp(-limit(e.deltaY,-180,180)*.002),point(e.clientX,e.clientY))},{passive:false});
    svg.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(pointers.size===0)moved=false;
      pointers.set(e.pointerId,{cx:e.clientX,cy:e.clientY,startX:e.clientX,startY:e.clientY});
      try{e.target.setPointerCapture(e.pointerId)}catch(_){}
      if(pointers.size===2)beginPinch();
    });
    svg.addEventListener('pointermove',e=>{
      const previous=pointers.get(e.pointerId);if(!previous)return;
      const oldPoint=point(previous.cx,previous.cy);
      previous.cx=e.clientX;previous.cy=e.clientY;
      if(pointers.size>=2){
        if(!pinch)beginPinch();
        const [a,b]=[...pointers.values()],mid=point((a.cx+b.cx)/2,(a.cy+b.cy)/2);
        scale=limit(pinch.scale*Math.hypot(a.cx-b.cx,a.cy-b.cy)/pinch.distance,1,8);
        x=mid.x-pinch.worldX*scale;y=mid.y-pinch.worldY*scale;paint();return;
      }
      if(!moved&&Math.hypot(e.clientX-previous.startX,e.clientY-previous.startY)<5)return;
      moved=true;wrap.classList.add('map-dragging');
      const p=point(e.clientX,e.clientY);x+=p.x-oldPoint.x;y+=p.y-oldPoint.y;paint();
    });
    function end(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=null;wrap.classList.remove('map-dragging');if(pointers.size){const p=[...pointers.values()][0];p.startX=p.cx;p.startY=p.cy;moved=true}else paint()}
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    svg.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false}},{capture:true});
    svg.addEventListener('keydown',e=>{if(e.target!==svg)return;const step=30;if(e.key==='+'||e.key==='=')zoomAt(scale*1.3,{x:width/2,y:height/2});else if(e.key==='-'||e.key==='_')zoomAt(scale/1.3,{x:width/2,y:height/2});else if(e.key==='Home')reset();else if(e.key==='ArrowLeft')x+=step;else if(e.key==='ArrowRight')x-=step;else if(e.key==='ArrowUp')y+=step;else if(e.key==='ArrowDown')y-=step;else return;e.preventDefault();paint()});
    wrap.querySelector('[data-map-zoom-in]').addEventListener('click',()=>zoomAt(scale*1.4,{x:width/2,y:height/2}));
    wrap.querySelector('[data-map-zoom-out]').addEventListener('click',()=>zoomAt(scale/1.4,{x:width/2,y:height/2}));
    wrap.querySelector('[data-map-reset]').addEventListener('click',reset);
    paint();
  }
  document.querySelectorAll('svg[data-interactive-map]').forEach(enableMap);
})();
