'use client'

import { useState } from 'react'
import { resetUserPasswordAdmin } from '@/lib/actions/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { KeyRound } from 'lucide-react'

export default function ChangePasswordAdminDialog({ userId, userName }: { userId: string, userName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            toast({
                title: "Erro",
                description: "As senhas não coincidem.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const result = await resetUserPasswordAdmin(userId, password)
            toast({
                title: "Sucesso!",
                description: result.message,
                duration: 5000,
            })
            setOpen(false)
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            console.error(error)
            toast({
                title: "Erro",
                description: error.message || "Erro ao alterar senha.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <KeyRound className="h-4 w-4 mr-1" />
                    Alterar Senha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <DialogHeader>
                    <DialogTitle>Resetar Senha - {userName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold mb-1">Requisitos da senha:</p>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90 text-xs">
                            <li>Mínimo 6 caracteres</li>
                            <li>Uma letra maiúscula</li>
                            <li>Um número</li>
                            <li>Um caractere especial</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova Senha</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            placeholder="••••••" 
                            className="dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input 
                            id="confirmPassword" 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                            placeholder="••••••" 
                            className="dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? 'Alterando...' : 'Salvar Nova Senha'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
