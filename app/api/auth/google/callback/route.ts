import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda?error=google_auth_error`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda?error=no_code`);
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=unauthorized`);
        }

        // Upsert tokens
        const { error: upsertError } = await supabase
            .from('saas_integracoes_google')
            .upsert({
                user_id: user.id,
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || undefined, // Only present on first consent usually
                expiry_date: tokens.expiry_date!,
                scope: tokens.scope!,
                token_type: tokens.token_type!,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (upsertError) {
            console.error('Error saving Google tokens:', upsertError);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda?error=db_error`);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda?success=google_connected`);

    } catch (err) {
        console.error('Error exchanging Google code:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda?error=exchange_error`);
    }
}
