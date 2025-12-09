'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Types ---
export interface Robot {
    id: string;
    mac_address: string;
    nome_identificacao: string;
    id_clinica: string | null;
    status_bloqueio: boolean;
    online?: boolean; // Derivado da telemetria recente
    ultimo_visto?: string;
}

export interface RobotConfig {
    id: string;
    id_clinica: string;
    prompt_personalidade_robo: string;
    motor_voz_preferencial: string;
}

export interface Telemetry {
    id: number;
    mac_address: string;
    jogo: string;
    resultado: string;
    detalhes: any;
    timestamp: string;
}

// --- Actions ---

export async function getRobots(clinicaId?: string) {
    const supabase = await createClient();

    let query = supabase.from('saas_frota_robos').select('*');
    if (clinicaId) {
        query = query.eq('id_clinica', clinicaId);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching robots:", error);
        return [];
    }
    return data as Robot[];
}

export async function getRobotConfig(clinicaId?: string) {
    if (!clinicaId) return null;
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('clinica_config_ia')
        .select('*')
        .eq('id_clinica', clinicaId)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignora 'not found'
        console.error("Error fetching config:", error);
    }
    return data as RobotConfig | null;
}

export async function updateRobotConfig(clinicaId: string, config: { prompt_personalidade_robo: string, motor_voz_preferencial: string }) {
    if (!clinicaId) throw new Error("ID da clínica obrigatório.");
    const supabase = await createAdminClient();

    // Upsert
    const { error } = await supabase
        .from('clinica_config_ia')
        .upsert({
            id_clinica: clinicaId,
            ...config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id_clinica' });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function sendCommand(macAddress: string, command: string, params: any = {}) {
    const supabase = await createAdminClient();

    const { error } = await supabase
        .from('comandos_robo')
        .insert({
            mac_address: macAddress,
            comando: command,
            parametros: params,
            status: 'PENDENTE'
        });

    if (error) throw new Error(error.message);
}

export async function toggleRobotBlock(id: string, currentStatus: boolean) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('saas_frota_robos')
        .update({ status_bloqueio: !currentStatus })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function getTelemetry(macAddress: string, limit = 20) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('sessao_telemetria')
        .select('*')
        .eq('mac_address', macAddress)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching telemetry:", error);
        return [];
    }
    return data as Telemetry[];
}

export async function registerRobot(macAddress: string, name: string, clinicaId?: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('saas_frota_robos')
        .insert({
            mac_address: macAddress,
            nome_identificacao: name,
            id_clinica: clinicaId || null,
            status_bloqueio: false // Auto-activate if created by admin
        });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function updateRobot(id: string, data: { nome_identificacao?: string, mac_address?: string, id_clinica?: string | null }) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('saas_frota_robos')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

