import { RobotLoader } from '@/components/ui/RobotLoader'

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <RobotLoader />
        </div>
    )
}
