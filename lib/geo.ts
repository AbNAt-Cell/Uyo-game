export type BBox = { south:number; west:number; north:number; east:number };

export const WORLD_WIDTH = 5600;
export const WORLD_HEIGHT = 3900;
export const WORLD_PADDING = 180;

export function parseBBox(raw:string):BBox|null {
  const parts=raw.split(',').map(v=>Number(v.trim()));
  if(parts.length!==4 || parts.some(Number.isNaN)) return null;
  const [south,west,north,east]=parts;
  if(south>=north || west>=east) return null;
  if(Math.abs(north-south)>1.5 || Math.abs(east-west)>1.5) return null;
  return {south,west,north,east};
}

export function bboxString(b:BBox){
  return [b.south,b.west,b.north,b.east].join(',');
}

export function projectLatLng(lat:number,lng:number,bbox:BBox,width=WORLD_WIDTH,height=WORLD_HEIGHT,padding=WORLD_PADDING){
  const meanLat=((bbox.south+bbox.north)/2)*Math.PI/180;
  const metersPerLng=111320*Math.cos(meanLat);
  const metersPerLat=110540;
  const spanX=Math.max(1,(bbox.east-bbox.west)*metersPerLng);
  const spanY=Math.max(1,(bbox.north-bbox.south)*metersPerLat);
  const usableW=Math.max(1,width-padding*2);
  const usableH=Math.max(1,height-padding*2);
  const scale=Math.min(usableW/spanX,usableH/spanY);
  const fittedW=spanX*scale;
  const fittedH=spanY*scale;
  const offsetX=(width-fittedW)/2;
  const offsetY=(height-fittedH)/2;
  return {
    x: offsetX + (lng-bbox.west)*metersPerLng*scale,
    y: offsetY + (bbox.north-lat)*metersPerLat*scale,
  };
}
