import { Heart, Star, Music, Hand, Bot, LucideProps, Users, Stethoscope, Settings, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const CuteRobot = ({ className, ...props }: LucideProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("text-primary", className)}
        {...props}
    >
        <rect width="18" height="10" x="3" y="11" rx="5" />
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v3" />
        <path d="M9 16c.5 1 2.5 1 3 0" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
    </svg>
)

export const CuteHeart = ({ className, ...props }: LucideProps) => (
    <Heart
        className={cn("text-red-400 fill-red-100 animate-pulse", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteStar = ({ className, ...props }: LucideProps) => (
    <Star
        className={cn("text-accent fill-accent", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteMusic = ({ className, ...props }: LucideProps) => (
    <Music
        className={cn("text-secondary fill-secondary/20", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteHand = ({ className, ...props }: LucideProps) => (
    <Hand
        className={cn("text-primary", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteUsers = ({ className, ...props }: LucideProps) => (
    <Users
        className={cn("text-primary", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteStethoscope = ({ className, ...props }: LucideProps) => (
    <Stethoscope
        className={cn("text-primary", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteSettings = ({ className, ...props }: LucideProps) => (
    <Settings
        className={cn("text-gray-400", className)}
        strokeWidth={2.5}
        {...props}
    />
)

export const CuteBuilding = ({ className, ...props }: LucideProps) => (
    <Building2
        className={cn("text-primary", className)}
        strokeWidth={2.5}
        {...props}
    />
)
