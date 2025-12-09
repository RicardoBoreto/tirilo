import { getGames } from '@/lib/actions/games'
import GamesClient from './games-client'

export const dynamic = 'force-dynamic'

export default async function GamesPage() {
    const games = await getGames()

    return (
        <div className="container mx-auto py-6">
            <GamesClient initialGames={games} />
        </div>
    )
}
