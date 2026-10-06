import type { Landmark } from '@/lib/types';

// Game-space positions are art-direction coordinates, not geographic claims.
// Geo coordinates are filled from OSM in Admin after the Uyo boundary is configured.
export const seedLandmarks: Landmark[] = [
  { id:'ibom-plaza', slug:'ibom-plaza', name:'Ibom Plaza', category:'civic', description:'Central social and commerce hub.', gameX:980, gameY:760, assetKey:'plaza', interaction:'network', enabled:true },
  { id:'stadium', slug:'godswill-akpabio-stadium', name:'Godswill Akpabio International Stadium', category:'sports', description:'Match-day crowds, events and temporary jobs.', gameX:330, gameY:300, assetKey:'stadium', interaction:'event', enabled:true },
  { id:'tropicana', slug:'ibom-tropicana', name:'Ibom Tropicana', category:'entertainment', description:'Cinema, hangouts and nightlife missions.', gameX:1290, gameY:500, assetKey:'tropicana', interaction:'social', enabled:true },
  { id:'uniuyo', slug:'university-of-uyo', name:'University of Uyo', category:'education', description:'Study, gigs, student life and skill progression.', gameX:1450, gameY:980, assetKey:'campus', interaction:'study', enabled:true },
  { id:'secretariat', slug:'akwa-ibom-state-secretariat', name:'Akwa Ibom State Secretariat', category:'government', description:'Civil-service career and professional missions.', gameX:780, gameY:410, assetKey:'office', interaction:'career', enabled:true },
  { id:'ibom-hall', slug:'ibom-hall', name:'Ibom Hall', category:'events', description:'Weddings, conferences and social events.', gameX:1110, gameY:360, assetKey:'hall', interaction:'event', enabled:true },
  { id:'shelter-afrique', slug:'shelter-afrique', name:'Shelter Afrique', category:'district', description:'Residential progression and social encounters.', gameX:1510, gameY:680, assetKey:'district', interaction:'housing', enabled:true },
  { id:'oron-road', slug:'oron-road', name:'Oron Road', category:'district', description:'Food, retail, movement and nightlife.', gameX:1240, gameY:1030, assetKey:'road', interaction:'commerce', enabled:true }
];
