import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase';
import { bboxString } from '@/lib/geo';
import { fetchUyoWorld } from '@/lib/osm';

function slugify(v:string){
  return v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
}

export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>({}));
    const explicit=String(body.bbox||process.env.UYO_BBOX||'')||null;
    const world=await fetchUyoWorld(explicit);
    const rows=world.pois.slice(0,1800).map(p=>({
      id:'osm-'+p.osmType+'-'+p.osmId,
      slug:slugify(p.name)+'-'+p.osmId,
      name:p.name,
      category:p.category,
      description:'Imported from OpenStreetMap. Review gameplay metadata before publishing.',
      game_x:p.x,
      game_y:p.y,
      lat:p.lat,
      lng:p.lng,
      osm_type:p.osmType,
      osm_id:p.osmId,
      asset_key:'default',
      interaction:'network',
      enabled:false
    }));

    const db=adminDb();
    if(!db){
      return NextResponse.json({
        message:'Previewed '+rows.length+' Uyo POIs and '+world.features.length+' world features. Connect Supabase to persist POIs.',
        bbox:bboxString(world.bbox),
        boundaryName:world.boundaryName,
        counts:world.counts,
        sample:rows.slice(0,12)
      });
    }

    for(let i=0;i<rows.length;i+=250){
      const {error}=await db.from('landmarks').upsert(rows.slice(i,i+250),{onConflict:'id'});
      if(error) return NextResponse.json({error:error.message},{status:400});
    }

    return NextResponse.json({
      message:'Imported/refreshed '+rows.length+' Uyo POIs. They remain hidden until approved.',
      bbox:bboxString(world.bbox),
      boundaryName:world.boundaryName,
      counts:world.counts
    });
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Import failed.'},{status:502});
  }
}
