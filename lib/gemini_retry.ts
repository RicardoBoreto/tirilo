const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 2000

export async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn()
        } catch (e: any) {
            lastError = e
            const msg: string = e.message || ''
            const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('quota')

            if (isRetryable && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1) // 2s, 4s, 8s
                console.warn(`[Gemini] tentativa ${attempt} falhou (${msg.slice(0, 60)}). Aguardando ${delay}ms...`)
                await new Promise(r => setTimeout(r, delay))
                continue
            }
            break
        }
    }

    const msg: string = lastError?.message || ''
    if (msg.includes('503') || msg.includes('429') || msg.includes('quota')) {
        throw new Error('O sistema de IA está com alta demanda no momento. Aguarde 1-2 minutos e tente novamente.')
    }
    throw lastError
}
