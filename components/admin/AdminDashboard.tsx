'use client';
import { useEffect, useState } from 'react';
import type { Landmark } from '@/lib/types';

export default function AdminDashboard(){
 const [items,setItems]=useState<Landmark[]>([]);
 const [status,setStatus]=useState('Loading world registry…');
 const [bbox,setBbox]=useState('');
 const [boundaryName,setBoundaryName]=useState('');
 const [worldCounts,setWorldCounts]=useState<Record<string,number>|null>(null);

 async function load(){
   const r=await fetch('/api/admin/landmarks');
   const d=await r.json();
   setItems(Array.isArray(d)?d:[]);
   setStatus(Array.isArray(d)?d.length+' landmarks loaded':'Could not load landmarks');
 }

 async function detectBoundary(){
   setStatus('Resolving Uyo from OpenStreetMap…');
   const r=await fetch('/api/admin/osm-boundary');
   const d=await r.json();
   if(d.error){setStatus(d.error);return;}
   setBbox(d.bboxString);
   setBoundaryName(d.name);
   setStatus('Uyo boundary detected. Ready to import.');
 }

 useEffect(()=>{
   load().catch(()=>setStatus('Could not load landmarks'));
   detectBoundary().catch(()=>{});
 },[]);

 async function toggle(lm:Landmark){
   await fetch('/api/admin/landmarks',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({...lm,enabled:!lm.enabled})
   });
   await load();
 }

 async function importOsm(){
   setStatus('Importing real Uyo roads, buildings and places…');
   const r=await fetch('/api/admin/osm-import',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({bbox})
   });
   const d=await r.json();
   if(d.bbox) setBbox(d.bbox);
   if(d.boundaryName) setBoundaryName(d.boundaryName);
   if(d.counts) setWorldCounts(d.counts);
   setStatus(d.message||d.error||'Import finished');
   await load();
 }

 return <>
  <section style={{display:'flex',alignItems:'end',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:18}}>
    <div>
      <div className="muted" style={{fontSize:12,fontWeight:800,textTransform:'uppercase'}}>World control</div>
      <h1 style={{margin:'4px 0 0',fontSize:'clamp(30px,5vw,54px)',letterSpacing:'-.05em'}}>Uyo Admin</h1>
    </div>
    <div className="pill">{status}</div>
  </section>

  <section className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',marginBottom:14}}>
   {[
     ['Landmarks',items.length],
     ['Published',items.filter(x=>x.enabled).length],
     ['Roads',worldCounts?.roads??'—'],
     ['Buildings',worldCounts?.buildings??'—'],
     ['OSM POIs',worldCounts?.pois??items.filter(x=>x.osmId).length]
   ].map(([a,b])=><div className="card" style={{padding:18}} key={String(a)}><div className="muted" style={{fontSize:12}}>{a}</div><strong style={{fontSize:30}}>{b}</strong></div>)}
  </section>

  <section className="card" style={{padding:18,marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
      <div>
        <h2 style={{marginTop:0}}>Uyo world import</h2>
        <p className="muted" style={{maxWidth:720}}>The game uses OpenStreetMap geometry for roads, buildings, parks and water. Leave the detected boundary as-is, or override it with a verified <code>south,west,north,east</code> box.</p>
        {boundaryName&&<p style={{fontSize:13}}><strong>Detected:</strong> {boundaryName}</p>}
      </div>
      <button className="btn btn-secondary" onClick={detectBoundary}>Detect Uyo boundary</button>
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <input value={bbox} onChange={e=>setBbox(e.target.value)} placeholder="south,west,north,east" style={{flex:'1 1 320px',minHeight:44,border:'1px solid var(--line)',borderRadius:12,padding:'0 12px',background:'white'}}/>
      <button className="btn btn-primary" onClick={importOsm}>Import / refresh Uyo</button>
    </div>
  </section>

  <section className="card" style={{overflow:'hidden'}}>
    <div style={{padding:18,borderBottom:'1px solid var(--line)'}}>
      <h2 style={{margin:0}}>Landmark registry</h2>
      <p className="muted" style={{marginBottom:0}}>Imported POIs keep their geographic position. Publish only places that should become interactive in the game.</p>
    </div>
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',minWidth:760}}>
        <thead><tr>{['Landmark','Category','OSM','Google Place ID','Interaction','Live'].map(h=><th key={h} style={{textAlign:'left',padding:12,borderBottom:'1px solid var(--line)',fontSize:12}}>{h}</th>)}</tr></thead>
        <tbody>{items.map(l=><tr key={l.id}>
          <td style={{padding:12,borderBottom:'1px solid var(--line)'}}><strong>{l.name}</strong><div className="muted" style={{fontSize:12}}>{l.description}</div></td>
          <td style={{padding:12,borderBottom:'1px solid var(--line)'}}>{l.category}</td>
          <td style={{padding:12,borderBottom:'1px solid var(--line)',fontSize:12}}>{l.osmId?(l.osmType+'/'+l.osmId):'—'}</td>
          <td style={{padding:12,borderBottom:'1px solid var(--line)',fontSize:12,maxWidth:190,overflowWrap:'anywhere'}}>{l.googlePlaceId||'—'}</td>
          <td style={{padding:12,borderBottom:'1px solid var(--line)'}}>{l.interaction}</td>
          <td style={{padding:12,borderBottom:'1px solid var(--line)'}}><button className="btn btn-secondary" onClick={()=>toggle(l)}>{l.enabled?'Published':'Hidden'}</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
 </>;
}
