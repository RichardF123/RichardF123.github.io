(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TimeCourseModel=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function ses(data,alpha,initial){let level=initial;return data.map((x,i)=>{const before=level;level=alpha*x+(1-alpha)*before;return{t:i+1,x,before,level,error:x-before};});}
  function brown(data,alpha,s0,ss0){let s=s0,ss=ss0;return data.map((x,i)=>{s=alpha*x+(1-alpha)*s;ss=alpha*s+(1-alpha)*ss;return{t:i+1,x,s,ss,level:2*s-ss,trend:alpha/(1-alpha)*(s-ss)};});}
  function holt(data,alpha,beta,initial,trend,mode='linear',damping=1){let l=initial,b=trend;return data.map((x,i)=>{const old=l,oldb=b,prior=mode==='exponential'?old*oldb:old+damping*oldb;l=alpha*x+(1-alpha)*prior;b=mode==='exponential'?beta*(l/old)+(1-beta)*oldb:beta*(l-old)+(1-beta)*damping*oldb;return{t:i+1,x,before:prior,level:l,trend:b};});}
  function dampSum(d,h){return d===1?h:d*(1-d**h)/(1-d);}
  function winters(data,alpha,beta,gamma,initial,trend,season,mode='additive',damping=1){let l=initial,b=trend;const seasons=[...season],m=season.length;return data.map((x,i)=>{const phase=i%m,previous=seasons[phase],old=l,prior=old+damping*b;l=alpha*(mode==='additive'?x-previous:x/previous)+(1-alpha)*prior;b=beta*(l-old)+(1-beta)*damping*b;seasons[phase]=gamma*(mode==='additive'?x-prior:x/prior)+(1-gamma)*previous;return{t:i+1,x,level:l,trend:b,previous,season:seasons[phase],seasons:[...seasons],mode,m};});}
  function seasonalForecast(row,h,d=1){const s=row.seasons[(row.t+h-1)%row.m],base=row.level+dampSum(d,h)*row.trend;return row.mode==='additive'?base+s:base*s;}
  function maMoments(theta,sigma=1){const g=Array.from({length:theta.length},(_,k)=>sigma**2*theta.slice(k).reduce((a,v,i)=>a+theta[i]*v,0));return{gamma:g,rho:g.map(v=>g[0]>0?v/g[0]:null)};}
  function overlap(theta,k){return theta.flatMap((v,i)=>{const j=i-k;return j>=0&&j<theta.length?[{i,j,left:v,right:theta[j],product:v*theta[j]}]:[];});}
  function ma2Roots(a,b){if(Math.abs(b)<1e-12)return Math.abs(a)<1e-12?[]:[{re:-1/a,im:0,mod:Math.abs(1/a)}];const disc=a*a-4*b;if(disc>=0)return[-1,1].map(sign=>{const re=(-a+sign*Math.sqrt(disc))/(2*b);return{re,im:0,mod:Math.abs(re)};});const re=-a/(2*b),im=Math.sqrt(-disc)/(2*Math.abs(b));return[-1,1].map(sign=>({re,im:sign*im,mod:Math.hypot(re,im)}));}
  return Object.freeze({ses,brown,holt,dampSum,winters,seasonalForecast,maMoments,overlap,ma2Roots});
});
