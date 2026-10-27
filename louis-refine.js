/* Local geometry refinement of the existing Louis bust. No image planes or textures.
   Hair, brows, eyes and scar are curves in the same model coordinates as the face. */
(() => {
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const smooth = (a,b,n) => {const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
  const norm = a => {const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
  const sculpt = (x,y,z) => {
    const jaw = Math.exp(-(((y-8)/5)**2)) * smooth(-1,4,z);
    return [x*(1.07+.05*jaw), y>5 ? 5+(y-5)*.92 : y,
      z-.34*Math.exp(-((x/2)**2+((y-13.5)/3)**2))*smooth(7,10,z)];
  };
  function details(V,F,N,low) {
    const segs=[];
    const push=(P,n,c=-.9)=>{for(let i=1;i<P.length;i++)segs.push([...P[i-1],...n,c,...P[i],...n,c]);};
    let seed=375;
    const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const hairline = p => 13.7+(6.0+.35*Math.cos(p[0]*.8))*smooth(-5,5,p[2])+1.1*smooth(4.5,7,Math.abs(p[0]));
    // Distribute short swept locks across the actual scalp triangles, weighted by area.
    const tris=[];let area=0;
    for(let i=0;i<F.length;i+=3){
      const ids=[F[i],F[i+1],F[i+2]],P=ids.map(k=>Array.from(V.slice(k*3,k*3+3)));
      const center=[0,1,2].map(k=>(P[0][k]+P[1][k]+P[2][k])/3);
      if(center[1]<hairline(center))continue;
      const a=P[1].map((v,k)=>v-P[0][k]),b=P[2].map((v,k)=>v-P[0][k]);
      const size=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])/2;
      area+=size;tris.push({ids,P,area});
    }
    for(let i=0;i<(low?500:1100);i++){
      const target=rnd()*area;let lo=0,hi=tris.length-1;
      while(lo<hi){const m=(lo+hi)>>1;if(tris[m].area<target)lo=m+1;else hi=m;}
      const tr=tris[lo];if(!tr)continue;
      const a=Math.sqrt(rnd()),b=rnd(),weights=[1-a,a*(1-b),a*b];
      const root=[0,1,2].map(k=>tr.P.reduce((sum,p,j)=>sum+p[k]*weights[j],0));
      if(root[1]<hairline(root))continue;
      const n=norm([0,1,2].map(k=>tr.ids.reduce((sum,id,j)=>sum+N[id*3+k]*weights[j],0)));
      const dir=[.65+(rnd()-.5)*.45,.65,-.5],dot=dir.reduce((s,v,k)=>s+v*n[k],0);
      const tangent=norm(dir.map((v,k)=>v-dot*n[k]));
      const side=norm([n[1]*tangent[2]-n[2]*tangent[1],n[2]*tangent[0]-n[0]*tangent[2],n[0]*tangent[1]-n[1]*tangent[0]]);
      const top=smooth(19,25,root[1]),length=.7+rnd()*(.8+top*.9),lift=.05+top*(.12+rnd()*.18),curl=(rnd()-.5)*.14;
      const P=[];
      for(let j=0;j<=8;j++){const t=j/8;P.push(root.map((v,k)=>v+tangent[k]*length*t+n[k]*(.06+lift*Math.sin(Math.PI*t)-.12*t*t)+side[k]*curl*Math.sin(Math.PI*t)));}
      push(P,n);
    }
    // Front-surface sampling: accessories sit on the face and rotate/occlude with it.
    const front=(x,y)=>{
      let best=-Infinity;
      for(let i=0;i<F.length;i+=3){
        const a=F[i]*3,b=F[i+1]*3,c=F[i+2]*3;
        const den=(V[b+1]-V[c+1])*(V[a]-V[c])+(V[c]-V[b])*(V[a+1]-V[c+1]);
        if(Math.abs(den)<1e-7)continue;
        const u=((V[b+1]-V[c+1])*(x-V[c])+(V[c]-V[b])*(y-V[c+1]))/den;
        const v=((V[c+1]-V[a+1])*(x-V[c])+(V[a]-V[c])*(y-V[c+1]))/den;
        if(u>=0&&v>=0&&u+v<=1)best=Math.max(best,u*V[a+2]+v*V[b+2]+(1-u-v)*V[c+2]);
      }
      return best;
    };
    const faceCurve=xy=>{let points=[];for(const [x,y] of xy){const z=front(x,y);if(Number.isFinite(z))points.push([x,y,z+.12]);}if(points.length>1)push(points,[0,.15,.99],-.65);};
    for(const sign of [-1,1]){
      // A restrained brow, with short strokes rather than a filled strip.
      for(let k=0;k<(low?14:24);k++){
        const u=k/(low?13:23),x=sign*(1.35+u*3.4),y=17.4+.38*Math.sin(Math.PI*u)-.2*u;
        faceCurve([[x,y],[x+sign*.2,y+.15],[x+sign*.32,y+.19]]);
      }
    }
    // Small iris rings are surface curves; no opaque pupils or photo textures.
    for(const sign of [-1,1]) {
      const iris=[];
      for(let j=0;j<=24;j++){const a=j/24*Math.PI*2;iris.push([sign*3.1+.32*Math.cos(a),15.15+.23*Math.sin(a)]);}
      faceCurve(iris);
    }
    // Two front collar seams, fitted to the torso surface.
    for(let band=0;band<2;band++) {
      const seam=[];
      for(let j=0;j<=48;j++){const a=(j/48-.5)*Math.PI;seam.push([5.5*Math.sin(a),2.4+band*.22-1.2*Math.cos(a)]);}
      faceCurve(seam);
    }
    // Louis's left brow scar (viewer right), deliberately finer than the silhouette.
    faceCurve([[4.25,18.2],[4.32,17.92],[4.22,17.63],[4.34,17.37]]);
    return segs;
  }
  window.LOUIS_REFINE={sculpt,details};
})();
