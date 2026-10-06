import { NextResponse } from 'next/server';
import { fetchUyoWorld } from '@/lib/osm';

export const runtime='nodejs';

export async function GET(){
  try{
    const world=await fetchUyoWorld(process.env.UYO_BBOX||null);
    return NextResponse.json(world,{
      headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}
    });
  }catch(error){
    return NextResponse.json({
      error:error instanceof Error?error.message:'Could not load the Uyo world.'
    },{status:502});
  }
}
