import { NextResponse } from 'next/server';
import { seedLandmarks } from '@/data/landmarks';
import { adminDb } from '@/lib/supabase';

export async function GET(){
  const db=adminDb();
  if(!db) return NextResponse.json(seedLandmarks);
  const {data,error}=await db.from('landmarks').select('*').order('name');
  if(error || !data?.length) return NextResponse.json(seedLandmarks);
  return NextResponse.json(data.map((x:any)=>({
    id:x.id, slug:x.slug, name:x.name, category:x.category, description:x.description||'', gameX:x.game_x, gameY:x.game_y,
    lat:x.lat, lng:x.lng, osmType:x.osm_type, osmId:x.osm_id, googlePlaceId:x.google_place_id, assetKey:x.asset_key||'default', interaction:x.interaction||'network', enabled:x.enabled
  })));
}

export async function POST(req:Request){
  const body=await req.json(); const db=adminDb();
  if(!db) return NextResponse.json({ok:true,mode:'demo',message:'Connect Supabase to persist admin changes.'});
  const row={id:body.id,slug:body.slug,name:body.name,category:body.category,description:body.description,game_x:body.gameX,game_y:body.gameY,lat:body.lat??null,lng:body.lng??null,osm_type:body.osmType??null,osm_id:body.osmId??null,google_place_id:body.googlePlaceId??null,asset_key:body.assetKey,interaction:body.interaction,enabled:body.enabled};
  const {error}=await db.from('landmarks').upsert(row);
  if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}
