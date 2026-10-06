import type { BBox } from './geo';

export type Landmark = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  gameX: number;
  gameY: number;
  lat?: number | null;
  lng?: number | null;
  osmType?: string | null;
  osmId?: string | null;
  googlePlaceId?: string | null;
  assetKey: string;
  interaction: string;
  enabled: boolean;
};

export type WorldFeatureKind = 'road' | 'building' | 'park' | 'water';

export type WorldFeature = {
  id:string;
  kind:WorldFeatureKind;
  name?:string;
  highway?:string;
  points:Array<[number,number]>;
  closed:boolean;
};

export type WorldPoi = {
  id:string;
  name:string;
  category:string;
  lat:number;
  lng:number;
  x:number;
  y:number;
  osmType:string;
  osmId:string;
};

export type WorldPayload = {
  source:'OpenStreetMap';
  attribution:string;
  boundaryName:string;
  bbox:BBox;
  world:{width:number;height:number};
  features:WorldFeature[];
  pois:WorldPoi[];
  counts:{roads:number;buildings:number;parks:number;water:number;pois:number};
  generatedAt:string;
};
