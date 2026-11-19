import * as THREE from '/interactive/ar1/vendor/three.module.min.js';
const unit=document.body.dataset.unit,vol=unit==='volatility';
for(const key of vol?['arch','garch']:['rec']){
 const anchor=vol?document.querySelector('#'+key+' .lab-terms'):document.getElementById('rec-blocks');
 const host=document.createElement('figure'),stage=document.createElement('div'),canvas=document.createElement('canvas'),overlay=document.createElement('div'),caption=document.createElement('figcaption');
 host.className='model-block-scene';stage.className='model-block-stage';overlay.className='model-block-labels';canvas.setAttribute('role','img');stage.append(canvas,overlay);host.append(stage,caption);anchor.before(host);
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true})}catch(_){host.hidden=true;continue}
 renderer.setClearColor('#f7eccf');renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-7,7,6,-6,.1,100),group=new THREE.Group();
 camera.position.set(0,13,18);camera.lookAt(0,0,0);scene.add(group,new THREE.AmbientLight(0xffffff,2.4));
 const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(-5,12,8);scene.add(light);
 const grid=new THREE.GridHelper(18,18,0xc4ac83,0xe0cfac);grid.position.y=-.1;scene.add(grid);
 let labels=[],tokens=[],raf=0;
 function render(){renderer.render(scene,camera);labels.forEach(o=>{o.el.style.width=Math.min(stage.clientWidth<600?82:115,stage.clientWidth*.25)+'px';const p=o.p.clone().project(camera);o.el.style.left=((p.x+1)*stage.clientWidth/2)+'px';o.el.style.top=Math.max(o.el.offsetHeight+10,Math.min(stage.clientHeight-10,(-p.y+1)*stage.clientHeight/2))+'px'});if(labels.length===4){const middle=labels[1].el,result=labels[3].el,minBottom=parseFloat(middle.style.top)+result.offsetHeight+12;result.style.top=Math.max(parseFloat(result.style.top),minBottom)+'px'}}
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w)return;renderer.setSize(w,h,false);const halfW=Math.max(7,4.8*w/h);camera.left=-halfW;camera.right=halfW;camera.top=halfW*h/w;camera.bottom=-halfW*h/w;camera.updateProjectionMatrix();render()}
 function draw(){
 const a=Number(document.getElementById(vol?'a':'ra').value),b=Number(document.getElementById(vol?'beta':'rb').value);
 let terms,result,note;
 if(key==='arch'){
 terms=[['常数','\\omega',.5],['冲击平方','\\alpha_1a_{t-1}^2',.5*a*a],['无第三项','0',0]];
 result=['条件方差','\\sigma_t^2',.5+.5*a*a];note='左侧常数与中间的昨日冲击贡献相加，得到下方的条件方差；ARCH 没有额外的滞后方差项。再开方乘当期 ε，才生成残差。';
 }else if(key==='garch'){
 const h=Number(document.querySelector('.lab-stepper strong').textContent.match(/\d+/)[0]),r=.2+b,prev=h===1?1:1+1.6*r**(h-2),shock=h===1?9:prev;
 terms=[['常数','\\omega',1-r],['冲击贡献',h===1?'\\alpha a_t^2':'\\alpha H_{h-1}',.2*shock],['方差记忆',h===1?'\\beta\\sigma_t^2':'\\beta H_{h-1}',b*prev]];
 result=['方差预测','H_{'+h+'}',1+1.6*r**(h-1)];note=h===1?'第 1 步用已知的今日冲击平方 9 和方差 1。':'未来冲击平方用条件期望替代，因此当前是预测，不是模拟路径。';
 }else{
 const k=Number(document.getElementById('period').textContent.match(/\d+/)[0]);let prev=unit==='arma'?1:3;
 for(let j=1;j<k;j++)prev=a*prev+(j===1?b*(unit==='arma'?1:2):0);
 const z=k===1?(unit==='arma'?1:2):0;
 terms=[['AR 传递','\\alpha('+Number(prev.toFixed(3))+')',a*prev],['当期创新',unit==='arma'?'u_k':'E_t[Z_{t+k}]',0],['MA 传递','\\beta('+z+')',b*z]];
 result=[unit==='arma'?'本期路径差':'预测增量',unit==='arma'?'D_{'+k+'}':'\\widehat Y_t('+k+')',a*prev+b*z];note=unit==='arma'?'当期创新差为零，并非原始过程没有新的创新。':'输出是增量，再加上一步水平才得到水平预测，见下方双图。';
 }
 if(raf)cancelAnimationFrame(raf);
 for(const child of [...group.children]){group.remove(child);child.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}
 labels=[];tokens=[];overlay.replaceChildren();
 function node(x,z,[title,tex,v]){
 const height=.12+Math.min(Math.abs(v)/(vol?5:4),1)*1.7,geom=new THREE.BoxGeometry(1.5,height,1.3);
 const cube=new THREE.Mesh(geom,new THREE.MeshLambertMaterial({color:v<0?0xb46c68:0xc6a464}));cube.position.set(x,height/2,z);group.add(cube);
 cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom),new THREE.LineBasicMaterial({color:0x7f6247})));
 const el=document.createElement('div');el.className='model-block-label';const titleEl=document.createElement('small'),symbol=document.createElement('div'),num=document.createElement('strong');titleEl.textContent=title;num.textContent=Number(v.toFixed(3));katex.render(tex,symbol,{throwOnError:true});el.append(titleEl,symbol,num);overlay.append(el);labels.push({el,p:new THREE.Vector3(x,2.4,z)});
 }
 terms.forEach((t,j)=>node((j-1)*4,-2,t));node(0,3,result);
 terms.forEach((_,j)=>{const from=new THREE.Vector3((j-1)*4,.12,-.8),to=new THREE.Vector3(0,.12,2.2),d=to.clone().sub(from);group.add(new THREE.ArrowHelper(d.clone().normalize(),from,d.length(),0x89664a,.3,.18));const dot=new THREE.Mesh(new THREE.BoxGeometry(.17,.17,.17),new THREE.MeshLambertMaterial({color:0x985047}));group.add(dot);tokens.push({dot,from,to})});
 caption.textContent=note+' 上排是各项输入，下排是相加结果。数字给出确切数值；方块高度表示绝对值，酒红表示负值，连续切换步数时尺度不变。';
 canvas.setAttribute('aria-label',terms.map(t=>t[0]+' '+t[2].toFixed(3)).join('，')+'，输出 '+result[2].toFixed(3));
 resize();const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function animate(now){const t=reduced?1:Math.min(1,(now-start)/650);tokens.forEach(o=>o.dot.position.lerpVectors(o.from,o.to,t));render();if(t<1)raf=requestAnimationFrame(animate)}
 raf=requestAnimationFrame(animate);
 }
 new ResizeObserver(resize).observe(stage);const scope=vol?document.getElementById(key):document.querySelector('.rec-lab');
 scope.addEventListener('input',draw);scope.addEventListener('click',e=>{if(e.target.closest('button'))draw()});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf)});draw();
}

