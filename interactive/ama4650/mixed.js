document.querySelectorAll('article code').forEach(node=>katex.render(node.textContent,node,{throwOnError:true}));
const choice=document.getElementById('choice'),tiles=document.getElementById('tiles'),reading=document.getElementById('reading');
function update(){const n=Number(choice.value),arma=document.body.dataset.unit==='arma';let a,start;
if(arma){a=[1,.5+n];while(a.length<5)a.push(a.at(-1)*.5);start=0;reading.textContent='第 1 期：0.5 × 1 + ('+n+') × 1 = '+a[1]+'。'+(a[1]===0?'两条路完全抵消，此后没有差异。':'从第 2 期起只剩 AR 传递，每期是上一期的一半。');}
else{a=[20,23,25,29,32];start=1+n;for(let j=0;j<n;j++)a=a.slice(1).map((v,k)=>v-a[k]);reading.textContent=['第 5 期直接读取 32；d = 0，没有损失起始观测。','第 5 期增量是 32 − 29 = 3。第 1 期没有前值，剩下四个增量。','最后两个增量是 4 和 3，所以第 5 期的二阶差分是 3 − 4 = −1。负的是增量的变化，并不是计数器倒退。'][n];}
tiles.replaceChildren(...a.map((v,j)=>{const el=document.createElement('div'),t=document.createElement('small'),b=document.createElement('strong');t.textContent='第 '+(start+j)+' 期';b.textContent=v;el.append(t,b);return el}));}
choice.addEventListener('change',update);update();
