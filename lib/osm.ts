import { bboxString, parseBBox, projectLatLng, WORLD_HEIGHT, WORLD_WIDTH, type BBox } from './geo';
import type { WorldFeature, WorldPayload, WorldPoi } from './types';

const NOMINATIM='https://nominatim.openstreetmap.org/search';
const OVERPASS='https://overpass-api.de/api/interpreter';
const USER_AGENT='UyoBigMoves/0.2 (Uyo browser game; OSM world import)';

export async function resolveUyoBoundary(explicit?:string|null):Promise<{bbox:BBox;name:string}> {
  const parsed=explicit ? parseBBox(explicit) : null;
  if(parsed) return {bbox:parsed,name:'Custom Uyo gameplay boundary'};

  const url=new URL(NOMINATIM);
  url.searchParams.set('q','Uyo, Akwa Ibom State, Nigeria');
  url.searchParams.set('format','jsonv2');
  url.searchParams.set('limit','5');
  url.searchParams.set('countrycodes','ng');
  url.searchParams.set('addressdetails','1');

  const response=await fetch(url,{headers:{'User-Agent':USER_AGENT,'Accept-Language':'en'},next:{revalidate:604800}});
  if(!response.ok) throw new Error('Nominatim returned '+response.status);
  const rows:any[]=await response.json();
  const chosen=rows.find(r=>String(r.display_name||'').toLowerCase().includes('akwa ibom')) || rows[0];
  if(!chosen?.boundingbox) throw new Error('Could not resolve the Uyo boundary from OpenStreetMap.');
  const vals=chosen.boundingbox.map(Number);
  const bbox={south:vals[0],north:vals[1],west:vals[2],east:vals[3]};
  if(!parseBBox(bboxString(bbox))) throw new Error('Resolved Uyo boundary was outside the expected size range.');
  return {bbox,name:String(chosen.display_name||'Uyo, Akwa Ibom State, Nigeria')};
}

function category(tags:any){
  return String(tags.amenity||tags.tourism||tags.leisure||tags.shop||tags.office||tags.public_transport||tags.building||'place');
}

export async function fetchUyoWorld(explicit?:string|null):Promise<WorldPayload> {
  const boundary=await resolveUyoBoundary(explicit);
  const b=boundary.bbox;
  const box=[b.south,b.west,b.north,b.east].join(',');
  const query='[out:json][timeout:60];('+
    'way["highway"]('+box+');'+
    'way["building"]('+box+');'+
    'way["leisure"~"park|garden|recreation_ground|pitch"]('+box+');'+
    'way["natural"="water"]('+box+');'+
    'way["waterway"]('+box+');'+
    'nwr["name"]["amenity"]('+box+');'+
    'nwr["name"]["tourism"]('+box+');'+
    'nwr["name"]["leisure"]('+box+');'+
    'nwr["name"]["shop"]('+box+');'+
    'nwr["name"]["office"]('+box+');'+
    'nwr["name"]["public_transport"]('+box+');'+
    ');out center geom tags;';

  const response=await fetch(OVERPASS,{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':USER_AGENT},
    body:new URLSearchParams({data:query}),
    next:{revalidate:86400}
  });
  if(!response.ok) throw new Error('Overpass returned '+response.status);
  const json:any=await response.json();
  const elements:any[]=Array.isArray(json.elements)?json.elements:[];
  const features:WorldFeature[]=[];
  const pois:WorldPoi[]=[];
  const seenPoi=new Set<string>();
  const limits={road:1800,building:2600,park:250,water:250};
  const used={road:0,building:0,park:0,water:0};

  for(const el of elements){
    const tags=el.tags||{};
    let kind:WorldFeature['kind']|null=null;
    if(tags.highway) kind='road';
    else if(tags.building) kind='building';
    else if(tags.natural==='water'||tags.waterway) kind='water';
    else if(tags.leisure) kind='park';

    if(kind && Array.isArray(el.geometry) && el.geometry.length>1 && used[kind]<limits[kind]){
      const points=el.geometry
        .filter((p:any)=>Number.isFinite(p.lat)&&Number.isFinite(p.lon))
        .map((p:any)=>{
          const game=projectLatLng(p.lat,p.lon,b);
          return [Math.round(game.x*10)/10,Math.round(game.y*10)/10] as [number,number];
        });
      if(points.length>1){
        features.push({
          id:String(el.type)+'-'+String(el.id),
          kind,
          name:tags.name?String(tags.name):undefined,
          highway:tags.highway?String(tags.highway):undefined,
          points,
          closed:kind!=='road'
        });
        used[kind]++;
      }
    }

    if(tags.name && pois.length<1800){
      const lat=Number(el.lat??el.center?.lat);
      const lng=Number(el.lon??el.center?.lon);
      const key=String(el.type)+'-'+String(el.id);
      if(Number.isFinite(lat)&&Number.isFinite(lng)&&!seenPoi.has(key)){
        seenPoi.add(key);
        const p=projectLatLng(lat,lng,b);
        pois.push({
          id:key,
          name:String(tags.name),
          category:category(tags),
          lat,lng,
          x:Math.round(p.x*10)/10,
          y:Math.round(p.y*10)/10,
          osmType:String(el.type),
          osmId:String(el.id)
        });
      }
    }
  }

  return {
    source:'OpenStreetMap',
    attribution:'© OpenStreetMap contributors',
    boundaryName:boundary.name,
    bbox:b,
    world:{width:WORLD_WIDTH,height:WORLD_HEIGHT},
    features,
    pois,
    counts:{roads:used.road,buildings:used.building,parks:used.park,water:used.water,pois:pois.length},
    generatedAt:new Date().toISOString()
  };
}
