import * as THREE from './vendor/three.module.min.js';

const host = document.getElementById('block-stage');
const canvas = document.getElementById('blocks');
const labels = document.getElementById('block-labels');
const sceneHost = document.querySelector('.visual-scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'low-power', preserveDrawingBuffer:true});
} catch (_) {
  // The existing 2D lesson remains available on devices without WebGL.
  host.hidden = true;
}
if (renderer) {
  renderer.setClearColor('#f7eccf');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8,8,5,-5,.1,100);
  camera.position.set(9,14,18);
  camera.lookAt(0,.9,0);
  scene.add(new THREE.AmbientLight(0xffffff,2.4));
  const light = new THREE.DirectionalLight(0xffffff,2.7);
  light.position.set(-3,12,8);scene.add(light);
  const grid = new THREE.GridHelper(28,28,0xbda879,0xd8c6a2);
  grid.material.transparent=true;grid.material.opacity=.48;grid.position.y=-.03;scene.add(grid);
  const group=new THREE.Group();scene.add(group);
  const labelItems=[];
  let raf=0, tick=0, start=0, current=null, tokens=[];
  const compact=v=>Math.abs(v)>=1000?v.toExponential(0):v.toFixed(Math.abs(v)>=10?1:3);

  function cube(x,z,width,height,depth,color,base=.02) {
    const geometry=new THREE.BoxGeometry(width,height,depth);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color}));
    mesh.position.set(x,base+height/2,z);group.add(mesh);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0x816441,transparent:true,opacity:.78}));
    mesh.add(outline);
    return mesh;
  }
  function label(x,z,y,title,value,kind='',small='') {
    const el=document.createElement('div');el.className='block-label '+kind;
    const caption=document.createElement('span');caption.textContent=title;
    el.append(caption);
    (Array.isArray(value)?value:[value]).forEach(v=>{const number=document.createElement('strong');number.textContent=v;el.append(number);});
    if(Array.isArray(value))el.classList.add('multi-value');
    if(small){const note=document.createElement('small');note.textContent=small;el.append(note);}
    labels.append(el);labelItems.push({el,position:new THREE.Vector3(x,y,z)});
  }
  function node(x,z,color,title,value,kind,small) {
    cube(x,z,1.9,.23,1.6,color);
    cube(x,z,.94,.5,.8,color,.25);
    label(x,z,1.2,title,value,kind,small);
  }
  function connect(from,to,color) {
    const a=new THREE.Vector3(from[0],.31,from[1]);
    const b=new THREE.Vector3(to[0],.31,to[1]);
    const direction=b.clone().sub(a);
    const arrow=new THREE.ArrowHelper(direction.clone().normalize(),a,direction.length(),color,.18,.12);
    group.add(arrow);
    const token=cube(a.x,a.z,.18,.16,.18,color,.25);
    tokens.push({mesh:token,a,b});
  }
  function disposeGroup() {
    while(group.children.length){const child=group.children[0];group.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});}
    labelItems.length=0;labels.replaceChildren();tokens=[];
  }
  function build(s) {
    current=s;disposeGroup();host.hidden=s.lesson===3;
    sceneHost.classList.toggle('has-blocks',s.lesson!==3);
    host.classList.toggle('is-timeline',s.lesson===1||s.lesson===2||s.lesson===5);
    if(s.lesson===3)return;
    if(s.lesson===0||s.lesson===4){
      const previous=s.n?s.values[s.n-1]:0;
      const previous2=s.n>1?s.values[s.n-2]:0;
      const shock=s.n?s.sigma*s.innovations[s.n-1]:0;
      node(-3.8,1,0xd7c392,s.lesson===4?'过去两刻':'上一刻',s.lesson===4?[`X${Math.max(0,s.n-1)}: ${compact(previous)}`,`X${Math.max(0,s.n-2)}: ${compact(previous2)}`]:s.n?compact(previous):'—','positive',s.lesson===4?'两阶滞后':s.n?`X${s.n-1}`:'尚未递推');
      node(0,1,0xc8b58b,s.lesson===4?'两份记忆相加':`× φ = ${s.phi.toFixed(2)}`,s.n?compact(s.phi*previous+(s.lesson===4?s.phi2*previous2:0)):'—','positive',s.lesson===4?'φ₁Xₜ₋₁ + φ₂Xₜ₋₂':'过去留下的部分');
      node(0,-3.8,0xdba69a,'新冲击 + 常数',s.n?compact(shock+s.c):'—','negative',`ε${s.n} + c`);
      node(3.8,1,0xb9c2cf,'这一刻',compact(s.values[s.n]),'',`X${s.n}`);
      connect([-2.75,1],[-1.05,1],0x96763e);
      connect([0,-2.8],[2.8,.55],0x9e594a);
      connect([1.05,1],[2.75,1],0x96763e);
      canvas.setAttribute('aria-label',`AR(1)方块图。上一刻 ${compact(previous)}，乘以 ${s.phi} 留下 ${compact(s.phi*previous)}，新冲击与常数合计 ${compact(shock+s.c)}，得到 ${compact(s.values[s.n])}。`);
    }else{
      const pacf=s.lesson===5,defined=!pacf||(s.moments.stable&&s.sigma>0);
      const times=pacf?[1,2,3,4,5,6,7]:s.lesson===1?[0,1,2,3,4,5,6]:[0,1,4,8,16,32,100];
      const numbers=times.map(h=>pacf?(defined?s.moments.pacf[h]:0):s.lesson===1?s.phi**h:s.finiteVariances[h]);
      const bound=Math.max(1,...numbers.map(Math.abs));
      times.forEach((h,i)=>{
        const value=numbers[i],x=(i-3)*1.8;
        const visible=h<=s.n&&defined;
        const color=visible?(value<0?0xd4a297:0xd0b77a):0xe7decb;
        cube(x,0,1.35,.16,1.3,0xe9dec4);
        const height=.04+Math.abs(value)/bound*1.8;
        cube(x,0,.82,height,.8,color,.18);
        label(x,0,height+.54,(pacf?'k = ':s.lesson===1?'h = ':'t = ')+h,visible?(Math.abs(value)>=1000?value.toExponential(0):value.toFixed(2)):defined?'·':'未定义',(!visible?'future':value<0?'negative':'positive'));
      });
      canvas.setAttribute('aria-label',pacf?(defined?`总体 PACF，小方块展示 k = 1 到 7，前两阶为 ${s.moments.pacf[1]}、${s.moments.pacf[2]}，后续阶数为零。`:'当前参数下总体 PACF 未定义。'):s.lesson===1?`冲击响应小方块，已经走到 h = ${s.n}，影响为 phi 的 h 次幂；酒红色表示负值，方块高度表示绝对值。`:`方差累积小方块，展示 t = ${times.join('、')} 的理论方差；高度按本图最大值缩放。`);
    }
    start=performance.now();resize();
    if(!reduced.matches&&(s.lesson===0||s.lesson===4)&&s.n>0)animate();
  }
  function render() {
    if(!current||host.hidden)return;
    renderer.render(scene,camera);tick++;
    const w=host.clientWidth,h=host.clientHeight;
    labelItems.forEach(item=>{const p=item.position.clone().project(camera);item.el.style.left=((p.x+1)*w/2)+'px';item.el.style.top=((-p.y+1)*h/2)+'px';});
  }
  function resize() {
    if(host.hidden)return;
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    const halfW=Math.max(6.7,4.8*w/h),halfH=halfW*h/w;
    camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();render();
  }
  function animate() {
    if(raf)cancelAnimationFrame(raf);
    const step=now=>{
      raf=0;if(document.hidden||host.hidden)return;
      const t=Math.min(1,(now-start)/750);
      tokens.forEach((token,i)=>{const p=Math.min(1,Math.max(0,t*1.3-i*.12));token.mesh.position.lerpVectors(token.a,token.b,p);});
      render();if(t<1)raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
  }
  window.addEventListener('ar1:change',()=>{if(window.AR1Demo)build(window.AR1Demo.snapshot());});
  new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}});
  window.AR1Blocks=Object.freeze({snapshot:()=>({renders:tick,nodes:labelItems.length,lesson:current?.lesson,webgl:true})});
  if(window.AR1Demo)build(window.AR1Demo.snapshot());
}
