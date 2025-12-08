import { useEffect, useState } from 'react'
import { getContratos, saveContrato, Contrato, uploadContrato, getContratoUrl, getContratosByTerapeutaId } from '@/lib/actions/financeiro'
import { getPacientesDoTerapeuta } from '@/lib/actions/pacientes'
import { getTerapeutas } from '@/lib/actions/equipe'
import { Plus, FileText, Download, X, ArrowLeft, User, Edit, Loader2 } from 'lucide-react'

export default function ContratosManager() {
    const [view, setView] = useState<'therapists' | 'contracts'>('therapists')
    const [terapeutas, setTerapeutas] = useState<any[]>([])
    const [selectedTerapeuta, setSelectedTerapeuta] = useState<any>(null)
    const [contratos, setContratos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingContract, setEditingContract] = useState<any>(null)

    useEffect(() => {
        loadTerapeutas()
    }, [])

    async function loadTerapeutas() {
        setLoading(true)
        try {
            const data = await getTerapeutas()
            setTerapeutas(data)
        } finally {
            setLoading(false)
        }
    }

    async function handleSelectTerapeuta(terapeuta: any) {
        setSelectedTerapeuta(terapeuta)
        setLoading(true)
        try {
            // Optimized fetch: get only contracts for this therapist
            const terapeutaContratos = await getContratosByTerapeutaId(terapeuta.id)
            setContratos(terapeutaContratos)
            setView('contracts')
        } finally {
            setLoading(false)
        }
    }

    function handleEdit(contract: any) {
        setEditingContract(contract)
        setIsModalOpen(true)
    }

    function handleNew() {
        setEditingContract(null)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-4 pt-6">
            {view === 'therapists' ? (
                <div>
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-white mb-4">
                        Selecione o Terapeuta
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading && terapeutas.length === 0 ? <p>Carregando...</p> :
                            terapeutas.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => handleSelectTerapeuta(t)}
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{t.nome_completo}</h4>
                                        <p className="text-sm text-gray-500">{t.terapeutas_curriculo?.especialidades?.[0] || 'Terapeuta'}</p>
                                    </div>
                                </div>
                            ))}
                        {!loading && terapeutas.length === 0 && <p className="text-gray-500">Nenhum terapeuta encontrado.</p>}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setView('therapists'); setSelectedTerapeuta(null); }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                            </button>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-700 dark:text-white">
                                    Contratos: {selectedTerapeuta?.nome_completo}
                                </h3>
                                <p className="text-xs text-gray-500">Gerencie os contratos deste profissional</p>
                            </div>
                        </div>
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-medium"
                        >
                            <Plus size={18} /> Novo Contrato
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? <p className="text-gray-500">Carregando...</p> :
                            contratos.length === 0 ? <p className="text-gray-400 col-span-3 text-center py-8">Nenhum contrato ativo para este terapeuta.</p> :
                                contratos.map(c => (
                                    <ContractCard
                                        key={c.id}
                                        contrato={c}
                                        onEdit={() => handleEdit(c)}
                                    />
                                ))}
                    </div>
                </div>
            )}

            {isModalOpen && selectedTerapeuta && (
                <ContractModal
                    preSelectedTerapeuta={selectedTerapeuta}
                    editingContract={editingContract}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={async () => {
                        setIsModalOpen(false);
                        if (selectedTerapeuta) await handleSelectTerapeuta(selectedTerapeuta);
                    }}
                />
            )}
        </div>
    )
}

