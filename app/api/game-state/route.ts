import { NextResponse } from 'next/server';
// Starter endpoint. Replace with authenticated Supabase player_state reads/writes.
export async function GET(){return NextResponse.json({cash:43500,energy:82,mood:74,reputation:0,network:6,location:'ibom-plaza'});}
