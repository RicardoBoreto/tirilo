import { getAuthUrl } from '@/lib/google';
import { redirect } from 'next/navigation';

export async function GET() {
    const url = getAuthUrl();
    return redirect(url);
}
