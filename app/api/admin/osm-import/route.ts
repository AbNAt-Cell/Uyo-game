import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase';

function parseBbox(raw:string){ const p=raw.split(',').map(Number); if(p.length!==4||p.some(Number.isNaN)) return null; const [s,w,n,e]=p; if(s>=n||w>=e||Math.abs(n-s)>1||Math.abs(e-w)>1) return null; return {s,w,n,e}; }
function slugify(v:string){return v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
function cat(tags:any){return tags.tourism||tags.amenity||tags.leisure||tags.shop||tags.office||tags.building||'place'}

export async function POST(req:Request){
  const {bbox:bodyBbox}=await req.json().catch(()=>({bbox:''})); const raw=String(bodyBbox||process.env.UYO_BBOX||''); const box=parseBbox(raw);
  if(!box) return NextResponse.json({error:'Set a verified Uyo bounding box: south,west,north,east.'},{status:400});
  const q=`[out:json][timeout:45];(nwr["name"]["amenity"](${box.s},${box.w},${box.n},${box.e});nwr["name"]["tourism"](${box.s},${box.w},${box.n},${box.e});nwr["name"]["leisure"](${box.s},${box.w},${box.n},${box.e});nwr["name"]["shop"](${box.s},${box.w},${box.n},${box.e});nwr["name"]["office"](${box.s},${box.w},${box.n},${box.e});nwr["name"]["building"="public"](${box.s},${box.w},${box.n},${box.e}););out center tags;`;
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'UyoBigMoves/0.1'},body:new URLSearchParams({data:q}),cache:'no-store'});
  if(!r.ok) return NextResponse.json({error:`Overpass returned ${r.status}`},{status:502});
  const json=await r.json(); const rows=(json.elements||[]).filter((x:any)=>x.tags?.name).slice(0,2500).map((x:any,i:number)=>{
    const lat=x.lat??x.center?.lat??null, lng=x.lon??x.center?.lon??null; const name=String(x.tags.name); const id=`osm-${x.type}-${x.id}`;
    return {id,slug:`${slugify(name)}-${x.id}`,name,category:String(cat(x.tags)),description:'Imported from OpenStreetMap. Add game interaction and art direction in Admin.',game_x:160+(i%18)*88,game_y:170+Math.floor(i/18)*72,lat,lng,osm_type:x.type,osm_id:String(x.id),asset_key:'default',interaction:'network',enabled:false};
  });
  const db=adminDb();
  if(!db) return NextResponse.json({message:`Previewed ${rows.length} OSM features. Connect Supabase to persist them.`,sample:rows.slice(0,10)});
  for(let i=0;i<rows.length;i+=250){const {error}=await db.from('landmarks').upsert(rows.slice(i,i+250),{onConflict:'id'}); if(error)return NextResponse.json({error:error.message},{status:400});}
  return NextResponse.json({message:`Imported/refreshed ${rows.length} Uyo map features from OSM. They remain hidden until approved.`});
}
