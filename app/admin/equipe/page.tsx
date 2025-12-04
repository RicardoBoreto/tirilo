import { getEquipe } from '@/lib/actions/equipe'
import EquipeManager from '@/components/EquipeManager'

export default async function EquipePage() {
    const equipe = await getEquipe()

    return (
        <div className="space-y-8">
            <EquipeManager initialEquipe={equipe} />
        </div>
    )
}
