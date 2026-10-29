import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { PropertyPayloadSchema } from '../../../schemas/property';

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('properties')
            .select('id, address, price, bedrooms, bathrooms, square_feet')
            .eq('status', 'approved');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ properties: data }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json();
        const parseResult = PropertyPayloadSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    issues: parseResult.error.flatten(),
                },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        let ownerId: string | null = null;
        if (token) {
            const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
            if (!userError && userData?.user) {
                ownerId = userData.user.id;
            }
        }

        if (!ownerId) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing or invalid authentication token.' },
                { status: 401 }
            );
        }

        const { data, error } = await supabaseServer
            .from('properties')
            .insert([
                {
                    ...parseResult.data,
                    owner_id: ownerId,
                    status: 'draft',
                },
            ])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ property: data }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid JSON or Request Body';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}