function ContractCard({ contrato, onEdit }: { contrato: any, onEdit: () => void }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{contrato.paciente?.nome}</h4>
                        <p className="text-xs text-gray-500">{contrato.tipo_cobranca === 'mensal_fixo' ? 'Mensalidade Fixa' : 'Por Sessão'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Editar Contrato"
                    >
                        <Edit size={16} />
                    </button>
                    <StatusDot active={contrato.ativo} />
                </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Vencimento:</span>
                    <span>Dia {contrato.dia_vencimento}</span>
                </div>
                <div className="flex justify-between">
                    <span>Responsável:</span>
                    <span className="truncate max-w-[120px]">{contrato.responsavel?.nome || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${contrato.ativo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {contrato.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>

            {contrato.arquivo_url && (
                <DownloadButton path={contrato.arquivo_url} />
            )}
        </div>
    )
}

function DownloadButton({ path }: { path: string }) {
    const [loading, setLoading] = useState(false)

    async function handleClick(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true)
        try {
            const url = await getContratoUrl(path)
            if (url) window.open(url, '_blank')
            else alert('Erro ao gerar link de download')
        } catch (err) {
            console.error(err)
            alert('Erro ao baixar arquivo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
        >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            {loading ? 'Baixando...' : 'Baixar Contrato'}
        </button>
    )
}

function StatusDot({ active }: { active: boolean }) {
    return (
        <div
            className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${active ? 'bg-emerald-500' : 'bg-red-500'}`}
            title={active ? "Contrato Ativo" : "Contrato Inativo"}
        />
    )
}

function ContractModal({ onClose, onSuccess, preSelectedTerapeuta, editingContract }: { onClose: () => void, onSuccess: () => void, preSelectedTerapeuta: any, editingContract?: any }) {
    const [pacientes, setPacientes] = useState<any[]>([])
    const [selectedPaciente, setSelectedPaciente] = useState<any>(null)
    const [formData, setFormData] = useState({
        valor: '',
        dia_vencimento: '10',
        tipo_cobranca: 'por_sessao',
        data_inicio: new Date().toISOString().split('T')[0],
        ativo: true
    })
    const [saving, setSaving] = useState(false)
    const [responsaveis, setResponsaveis] = useState<any[]>([])
    const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        // Load default value from therapist immediately ONLY if new
        if (!editingContract) {
            const curriculo = Array.isArray(preSelectedTerapeuta.terapeutas_curriculo)
                ? preSelectedTerapeuta.terapeutas_curriculo[0]
                : preSelectedTerapeuta.terapeutas_curriculo

            if (curriculo?.valor_hora_padrao) {
                setFormData(prev => ({ ...prev, valor: curriculo.valor_hora_padrao }))
            }
        }

        // Load patients for this therapist
        setPacientes([])
        setSelectedPaciente(null)

        getPacientesDoTerapeuta(preSelectedTerapeuta.id).then(async (data) => {
            let loadedPacientes = []
            if (data && data.length > 0) {
                loadedPacientes = data
            } else {
                try {
                    const { getPacientes } = await import('@/lib/actions/pacientes')
                    loadedPacientes = await getPacientes()
                } catch (e) {
                    console.error('Erro ao carregar todos os pacientes', e)
                }
            }
            setPacientes(loadedPacientes)

            // If editing, select the correct patient AFTER we have the list
            if (editingContract && loadedPacientes.length > 0) {
                // Populate form
                setFormData({
                    valor: String(editingContract.valor),
                    dia_vencimento: String(editingContract.dia_vencimento),
                    tipo_cobranca: editingContract.tipo_cobranca,
                    data_inicio: editingContract.data_inicio ? editingContract.data_inicio.split('T')[0] : new Date().toISOString().split('T')[0],
                    ativo: editingContract.ativo !== undefined ? editingContract.ativo : true
                })

                const p = loadedPacientes.find((p: any) => p.id === editingContract.id_paciente)
                if (p) {
                    setSelectedPaciente(p)
                    // If patient found, set responsible
                    if (p.pacientes_responsaveis && p.pacientes_responsaveis.length > 0) {
                        const list = p.pacientes_responsaveis.map((pr: any) => pr.responsavel).filter(Boolean)
                        setResponsaveis(list)
                        // Select the one from contract, or default
                        if (editingContract.id_responsavel) {
                            setSelectedResponsibleId(String(editingContract.id_responsavel))
                        } else if (list.length > 0) {
                            setSelectedResponsibleId(String(list[0].id))
                        }
                    }
                }
            }
        })
    }, [preSelectedTerapeuta, editingContract])

    useEffect(() => {
        // This runs when user CHANGES patient in dropdown manually
        if (selectedPaciente) {
            // Logic to populate responsibles is same
            if (selectedPaciente.pacientes_responsaveis && selectedPaciente.pacientes_responsaveis.length > 0) {
                const list = selectedPaciente.pacientes_responsaveis.map((pr: any) => pr.responsavel).filter(Boolean)
                setResponsaveis(list)

                // Only reset responsible if not editing OR if the patient changed
                if (!editingContract || editingContract.id_paciente !== selectedPaciente.id) {
                    if (list.length > 0) setSelectedResponsibleId(String(list[0].id))
                    else setSelectedResponsibleId('')
                } else if (editingContract && editingContract.id_paciente === selectedPaciente.id) {
                    // Ensure responsible is set to contract's responsible
                    setSelectedResponsibleId(String(editingContract.id_responsavel))
                }
            } else {
                setResponsaveis([])
                setSelectedResponsibleId('')
            }
        }
    }, [selectedPaciente])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedPaciente || !selectedResponsibleId) {
            alert('Selecione um paciente e um responsável.')
            return
        }

        setSaving(true)
        try {
            let arquivoPath = editingContract?.arquivo_url || null

            // Upload PDF if selected
            if (file) {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                try {
                    arquivoPath = await uploadContrato(formDataUpload)
                } catch (e: any) {
                    alert('Erro no upload: ' + e.message)
                    setSaving(false)
                    return
                }
            }

            await saveContrato({
                id: editingContract ? editingContract.id : undefined, // Include ID for update
                id_paciente: Number(selectedPaciente.id),
                id_responsavel: Number(selectedResponsibleId),
                id_terapeuta: preSelectedTerapeuta.id,
                valor: Number(formData.valor),
                dia_vencimento: Number(formData.dia_vencimento),
                tipo_cobranca: formData.tipo_cobranca as any,
                data_inicio: formData.data_inicio,
                ativo: formData.ativo,
                status: formData.ativo ? 'ativo' : 'cancelado',
                arquivo_url: arquivoPath
            })
            onSuccess()
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar contrato')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

                    {/* Terapeuta Info Display */}
                    <div className="flex items-center justify-between">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 px-3 rounded-lg flex items-center gap-2">
                            <User size={14} className="text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{preSelectedTerapeuta.nome_completo}</span>
                        </div>

                        {/* Status Toggle - Only show if editing (or allow setting initial status) */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Contrato Ativo</label>
                            <div
                                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.ativo ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Select Paciente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
                        <select
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            onChange={(e) => {
                                const p = pacientes.find(p => String(p.id) === e.target.value)
                                setSelectedPaciente(p)
                                // Only auto-fill due date if NOT editing or if user wants to use default (maybe add a small button for 'Use Default'?)
                                // For simplicity, overwrite on change only if not initial load of editing
                                if (!editingContract && p?.dia_vencimento_padrao) {
                                    setFormData(prev => ({ ...prev, dia_vencimento: String(p.dia_vencimento_padrao) }))
                                }
                            }}
                            required
                            value={selectedPaciente?.id || ''}
                            disabled={!!editingContract} // Maybe disable changing patient on edit? Usually safer.
                        >
                            <option value="" disabled>Selecione...</option>
                            {pacientes.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                        {!!editingContract && <p className="text-xs text-gray-500 mt-1">O paciente não pode ser alterado na edição.</p>}
                        {pacientes.length === 0 && <p className="text-xs text-amber-600 mt-1">Nenhum paciente vinculado a este terapeuta.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável Financeiro</label>
                        <select
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                            value={selectedResponsibleId}
                            onChange={(e) => setSelectedResponsibleId(e.target.value)}
                            required
                            disabled={!selectedPaciente || responsaveis.length === 0}
                        >
                            <option value="" disabled>Selecione...</option>
                            {responsaveis.map(r => (
                                <option key={r.id} value={r.id}>{r.nome || r.nome_completo}</option>
                            ))}
                        </select>
                        {selectedPaciente && responsaveis.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">Este paciente não tem responsável vinculado.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Cobrança</label>
                            <select
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={formData.tipo_cobranca}
                                onChange={(e) => setFormData(prev => ({ ...prev, tipo_cobranca: e.target.value }))}
                            >
                                <option value="por_sessao">Por Sessão</option>
                                <option value="mensal_fixo">Mensalidade Fixa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={formData.valor}
                                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                                required
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia Vencimento</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={formData.dia_vencimento}
                                onChange={(e) => setFormData(prev => ({ ...prev, dia_vencimento: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                            <input
                                type="date"
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={formData.data_inicio}
                                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo do Contrato (PDF)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="space-y-1 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Upload de um arquivo</span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            accept="application/pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF até 5MB</p>
                                {file ? (
                                    <p className="text-sm text-blue-600 font-semibold">{file.name}</p>
                                ) : editingContract?.arquivo_url ? (
                                    <p className="text-sm text-emerald-600">Arquivo atual já salvo. Envie outro para substituir.</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-medium disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : (editingContract ? 'Atualizar Contrato' : 'Criar Contrato')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
