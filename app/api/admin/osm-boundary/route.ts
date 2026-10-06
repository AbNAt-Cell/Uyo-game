import { NextResponse } from 'next/server';
import { bboxString } from '@/lib/geo';
import { resolveUyoBoundary } from '@/lib/osm';

export async function GET(){
  try{
    const boundary=await resolveUyoBoundary(process.env.UYO_BBOX||null);
    return NextResponse.json({name:boundary.name,bbox:boundary.bbox,bboxString:bboxString(boundary.bbox)});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Could not resolve Uyo.'},{status:502});
  }
}
