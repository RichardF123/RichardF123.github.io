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
    const caption=document.createElement('span');caption.textContent=typeof title==='object'?title.text:title;
    el.append(caption);
    if(typeof title==='object'){const symbol=document.createElement('div');symbol.className='block-label__symbol';symbol.dataset.symbol=title.tex;window.katex.render(title.tex,symbol,{throwOnError:false,output:'htmlAndMathml'});el.append(symbol);}
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
    current=s;disposeGroup();host.hidden=s.lesson===3||s.lesson===2;
    camera.lookAt(0,s.lesson===0?1.9:.9,0);
    sceneHost.classList.toggle('has-blocks',s.lesson!==3&&s.lesson!==2);
    host.classList.toggle('is-timeline',s.lesson===1||s.lesson===2||s.lesson===5);
    host.classList.toggle('is-variance',s.lesson===2);
    host.classList.toggle('is-variance-few',s.lesson===2&&s.n<=4);
    if(s.lesson===3||s.lesson===2)return;
    if(s.lesson===0||s.lesson===4){
      const previous=s.n?s.values[s.n-1]:0;
      const previous2=s.n>1?s.values[s.n-2]:0;
      const shock=s.n?s.sigma*s.innovations[s.n-1]:0;
      node(-3.8,1,0xd7c392,s.lesson===4?'过去两刻':{text:'上一刻',tex:String.raw`X_{t-1}`},s.lesson===4?[`X${Math.max(0,s.n-1)}: ${compact(previous)}`,`X${Math.max(0,s.n-2)}: ${compact(previous2)}`]:s.n?compact(previous):'—','positive',s.lesson===4?'两阶滞后':`本次 t = ${s.n}`);
      node(0,1,0xc8b58b,s.lesson===4?'两份记忆相加':{text:'过去留下的部分',tex:String.raw`\phi X_{t-1}`},s.n?compact(s.phi*previous+(s.lesson===4?s.phi2*previous2:0)):'—','positive',s.lesson===4?'φ₁Xₜ₋₁ + φ₂Xₜ₋₂':`φ = ${s.phi.toFixed(2)}`);
      node(0,-3.8,0xdba69a,s.lesson===4?'新冲击 + 常数':{text:'本期新噪声',tex:String.raw`\varepsilon_t`},s.n?compact(shock+(s.lesson===4?s.c:0)):'—','negative',s.lesson===4?`ε${s.n} + c`:`本次 t = ${s.n}`);
      if(s.lesson===0){labelItems.at(-1).lift=56;labelItems.at(-1).el.classList.add('has-leader');}
      node(3.8,1,0xb9c2cf,s.lesson===4?'这一刻':{text:'这一刻',tex:String.raw`X_t`},compact(s.values[s.n]),'',s.lesson===4?`X${s.n}`:`本次 t = ${s.n}`);
      if(s.lesson===0){node(3.8,-3.8,0xd9c49a,{text:'单独的常数项',tex:'c'},compact(s.c),'','每一步相同');labelItems.at(-1).lift=56;labelItems.at(-1).el.classList.add('has-leader');connect([3.8,-2.8],[3.8,0],0x96763e);}
      connect([-2.75,1],[-1.05,1],0x96763e);
      connect([0,-2.8],[2.8,.55],0x9e594a);
      connect([1.05,1],[2.75,1],0x96763e);
      canvas.setAttribute('aria-label',s.lesson===0?`AR(1)方块图与公式使用同一组符号 X_t、X_(t-1)、phi X_(t-1)、epsilon_t、c。当前噪声 ${compact(shock)} 和常数 ${compact(s.c)} 分开显示。`:`AR(2) 递推方块图：过去两刻、新冲击和常数共同生成当前值。`);
    }else{
      const pacf=s.lesson===5,isVariance=s.lesson===2,defined=!pacf||(s.moments.stable&&s.sigma>0);
      const contributions=isVariance?window.ARModel.varianceTerms(s.phi,s.sigma,s.n):[];
      const times=pacf?[1,2,3,4,5,6,7]:isVariance?(contributions.length?contributions.map(v=>v.j):[0]):[0,1,2,3,4,5,6];
      const numbers=times.map((h,i)=>pacf?(defined?s.moments.pacf[h]:0):isVariance?(contributions[i]?.contribution||0):s.phi**h);
      const bound=Math.max(1,...numbers.map(Math.abs));
      times.forEach((h,i)=>{
        const spacing=isVariance?10.8/Math.max(1,times.length-1):1.8;
        const value=numbers[i],x=(i-(times.length-1)/2)*spacing;
        const visible=(isVariance||h<=s.n)&&defined;
        const color=visible?(value<0?0xd4a297:0xd0b77a):0xe7decb;
        cube(x,0,1.35,.16,1.3,0xe9dec4);
        const height=.04+Math.abs(value)/bound*1.8;
        cube(x,0,.82,height,.8,color,.18);
        const title=isVariance?(s.n===0?'尚未加入噪声':contributions[i]?.tail?'更早各项合计':`j = ${h} 的贡献`):(pacf?'k = ':'j = ')+h;
        label(x,0,height+.54,title,visible?(isVariance?(value>=100?value.toExponential(1):value.toFixed(value>=10?2:4)):(Math.abs(value)>=1000?value.toExponential(0):value.toFixed(2))):defined?'·':'未定义',(!visible?'future':value<0?'negative':'positive'));
      });
      canvas.setAttribute('aria-label',pacf?(defined?`总体 PACF，小方块展示 k = 1 到 7，前两阶为 ${s.moments.pacf[1]}、${s.moments.pacf[2]}，后续阶数为零。`:'当前参数下总体 PACF 未定义。'):s.lesson===1?`白噪声表示系数，已经展开到 j = ${s.n}，系数为 phi 的 j 次幂；酒红色表示负值，方块高度表示绝对值。`:`t = ${s.n} 时各期噪声的方差贡献；每项权重平方后乘冲击方差，总和 ${s.finiteVariances[s.n]}；高度按本图最大值缩放。`);
    }
    start=performance.now();resize();
    if(!reduced.matches&&(s.lesson===0||s.lesson===4)&&s.n>0)animate();
  }
  function render() {
    if(!current||host.hidden)return;
    renderer.render(scene,camera);tick++;
    const w=host.clientWidth,h=host.clientHeight;
    labelItems.forEach(item=>{const p=item.position.clone().project(camera),anchor=(-p.y+1)*h/2;item.el.style.left=((p.x+1)*w/2)+'px';const bottom=Math.max(item.el.offsetHeight+8,anchor-(item.lift||0));item.el.style.top=bottom+'px';item.el.style.setProperty('--leader-height',Math.max(0,anchor-bottom)+'px');});
  }
  function resize() {
    if(host.hidden)return;
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    const halfW=Math.max(current?.lesson===0?7.2:6.7,4.8*w/h),halfH=halfW*h/w;
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
