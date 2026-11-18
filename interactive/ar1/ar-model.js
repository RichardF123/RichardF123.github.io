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
  const api={innovations,simulate,impulse,moments,acf,finiteVariances};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARModel=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);
