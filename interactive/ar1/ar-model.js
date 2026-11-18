(function(root) {
  'use strict';
  function innovations(seed,n=100){let a=seed>>>0;const u=()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};return Array.from({length:n},()=>Math.sqrt(-2*Math.log(1-u()))*Math.cos(2*Math.PI*u()));}
  function simulate({phi,phi2=0,sigma,c},noise){const x=[0];noise.forEach((z,i)=>x.push(c+phi*x[i]+phi2*(x[i-1]||0)+sigma*z));return x;}
  function impulse(phi,phi2,n=100){const psi=[1];for(let h=1;h<=n;h++)psi.push(phi*psi[h-1]+phi2*(psi[h-2]||0));return psi;}
  function moments(phi,phi2,sigma,c,n=12){
    const stable=Math.abs(phi2)<1&&phi+phi2<1&&phi2-phi<1;
    if(!stable)return{stable,mean:null,variance:null,rho:[],pacf:[],yw:null};
    const rho=[1,phi/(1-phi2)];for(let k=2;k<=n;k++)rho.push(phi*rho[k-1]+phi2*rho[k-2]);
    const variance=sigma*sigma/(1-phi*rho[1]-phi2*rho[2]);
    const pacf=[1];let previous=[],error=1;
    // Durbin-Levinson recursion on the normalized Yule-Walker equations.
    for(let k=1;k<=n;k++){let numerator=rho[k];for(let j=1;j<k;j++)numerator-=previous[j-1]*rho[k-j];const reflection=numerator/error;const next=Array.from({length:k},(_,j)=>j===k-1?reflection:previous[j]-reflection*previous[k-j-2]);pacf.push(Math.abs(reflection)<1e-12?0:reflection);error*=1-reflection*reflection;previous=next;}
    const determinant=1-rho[1]*rho[1];
    return{stable,mean:c/(1-phi-phi2),variance,rho,pacf,yw:[(rho[1]-rho[1]*rho[2])/determinant,(rho[2]-rho[1]*rho[1])/determinant]};
  }
  function acf(x,maxLag=12){const mean=x.reduce((a,b)=>a+b,0)/x.length,d=x.map(v=>v-mean),den=d.reduce((a,b)=>a+b*b,0);if(den<1e-14)return[];return Array.from({length:Math.min(maxLag+1,x.length)},(_,k)=>{let sum=0;for(let t=k;t<x.length;t++)sum+=d[t]*d[t-k];return sum/den;});}
  function finiteVariances(phi,phi2,sigma,n=100){let sum=0;return[0,...impulse(phi,phi2,n-1).map(v=>{sum+=sigma*sigma*v*v;return sum;})];}
  function pairs(x,k){
    if(!Number.isInteger(k)||k<0)throw new RangeError('lag must be a nonnegative integer');
    const mean=x.reduce((a,b)=>a+b,0)/x.length,denominator=x.reduce((sum,v)=>sum+(v-mean)**2,0),items=[];
    for(let t=k;t<x.length;t++){const a=x[t]-mean,b=x[t-k]-mean;items.push({t,current:x[t],past:x[t-k],a,b,product:a*b});}
    const numerator=items.reduce((sum,p)=>sum+p.product,0);
    return{mean,denominator,numerator,acf:denominator>1e-14&&items.length?numerator/denominator:null,items};
  }
  function ensemble(parameters,seed,t,count=80){
    const outcomes=Array.from({length:count},(_,i)=>simulate(parameters,innovations(seed+7919*(i+1),t))[t]);
    const mean=outcomes.reduce((a,b)=>a+b,0)/count;
    const sampleVariance=outcomes.reduce((sum,v)=>sum+(v-mean)**2,0)/(count-1);
    return{outcomes,mean,sampleVariance};
  }
  function varianceTerms(phi,sigma,t){
    const items=Array.from({length:Math.min(t,5)},(_,j)=>({j,weight:phi**j,contribution:sigma*sigma*phi**(2*j)}));
    if(t>5){const j=4;items[4]={j,tail:true,weight:null,contribution:sigma*sigma*Array.from({length:t-j},(_,i)=>phi**(2*(i+j))).reduce((a,b)=>a+b,0)};}
    return items;
  }
  function discreteAR1({phi,c=0,sigma=1},t){
    if(!Number.isInteger(t)||t<0||t>3)throw new RangeError('exact lesson supports t = 0, 1, 2, 3');
    let paths=[{noise:[],values:[0],value:0,probability:1}];
    for(let i=1;i<=t;i++)paths=paths.flatMap(path=>[-sigma,sigma].map(epsilon=>{const value=c+phi*path.value+epsilon;return{noise:[...path.noise,epsilon],values:[...path.values,value],value,probability:path.probability/2};}));
    const mean=paths.reduce((sum,p)=>sum+p.probability*p.value,0);
    const variance=paths.reduce((sum,p)=>sum+p.probability*(p.value-mean)**2,0);
    const grouped=new Map();paths.forEach(p=>{p.deviation=p.value-mean;p.squaredDeviation=p.deviation**2;const key=Math.round(p.value*1e10)/1e10;grouped.set(key,(grouped.get(key)||0)+p.probability);});
    return{t,paths,mean,variance,distribution:[...grouped].map(([value,probability])=>({value,probability})).sort((a,b)=>a.value-b.value)};
  }
  const api={innovations,simulate,impulse,moments,acf,finiteVariances,pairs,ensemble,varianceTerms,discreteAR1};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARModel=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);
