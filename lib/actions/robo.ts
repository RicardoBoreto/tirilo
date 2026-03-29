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
    endereco_tailscale?: string;
    usuario_ssh?: string;
    versao_firmware?: string | null; // Versão do firmware em execução
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

export interface Diretriz {
    id?: string;
    id_clinica: string | null;
    modo: 'CRIANCA' | 'TERAPEUTA';
    diretriz: string;
}

export interface PerfilRobo {
    id?: number;
    clinica_id: number | null;
    nome: string;
    descricao?: string;
    prompt_instrucao: string;
    modo_base: 'CRIANCA' | 'TERAPEUTA';
    ativo?: boolean;
}

// --- Helpers ---
function normalizeMac(mac: string): string {
    return mac.trim().toUpperCase().replace(/[^A-F0-9:]/g, '');
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
            atualizado_em: new Date().toISOString()
        }, { onConflict: 'id_clinica' });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function sendCommand(macAddress: string, command: string, params: any = {}) {
    try {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from('comandos_robo')
            .insert({
                mac_address: macAddress,
                comando: command,
                parametros: params,
                status: 'PENDENTE'
            });

        if (error) {
            console.error("Supabase Error [sendCommand]:", error);
            throw new Error(`Erro no banco: ${error.message} (Código: ${error.code})`);
        }
    } catch (e: any) {
        console.error("Critical Failure [sendCommand]:", e);
        throw new Error(e.message || "Falha técnica ao tentar enviar comando.");
    }
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
            mac_address: normalizeMac(macAddress),
            nome_identificacao: name,
            id_clinica: clinicaId || null,
            status_bloqueio: false, // Auto-activate if created by admin
            ...extraData // Spread new fields
        });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function getDirectives(clinicaId?: string) {
    const supabase = await createAdminClient();
    let query = supabase
        .from('saas_diretrizes_ai')
        .select('*')
        .order('modo');

    if (clinicaId) {
        query = query.eq('id_clinica', clinicaId);
    } else {
        query = query.is('id_clinica', null);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching directives:", error);
        return [] as Diretriz[];
    }
    return data as Diretriz[];
}

export async function saveDirective(clinicaId: string | null, modo: 'CRIANCA' | 'TERAPEUTA', diretriz: string) {
    const supabase = await createAdminClient();

    // Verifica se já existe registro para este modo/clínica
    let existQuery = supabase
        .from('saas_diretrizes_ai')
        .select('id')
        .eq('modo', modo);

    if (clinicaId) {
        existQuery = existQuery.eq('id_clinica', clinicaId);
    } else {
        existQuery = existQuery.is('id_clinica', null);
    }

    const { data: existing } = await existQuery.maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from('saas_diretrizes_ai')
            .update({ diretriz })
            .eq('id', existing.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('saas_diretrizes_ai')
            .insert({ id_clinica: clinicaId ?? null, modo, diretriz });
        if (error) throw new Error(error.message);
    }

    revalidatePath('/admin/robo');
}

export async function updateRobot(id: string, data: Partial<Robot>) {
    const supabase = await createAdminClient();

    // Filter out undefined
    const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    // Also remove fields that shouldn't be updated directly if any (e.g. id)

    const { error } = await supabase
        .from('saas_frota_robos')
        .update({
            ...updateData,
            mac_address: data.mac_address ? normalizeMac(data.mac_address) : undefined,
            atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}


// --- Perfis de Personalidade ---

export async function getPerfis(clinicaId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('saas_perfis_robo')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('nome');
    if (error) return [] as PerfilRobo[];
    return data as PerfilRobo[];
}

export async function savePerfil(clinicaId: string, perfil: Omit<PerfilRobo, 'clinica_id'>) {
    const supabase = await createAdminClient();
    if (perfil.id) {
        const { error } = await supabase
            .from('saas_perfis_robo')
            .update({ nome: perfil.nome, descricao: perfil.descricao, prompt_instrucao: perfil.prompt_instrucao, modo_base: perfil.modo_base, ativo: perfil.ativo ?? true })
            .eq('id', perfil.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('saas_perfis_robo')
            .insert({ clinica_id: parseInt(clinicaId), nome: perfil.nome, descricao: perfil.descricao, prompt_instrucao: perfil.prompt_instrucao, modo_base: perfil.modo_base, ativo: true });
        if (error) throw new Error(error.message);
    }
    revalidatePath('/admin/robo');
}

export async function deletePerfil(perfilId: number) {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('saas_perfis_robo').delete().eq('id', perfilId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/robo');
}

export async function ativarPerfil(robotMac: string, perfilId: number, robotId: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('saas_frota_robos')
        .update({ perfil_ativo_id: perfilId })
        .eq('id', robotId);
    if (error) throw new Error(error.message);
    await sendCommand(robotMac, 'MUDAR_PERFIL', { perfil_id: perfilId });
    revalidatePath('/admin/robo');
}
