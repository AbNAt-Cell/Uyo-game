'use client';
import { useEffect, useMemo, useState } from 'react';
import GameCanvas from './GameCanvas';
import type { Landmark, WorldPayload, WorldPoi } from '@/lib/types';
import { seedLandmarks } from '@/data/landmarks';
import { projectLatLng } from '@/lib/geo';

function cleanName(v:string){return v.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
const aliases:Record<string,string[]>={
  'ibom-plaza':['ibom plaza'],
  'stadium':['godswill akpabio international stadium','akwa ibom international stadium','nest of champions'],
  'tropicana':['ibom tropicana','ibom tropicana entertainment centre'],
  'uniuyo':['university of uyo','uniuyo'],
  'secretariat':['akwa ibom state secretariat','idongesit nkanga secretariat'],
  'ibom-hall':['ibom hall']
};

function poiScore(lm:Landmark,p:WorldPoi){
  const targets=[lm.name,...(aliases[lm.id]||[])].map(cleanName);
  const name=cleanName(p.name);
  let best=0;
  for(const target of targets){
    if(name===target) best=Math.max(best,1);
    else if(name.includes(target)||target.includes(name)) best=Math.max(best,.84);
    else{
      const words=target.split(' ').filter(w=>w.length>3);
      if(words.length){
        const hit=words.filter(w=>name.includes(w)).length/words.length;
        best=Math.max(best,hit*.74);
      }
    }
  }
  return best;
}

export default function GameShell(){
  const [landmarks,setLandmarks] = useState<Landmark[]>(seedLandmarks);
  const [world,setWorld] = useState<WorldPayload|null>(null);
  const [worldError,setWorldError] = useState('');
  const [selected,setSelected] = useState<Landmark|null>(null);
  const [cash,setCash] = useState(43500);
  const [energy,setEnergy] = useState(82);
  const [rep,setRep] = useState(0);
  const [network,setNetwork] = useState(6);
  const [message,setMessage] = useState('You just arrived. Walk around and make your first move.');

  useEffect(()=>{
    Promise.all([
      fetch('/api/admin/landmarks').then(r=>r.ok?r.json():null),
      fetch('/api/world/uyo').then(async r=>{
        if(!r.ok){
          const err=await r.json().catch(()=>({}));
          throw new Error(err.error||'Could not load Uyo');
        }
        return r.json();
      })
    ]).then(([landmarkData,worldData])=>{
      if(Array.isArray(landmarkData)&&landmarkData.length) setLandmarks(landmarkData);
      setWorld(worldData);
    }).catch(err=>setWorldError(err instanceof Error?err.message:'Could not load Uyo geography.'));
  },[]);

  const placedLandmarks=useMemo(()=>{
    if(!world) return landmarks;
    return landmarks.map(lm=>{
      if(Number.isFinite(lm.lat)&&Number.isFinite(lm.lng)){
        const p=projectLatLng(Number(lm.lat),Number(lm.lng),world.bbox,world.world.width,world.world.height);
        return {...lm,gameX:p.x,gameY:p.y};
      }
      let best:WorldPoi|null=null,bestScore=0;
      for(const poi of world.pois){
        const score=poiScore(lm,poi);
        if(score>bestScore){bestScore=score;best=poi;}
      }
      return best&&bestScore>=.72 ? {...lm,gameX:best.x,gameY:best.y,lat:best.lat,lng:best.lng,osmType:best.osmType,osmId:best.osmId} : lm;
    });
  },[landmarks,world]);

  function interact(lm:Landmark){
    const costs:Record<string,number>={social:3500,study:1200,event:4500,housing:0,career:0,commerce:1200,network:1500};
    const gains:Record<string,[number,number,number,number]>={
      social:[0,-6,3,3], study:[0,-8,2,1], event:[4500,-10,3,2], housing:[0,-2,1,1], career:[7000,-11,2,2], commerce:[3500,-8,2,1], network:[0,-5,2,4]
    };
    const cost=costs[lm.interaction]??0;
    if(cash<cost){setMessage('Your account balance said no. Find a cheaper move.'); return;}
    const [income,e,r,n]=gains[lm.interaction]??[1000,-5,1,1];
    setCash(v=>v-cost+income); setEnergy(v=>Math.max(0,Math.min(100,v+e))); setRep(v=>Math.min(100,v+r)); setNetwork(v=>v+n);
    setMessage(lm.name+': move completed. People are starting to remember you.');
  }

  return <>
    <section className="card" style={{padding:12, marginBottom:12}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:8}}>
        {[[`₦${cash.toLocaleString()}`,'Cash'],[energy,'Energy'],[rep,'Reputation'],[network,'Network']].map(([v,l])=><div key={l} style={{padding:'8px 10px', minWidth:0}}><div className="muted" style={{fontSize:12}}>{l}</div><strong style={{fontSize:18, overflowWrap:'anywhere'}}>{v}</strong></div>)}
      </div>
    </section>

    <section style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(250px,330px)', gap:12}} className="game-layout">
      <GameCanvas landmarks={placedLandmarks} world={world} onSelect={setSelected}/>
      <aside className="card" style={{padding:16, alignSelf:'start'}}>
        <div className="muted" style={{fontSize:12,fontWeight:800,textTransform:'uppercase'}}>Amebo feed</div>
        <p style={{lineHeight:1.5}}>{message}</p>
        {world?<p className="muted" style={{fontSize:12,lineHeight:1.5}}>Real Uyo layer: {world.counts.roads} roads · {world.counts.buildings} buildings · {world.counts.pois} named places.<br/>{world.attribution}</p>:<p className="muted" style={{fontSize:12}}>{worldError||'Loading Uyo streets and buildings…'}</p>}
        <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'16px 0'}}/>
        {selected ? <>
          <div className="muted" style={{fontSize:12}}>{selected.category.toUpperCase()}</div>
          <h2 style={{margin:'4px 0 8px'}}>{selected.name}</h2>
          <p className="muted" style={{lineHeight:1.5}}>{selected.description}</p>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={()=>interact(selected)}>Do something here</button>
        </> : <p className="muted">Click a place or walk around Uyo. On desktop you can also click the ground to walk there.</p>}
      </aside>
    </section>
    <style jsx>{`@media(max-width:760px){.game-layout{grid-template-columns:1fr !important}}`}</style>
  </>;
}
