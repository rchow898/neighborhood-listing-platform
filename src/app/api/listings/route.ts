// src/app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '../../../lib/supabaseClient';
import { createListingSchema } from '../../../lib/validations/listing';

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
  'created_at',
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

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Validate payload against Zod schema
    const parseResult = createListingSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validData = parseResult.data;

    // 2. Extract Authorization token from request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Authorization header.' },
        { status: 401 }
      );
    }

    // 3. Resolve user session using Supabase Auth
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token.' },
        { status: 401 }
      );
    }

    // 4. Insert listing with bound owner_id and enforced 'draft' status
    const { data, error } = await supabaseClient
      .from('properties')
      .insert([
        {
          ...validData,
          owner_id: userData.user.id,
          status: 'draft',
        },
      ])
      .select(LISTING_COLUMNS)
      .single();

    if (error) {
      console.error('[API /api/listings POST] Insert failure:', error.message);
      return NextResponse.json(
        { error: 'Database insertion error.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (err) {
    console.error('[API /api/listings POST] Internal Server Error:', err);
    return NextResponse.json(
      { error: 'Invalid request body or internal error.' },
      { status: 400 }
    );
  }
}
