import { NextResponse } from 'next/server';

export async function GET(req:Request){
 const key=process.env.GOOGLE_MAPS_API_KEY; if(!key)return NextResponse.json({error:'GOOGLE_MAPS_API_KEY is not configured.'},{status:400});
 const id=new URL(req.url).searchParams.get('id'); if(!id)return NextResponse.json({error:'Missing place id.'},{status:400});
 const fields='id,displayName,formattedAddress,googleMapsUri,websiteUri,primaryType,photos,rating,userRatingCount';
 const r=await fetch('https://places.googleapis.com/v1/places/'+encodeURIComponent(id)+'?fields='+encodeURIComponent(fields),{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':fields},cache:'no-store'});
 const data=await r.json(); return NextResponse.json(data,{status:r.status});
}
