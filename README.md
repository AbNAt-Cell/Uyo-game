# UYO — Small City. Big Moves.

A mobile + desktop browser life-simulation game set in Uyo, Akwa Ibom State.

## Current playable milestone

The game now has a real geographic world layer instead of a procedural placeholder:

- Uyo boundary auto-resolution through OpenStreetMap Nominatim.
- Roads, building footprints, parks, water and named POIs from OpenStreetMap/Overpass.
- Geographic lat/lng → game coordinate projection that preserves local scale/aspect.
- Phaser renderer for actual Uyo road/building geometry.
- Click-to-walk on desktop, WASD/arrows, touch controls on mobile and camera zoom.
- Building collision approximations around the current district.
- Landmark snapping to matching OSM places where available.
- Admin boundary detection and geographic POI import.
- Google Places live-detail endpoint using stored Place IDs only.
- Supabase schema for landmarks, players, economy ledger, city events and businesses.

## Data architecture

Do **not** scrape Google Maps into the game database. Google Places content should be requested through the official API when needed. Place IDs can be associated with our records; our durable geographic world uses OpenStreetMap or other datasets we have rights to use.

1. **OpenStreetMap / Overpass** → roads, building footprints, public POIs and coordinates.
2. **Google Places API** → live current details, photos, ratings and Google Maps links at runtime.
3. **Our database** → gameplay categories, missions, economy, interiors, assets, NPC logic and landmark approval.
4. **Custom 2.5D/3D art** → recognizable game representations of major Uyo landmarks.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open:

- `http://localhost:3000/game` — playable world
- `http://localhost:3000/admin` — world control

If `UYO_BBOX` is empty, the server resolves Uyo through Nominatim. You can also detect/override the boundary in Admin.

For persistence, create a Supabase project and run `supabase/schema.sql`, then fill the Supabase environment variables.

## Admin workflow

1. Open Admin and let the app detect Uyo's boundary.
2. Import/refresh Uyo.
3. Named OSM POIs enter the landmark registry hidden by default.
4. Review a place, add gameplay metadata/art, then publish it.
5. Add a Google Place ID only when you need live Places details.
6. The public game renders roads/buildings from OSM and interactive locations from the approved registry.

## Next milestone

**Ibom Plaza vertical slice**

- Build a stylized Plaza landmark asset and nearby recognizable blocks.
- Add 20–30 NPC archetypes with schedules and conversations.
- Add shop/restaurant entrances and one playable interior.
- Add a first real job shift, food purchase and transport loop.
- Persist player state and economy server-side.
- Expand Admin with NPC, jobs, business, events and economy editors.

OpenStreetMap data must retain appropriate attribution: © OpenStreetMap contributors.
