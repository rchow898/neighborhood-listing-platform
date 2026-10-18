// src/app/api/listings/route.ts
import { NextResponse } from 'next/server';
import { supabaseClient } from '../../../lib/supabaseClient';

const LISTING_COLUMNS = [
  'id',
  'property_id',
  'address',
  'city',
  'state',
  'zip_code',
  'price',
  'bedrooms',
  'bathrooms',
  'square_feet',
  'amenities',
  'status',
  'created_at'
].join(', ');

export async function GET() {
  try {
    const { data, error } = await supabaseClient
      .from('properties')
      .select(LISTING_COLUMNS)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/listings GET] Database query failure:', error.message);
      return NextResponse.json(
        { error: 'An unexpected error occurred while retrieving property listings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ listings: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[API /api/listings GET] Internal Server Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}