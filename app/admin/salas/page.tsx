import { getSalas } from '@/lib/actions/salas'
import SalasManager from '@/components/SalasManager'

export default async function SalasPage() {
    const salas = await getSalas()

    return (
        <div className="space-y-8">
            <SalasManager initialSalas={salas} />
        </div>
    )
}
