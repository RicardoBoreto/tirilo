'use client'

import { deletePrompt } from '@/lib/actions/ai_prompts'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePromptButton({ promptId }: { promptId: number }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleDelete = async () => {
        if (confirm('Tem certeza que deseja excluir este prompt?')) {
            startTransition(async () => {
                const result = await deletePrompt(promptId)
                if (result.success) {
                    router.refresh()
                } else {
                    alert('Erro ao excluir: ' + (result.error || 'Erro desconhecido'))
                }
            })
        }
    }

    return (
        <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isPending}
            title="Excluir Prompt"
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}
