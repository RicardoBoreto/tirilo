'use client'

import { useState } from 'react'
import { inviteUser } from '@/lib/actions/invite'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export default function InviteUserDialog({ clinicaId }: { clinicaId: number }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('id_clinica', clinicaId.toString())

        try {
            const result = await inviteUser(formData)
            toast({
                title: "Sucesso!",
                description: result.message,
                duration: 5000,
            })
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast({
                title: "Erro",
                description: "Erro ao enviar convite.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Convidar administrador ou terapeuta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <DialogHeader>
                    <DialogTitle>Convidar Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input id="nome" name="nome" required placeholder="João da Silva" className="dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input id="email" name="email" type="email" required placeholder="joao@exemplo.com" className="dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" name="cpf" placeholder="000.000.000-00" className="dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="celular">Celular WhatsApp *</Label>
                        <Input id="celular" name="celular" required placeholder="(11) 99999-9999" className="dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tipo_perfil">Tipo de Perfil *</Label>
                        <Select name="tipo_perfil" required>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                <SelectValue placeholder="Selecione o perfil" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800">
                                <SelectItem value="admin_clinica">Administrador da clínica</SelectItem>
                                <SelectItem value="terapeuta">Terapeuta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? 'Enviando...' : 'Enviar Convite'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
