// Route handlers NextAuth (App Router)
//
// Note : tant que DATABASE_URL n'est pas configurée, cette route ne
// fonctionnera pas. L'app continue de marcher en mode localStorage
// (sélecteur démo dans la TopBar) jusqu'à ce que Supabase soit branché.
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
