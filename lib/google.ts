import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];

export function getOAuth2Client() {
    const connection = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
    return connection;
}

export function getAuthUrl() {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial to get refresh_token
        scope: SCOPES,
        prompt: 'consent', // Force consent to ensure refresh_token is returned
        include_granted_scopes: true
    });
}

export async function getUserOAuth2Client(userId: string) {
    const supabase = await createClient();
    const { data: integration, error } = await supabase
        .from('saas_integracoes_google')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !integration) {
        return null;
    }

    const oauth2Client = getOAuth2Client();

    oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        expiry_date: integration.expiry_date,
        scope: integration.scope,
        token_type: integration.token_type,
    });

    // Check if token needs refresh
    // googleapis handles auto-refresh if refresh_token is present? 
    // It usually does if we make a request. 
    // But we might want to capture the new tokens if they change.
    // We can add a listener for 'tokens' event but that's for long running process.
    // In serverless, we manually assume it might refresh.

    // We can wrap the client to listen for refresh?
    // Or just trust googleapis to refresh in memory, but we need to persist it back to DB.

    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            const updateData: any = {
                access_token: tokens.access_token,
                expiry_date: tokens.expiry_date,
                updated_at: new Date().toISOString()
            };
            if (tokens.refresh_token) {
                updateData.refresh_token = tokens.refresh_token;
            }

            await supabase
                .from('saas_integracoes_google')
                .update(updateData)
                .eq('user_id', userId);
        }
    });

    return oauth2Client;
}

export async function insertGoogleEvent(userId: string, eventData: any) {
    const auth = await getUserOAuth2Client(userId);
    if (!auth) return null; // Not connected

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventData,
        });
        return response.data;
    } catch (error) {
        console.error('Error inserting Google event:', error);
        return null;
    }
}

export async function updateGoogleEvent(userId: string, eventId: string, eventData: any) {
    const auth = await getUserOAuth2Client(userId);
    if (!auth) return null;

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: eventData,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating Google event:', error);
        return null;
    }
}

export async function deleteGoogleEvent(userId: string, eventId: string) {
    const auth = await getUserOAuth2Client(userId);
    if (!auth) return null;

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google event:', error);
        return false;
    }
}

export const mapAgendamentoToGoogleEvent = (agendamento: any) => {
    return {
        summary: agendamento.paciente?.nome ? `Terapia: ${agendamento.paciente.nome}` : 'Sessão de Terapia',
        description: agendamento.observacoes || '',
        start: {
            dateTime: agendamento.data_hora_inicio,
            timeZone: 'America/Sao_Paulo', // Adjust as needed
        },
        end: {
            dateTime: agendamento.data_hora_fim,
            timeZone: 'America/Sao_Paulo',
        },
        // Reminders could be default
        reminders: {
            useDefault: true,
        },
    };
};
