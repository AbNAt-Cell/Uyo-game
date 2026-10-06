# UYO — Small City. Big Moves.

Starter repository for a mobile + desktop browser life-simulation game set in Uyo.

## What is already in the prototype

- Phaser browser world with keyboard and touch movement.
- Landmark interactions, cash, energy, reputation and network stats.
- Responsive player UI for desktop/mobile.
- `/admin` world-control dashboard.
- Landmark registry with publish/hide control.
- OSM/Overpass importer for durable Uyo POI/geographic data.
- Google Places live-detail endpoint using stored Place IDs only.
- Supabase schema for landmarks, players, economy ledger, city events and businesses.

## Important data architecture

Do **not** scrape Google Maps into the game database. Google Maps Platform generally restricts pre-fetching/caching/storing Places content. Place IDs can be stored; request Google details/photos live when needed and show required attribution. Persistent roads, coordinates, building footprints and POIs should come from OpenStreetMap or other data you have rights to use.

The intended source split is:

1. **OpenStreetMap / Overpass** → persistent world geometry, roads, public POIs and coordinates.
2. **Google Places API** → live current details, photos, ratings and Google Maps links at runtime.
3. **Our database** → gameplay categories, missions, economy, collision zones, interiors, art assets, NPC spawn logic and landmark approval.
4. **Custom 2.5D/3D art** → recognizable but original game representations of major Uyo landmarks.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000/game` and `/admin`.

For persistence, create a Supabase project and run `supabase/schema.sql`, then fill the Supabase environment variables.

## Admin workflow

1. Verify the Uyo gameplay boundary and enter it as `south,west,north,east`.
2. Import OSM places in Admin. Imported records are hidden by default.
3. Review/merge duplicates and promote important locations into game landmarks.
4. Add gameplay interaction, asset key, collision footprint, entrances and spawn points.
5. Search Google Places separately and save only the relevant Google Place ID on the landmark record.
6. Publish.

## Next build milestones

- Replace schematic roads with generated Uyo road/building geometry from the approved OSM dataset.
- Character creator + animated sprite rig and Sims-style click-to-walk navigation.
- Interiors: apartments, restaurants, offices, campus, stadium/event scenes.
- Persistent Supabase auth/player state.
- Server-authoritative economy actions and ledger transactions.
- NPC schedules, relationships, Amebo/gossip graph, jobs and businesses.
- Admin map editor, economy tuning, event scheduler, moderation and analytics.
- Multiplayer presence with Colyseus or a dedicated websocket service once the single-player loop is stable.
