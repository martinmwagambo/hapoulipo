import AuthPageClient from '../components/AuthPageClient';

type AuthPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = tab === 'signup' ? 'signup' : 'login';

  return <AuthPageClient initialTab={initialTab} />;
}
