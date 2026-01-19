'use client'

import { useState } from 'react'
import { createMembroEquipe, toggleStatusMembro, updateMembroEquipe, type MembroEquipe } from '@/lib/actions/equipe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Loader2, Plus, Users, UserCog, Mail, Phone,
    BadgeCheck, MoreVertical, Ban, CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useRouter } from 'next/navigation'

export default function EquipeManager({ initialEquipe }: { initialEquipe: MembroEquipe[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState<'terapeuta' | 'recepcao'>('recepcao')
    const [filterStatus, setFilterStatus] = useState<'ativos' | 'inativos' | 'todos'>('ativos')
    const [editingMembro, setEditingMembro] = useState<MembroEquipe | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await createMembroEquipe(formData)
            if (result.error) {
                alert(result.error)
            } else {
                setOpen(false)
                alert('Membro adicionado com sucesso! Senha padrão: Tirilo2025!')
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao criar membro da equipe')
        } finally {
            setLoading(false)
        }
    }

    async function handleToggleStatus(id: string, currentStatus: boolean) {
        if (!confirm(`Tem certeza que deseja ${currentStatus ? 'inativar' : 'ativar'} este membro?`)) return

        try {
            const result = await toggleStatusMembro(id, !currentStatus)
            if (!result.success) {
                alert('Erro ao atualizar status: ' + result.error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar status')
        }
    }

    function handleEdit(membro: MembroEquipe) {
        setEditingMembro(membro)
        setEditOpen(true)
    }

    async function handleEditSubmit(formData: FormData) {
        if (!editingMembro) return

        setLoading(true)
        try {
            const result = await updateMembroEquipe(editingMembro.id, formData)
            if (result.error) {
                alert(result.error)
            } else {
                setEditOpen(false)
                setEditingMembro(null)
                alert('Dados atualizados com sucesso!')
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar dados')
        } finally {
            setLoading(false)
        }
    }

    const filteredEquipe = initialEquipe.filter(membro => {
        if (filterStatus === 'ativos') return membro.ativo !== false
        if (filterStatus === 'inativos') return membro.ativo === false
        return true
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Gestão de Equipe
                    </h2>
                    <p className="text-gray-500">Gerencie terapeutas, recepcionistas e administradores.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'ativos' | 'inativos' | 'todos')} className="w-full md:w-auto">
                        <TabsList>
                            <TabsTrigger value="ativos">Ativos</TabsTrigger>
                            <TabsTrigger value="inativos">Inativos</TabsTrigger>
                            <TabsTrigger value="todos">Todos</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl shadow-lg shadow-primary/20 whitespace-nowrap">
                                <Plus className="w-5 h-5 mr-2" />
                                Novo Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Membro</DialogTitle>
                            </DialogHeader>
                            <form action={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Nome Completo</Label>
                                    <Input name="nome" required placeholder="Ex: Maria Silva" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Email de Acesso</Label>
                                    <Input name="email" type="email" required placeholder="maria@clinica.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Apelido / Nome Curto</Label>
                                    <Input name="apelido" placeholder="Ex: Dra. Maria, Mari" />
                                    <p className="text-xs text-gray-500">Nome curto para exibição (opcional)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Função / Cargo</Label>
                                        <Select
                                            name="tipo_perfil"
                                            defaultValue="recepcao"
                                            onValueChange={(val: any) => setSelectedRole(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recepcao">Recepção / Secretaria</SelectItem>
                                                <SelectItem value="financeiro">Financeiro / Admin</SelectItem>
                                                <SelectItem value="terapeuta">Terapeuta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input name="telefone" placeholder="(11) 99999-9999" />
                                    </div>
                                </div>

                                {selectedRole === 'terapeuta' && (
                                    <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                                        <p className="text-xs font-medium text-primary uppercase">Dados do Terapeuta</p>
                                        <div className="space-y-2">
                                            <Label>Registro Profissional (CRP/CRM/Etc)</Label>
                                            <Input name="registro_profissional" placeholder="Ex: 12345/SP" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Especialidade Principal</Label>
                                            <Input name="especialidade" placeholder="Ex: Psicologia Infantil" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar Membro'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Editar Dados do Membro</DialogTitle>
                            </DialogHeader>
                            {editingMembro && (
                                <form action={handleEditSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo</Label>
                                        <Input name="nome" required placeholder="Ex: Maria Silva" defaultValue={editingMembro.nome_completo} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Apelido / Nome Curto</Label>
                                        <Input name="apelido" placeholder="Ex: Dra. Maria, Mari" defaultValue={editingMembro.apelido || ''} />
                                        <p className="text-xs text-gray-500">Nome curto para exibição na agenda e notificações</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input name="telefone" placeholder="(11) 99999-9999" defaultValue={editingMembro.celular_whatsapp || ''} />
                                    </div>

                                    {editingMembro.tipo_perfil === 'terapeuta' && (
                                        <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                                            <p className="text-xs font-medium text-primary uppercase">Dados do Terapeuta</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Registro (CRP/CRM)</Label>
                                                    <Input name="registro_profissional" placeholder="Ex: 12345/SP" defaultValue={(editingMembro as any).terapeutas_curriculo?.registro_profissional || ''} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Especialidade</Label>
                                                    <Input name="especialidade" placeholder="Ex: Psicologia" defaultValue={(editingMembro as any).terapeutas_curriculo?.especialidades?.[0] || ''} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Valor Hora (R$)</Label>
                                                    <Input name="valor_hora_padrao" type="number" step="0.01" placeholder="0.00" defaultValue={(editingMembro as any).terapeutas_curriculo?.valor_hora_padrao || ''} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Repasse (%)</Label>
                                                    <Input name="porcentagem_repasse" type="number" step="0.1" placeholder="50" defaultValue={(editingMembro as any).terapeutas_curriculo?.porcentagem_repasse || ''} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipe.map((membro) => (
                    <div key={membro.id} className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group relative ${membro.ativo === false ? 'opacity-60 border-gray-200 bg-gray-50' : 'border-gray-100 dark:border-gray-700'}`}>

                        <div className="absolute top-4 right-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEdit(membro)}>
                                        <UserCog className="w-4 h-4 mr-2" />
                                        Editar Dados
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleToggleStatus(membro.id, membro.ativo !== false)}
                                        className={membro.ativo !== false ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                                    >
                                        {membro.ativo !== false ? (
                                            <>
                                                <Ban className="w-4 h-4 mr-2" />
                                                Inativar Acesso
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Reativar Acesso
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-start justify-between mb-4 pr-8">
                            {membro.foto_url ? (
                                <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-gray-100">
                                    <img
                                        src={membro.foto_url}
                                        alt={membro.nome_completo}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                                    ${membro.tipo_perfil === 'admin' ? 'bg-purple-100 text-purple-600' :
                                        membro.tipo_perfil === 'terapeuta' ? 'bg-blue-100 text-blue-600' :
                                            'bg-green-100 text-green-600'}`}
                                >
                                    {membro.nome_completo.charAt(0)}
                                </div>
                            )}
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className={`capitalize
                                    ${membro.tipo_perfil === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        membro.tipo_perfil === 'terapeuta' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-green-50 text-green-700 border-green-200'}`}
                                >
                                    {membro.tipo_perfil === 'recepcao' ? 'Recepção' : membro.tipo_perfil}
                                </Badge>
                                {membro.ativo === false && (
                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Inativo</Badge>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{membro.nome_completo}</h3>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{membro.email}</span>
                            </div>
                            {membro.celular_whatsapp && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Phone className="w-4 h-4" />
                                    <span>{membro.celular_whatsapp}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center text-xs text-gray-400">
                            <span>Adicionado em {new Date(membro.created_at).toLocaleDateString('pt-BR')}</span>
                            {membro.tipo_perfil === 'admin' && <BadgeCheck className="w-4 h-4 text-purple-400" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
