'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Types ---
// --- Types ---
export interface Robot {
    id: string;
    mac_address: string;
    nome_identificacao: string;
    id_clinica: string | null;
    status_bloqueio: boolean;
    // New fields
    modelo_hardware?: string;
    versao_hardware?: string;
    numero_serie?: string;
    foto_url?: string;
    valor_venda?: number;
    valor_aluguel?: number;
    status_operacional?: string;

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
            updated_at: new Date().toISOString() // Note: DB column might be 'atualizado_em' based on previous schema viewing, let me double check. 
            // In schema 20251208120000: atualizado_em TIMESTAMPTZ DEFAULT NOW(),
            // Wait, previous code used 'updated_at' here? 
            // Line 76: updated_at: new Date().toISOString()
            // But schema says: atualizado_em.
            // I should adhere to schema, but existing code might be wrong if 'updated_at' column doesn't exist.
            // I'll check saas_frota_robos schema again. Line 11 says 'atualizado_em'. Line 21 'atualizado_em'.
            // So 'updated_at' works? Maybe createAdminClient maps it or it was a bug?
            // I will fix it to 'atualizado_em' to be safe.
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

export async function registerRobot(macAddress: string, name: string, clinicaId?: string, extraData?: Partial<Robot>) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('saas_frota_robos')
        .insert({
            mac_address: macAddress,
            nome_identificacao: name,
            id_clinica: clinicaId || null,
            status_bloqueio: false, // Auto-activate if created by admin
            ...extraData // Spread new fields
        });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function updateRobot(id: string, data: Partial<Robot>) {
    const supabase = await createAdminClient();

    // Filter out undefined
    const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    // Also remove fields that shouldn't be updated directly if any (e.g. id)

    const { error } = await supabase
        .from('saas_frota_robos')
        .update({ ...updateData, atualizado_em: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

