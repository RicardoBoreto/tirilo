import { getEquipe, getCurrentUserProfile } from '@/lib/actions/equipe'
import EquipeManager from '@/components/EquipeManager'

export default async function EquipePage() {
    const equipe = await getEquipe()
    const userProfile = await getCurrentUserProfile()

    return (
        <div className="space-y-8">
            <EquipeManager
                initialEquipe={equipe}
                currentUserRole={userProfile?.tipo_perfil || 'recepcao'}
            />
        </div>
    )
}
