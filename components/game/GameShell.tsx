'use client';
import { useEffect, useState } from 'react';
import GameCanvas from './GameCanvas';
import type { Landmark } from '@/lib/types';
import { seedLandmarks } from '@/data/landmarks';

export default function GameShell(){
  const [landmarks,setLandmarks] = useState<Landmark[]>(seedLandmarks);
  const [selected,setSelected] = useState<Landmark|null>(null);
  const [cash,setCash] = useState(43500);
  const [energy,setEnergy] = useState(82);
  const [rep,setRep] = useState(0);
  const [network,setNetwork] = useState(6);
  const [message,setMessage] = useState('You just arrived. Walk around and make your first move.');

  useEffect(()=>{
    fetch('/api/admin/landmarks').then(r=>r.ok?r.json():null).then(data=>{
      if(Array.isArray(data) && data.length) setLandmarks(data);
    }).catch(()=>{});
  },[]);

  function interact(lm:Landmark){
    const costs:Record<string,number>={social:3500,study:1200,event:4500,housing:0,career:0,commerce:1200,network:1500};
    const gains:Record<string,[number,number,number,number]>={
      social:[0,-6,3,3], study:[0,-8,2,1], event:[4500,-10,3,2], housing:[0,-2,1,1], career:[7000,-11,2,2], commerce:[3500,-8,2,1], network:[0,-5,2,4]
    };
    const cost=costs[lm.interaction]??0;
    if(cash<cost){setMessage('Your account balance said no. Find a cheaper move.'); return;}
    const [income,e,r,n]=gains[lm.interaction]??[1000,-5,1,1];
    setCash(v=>v-cost+income); setEnergy(v=>Math.max(0,Math.min(100,v+e))); setRep(v=>Math.min(100,v+r)); setNetwork(v=>v+n);
    setMessage(`${lm.name}: move completed. People are starting to remember you.`);
  }

  return <>
    <section className="card" style={{padding:12, marginBottom:12}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:8}}>
        {[[`₦${cash.toLocaleString()}`,'Cash'],[energy,'Energy'],[rep,'Reputation'],[network,'Network']].map(([v,l])=><div key={l} style={{padding:'8px 10px', minWidth:0}}><div className="muted" style={{fontSize:12}}>{l}</div><strong style={{fontSize:18, overflowWrap:'anywhere'}}>{v}</strong></div>)}
      </div>
    </section>
    <section style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(250px,330px)', gap:12}} className="game-layout">
      <GameCanvas landmarks={landmarks} onSelect={setSelected}/>
      <aside className="card" style={{padding:16, alignSelf:'start'}}>
        <div className="muted" style={{fontSize:12, fontWeight:800, textTransform:'uppercase'}}>Amebo feed</div>
        <p style={{lineHeight:1.5}}>{message}</p>
        <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'16px 0'}}/>
        {selected ? <>
          <div className="muted" style={{fontSize:12}}>{selected.category.toUpperCase()}</div>
          <h2 style={{margin:'4px 0 8px'}}>{selected.name}</h2>
          <p className="muted" style={{lineHeight:1.5}}>{selected.description}</p>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={()=>interact(selected)}>Do something here</button>
        </> : <p className="muted">Walk close to a landmark or tap it to see what you can do there.</p>}
      </aside>
    </section>
    <style jsx>{`@media(max-width:760px){.game-layout{grid-template-columns:1fr !important}}`}</style>
  </>;
}
