'use server'

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MaintenanceOS = {
    id: string;
    robo_id: string;
    data_entrada: string;
    data_fechamento: string | null;
    tipo_manutencao: 'preventiva' | 'corretiva' | 'upgrade' | 'preparacao' | 'outros';
    status_os: 'aberto' | 'em_analise' | 'aguardando_peca' | 'em_reparo' | 'testes' | 'concluido' | 'cancelado';
    defeito_relatado: string;
    diagnostico_tecnico: string;
    solucao_aplicada: string;
    custo_total: number;
    faturado_cliente: boolean;

    // Joined fields
    robo_nome?: string;
    robo_mac?: string;
}

export async function getMaintenanceOrders(statusFilter?: string) {
    const supabase = await createAdminClient();

    let query = supabase
        .from('saas_manutencoes_frota')
        .select(`
            *,
            saas_frota_robos (
                nome_identificacao,
                mac_address
            )
        `)
        .order('data_entrada', { ascending: false });

    if (statusFilter && statusFilter !== 'todos') {
        if (statusFilter === 'ativos') {
            query = query.in('status_os', ['aberto', 'em_analise', 'aguardando_peca', 'em_reparo', 'testes']);
        } else {
            query = query.eq('status_os', statusFilter);
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching maintenance orders:", error);
        return [];
    }

    return data.map((item: any) => ({
        ...item,
        robo_nome: item.saas_frota_robos?.nome_identificacao,
        robo_mac: item.saas_frota_robos?.mac_address
    })) as MaintenanceOS[];
}

export async function getRobotHistory(roboId: string) {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from('saas_manutencoes_frota')
        .select('*')
        .eq('robo_id', roboId)
        .order('data_entrada', { ascending: false });

    if (error) {
        return [];
    }
    return data as MaintenanceOS[];
}

export async function createMaintenanceOrder(data: {
    robo_id: string,
    tipo_manutencao: string,
    defeito_relatado: string,
    update_robot_status: boolean
}) {
    const supabase = await createAdminClient();

    // 1. Create OS
    const { error: osError } = await supabase
        .from('saas_manutencoes_frota')
        .insert({
            robo_id: data.robo_id,
            tipo_manutencao: data.tipo_manutencao,
            defeito_relatado: data.defeito_relatado,
            status_os: 'aberto'
        });

    if (osError) return { error: osError.message };

    // 2. Update Robot Status if requested
    if (data.update_robot_status) {
        await supabase
            .from('saas_frota_robos')
            .update({ status_operacional: 'manutencao' })
            .eq('id', data.robo_id);
    }

    revalidatePath('/admin/robo');
    return { success: true };
}

export async function updateMaintenanceOrder(id: string, data: Partial<MaintenanceOS>) {
    const supabase = await createAdminClient();

    // Filter out undefined and join fields
    const { robo_nome, robo_mac, ...cleanData } = data as any;

    // Handle closing logic
    const isClosing = ['concluido', 'cancelado'].includes(cleanData.status_os);
    if (isClosing && !cleanData.data_fechamento) {
        cleanData.data_fechamento = new Date().toISOString();
    }

    const { error } = await supabase
        .from('saas_manutencoes_frota')
        .update({
            ...cleanData,
            atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/robo');
    return { success: true };
}

export async function closeMaintenanceAndReleaseRobot(osId: string, roboId: string) {
    const supabase = await createAdminClient();

    // 1. Close OS
    const { error: osError } = await supabase
        .from('saas_manutencoes_frota')
        .update({
            status_os: 'concluido',
            data_fechamento: new Date().toISOString()
        })
        .eq('id', osId);

    if (osError) return { error: osError.message };

    // 2. Release Robot
    const { error: roboError } = await supabase
        .from('saas_frota_robos')
        .update({ status_operacional: 'disponivel' })
        .eq('id', roboId);

    if (roboError) return { error: 'OS fechada, mas erro ao liberar robô: ' + roboError.message };

    revalidatePath('/admin/robo');
    return { success: true };
}
