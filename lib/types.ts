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
