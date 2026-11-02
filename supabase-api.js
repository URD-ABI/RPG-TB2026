function message(error, fallback) {
  return new Error(error?.message || fallback);
}

export function createSupabaseApi({ config, auth, fetchImpl = fetch }) {
  if (!config?.supabaseUrl?.startsWith('https://') || !config?.publishableKey) {
    throw new Error('Configuration Supabase publique manquante.');
  }
  const base = `${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/game`;

  async function session() {
    const result = await auth.getSession();
    if (result.error) throw message(result.error, 'Connexion indisponible.');
    return result.data.session;
  }

  async function request(path, options = {}) {
    if (!/^\/api\/[A-Za-z0-9._/-]+$/.test(path) || path.includes('..') || path.includes('//')) {
      throw new Error('Route de jeu invalide.');
    }
    if (path === '/api/session' && options.method === 'DELETE') {
      const result = await auth.signOut();
      if (result.error) throw message(result.error, 'Déconnexion impossible.');
      return { ok: true };
    }

    let current = await session();
    if (path === '/api/session' && options.method === 'POST') {
      if (!current) {
        const result = await auth.signInAnonymously();
        if (result.error) throw message(result.error, 'Connexion impossible.');
        current = result.data.session;
      }
      if (!current?.user?.is_anonymous) throw new Error('Compte joueur requis.');
    }
    if (!current?.access_token) throw new Error('Connexion requise.');

    const { binary = false, ...fetchOptions } = options;
    const response = await fetchImpl(`${base}${path}`, {
      ...fetchOptions,
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${current.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = response.headers.get('content-type')?.includes('json')
      ? await response.json() : binary ? await response.blob() : null;
    if (!response.ok) throw new Error(data?.error || `Erreur ${response.status}`);
    return data;
  }

  async function signInAdmin(email, password) {
    const result = await auth.signInWithPassword({ email, password });
    if (result.error) throw message(result.error, 'Connexion administrateur impossible.');
    return result.data.session;
  }

  return { request, signInAdmin, signOut: () => auth.signOut() };
}

export function browserSupabaseApi(kind = 'player') {
  const config = globalThis.TB2026_CONFIG;
  if (!config) return null;
  if (!globalThis.supabase?.createClient) {
    throw new Error('Le module de connexion Supabase est indisponible.');
  }
  const client = globalThis.supabase.createClient(config.supabaseUrl, config.publishableKey, {
    auth: { storageKey: `tb2026-${kind}-auth` }
  });
  return createSupabaseApi({ config, auth: client.auth });
}
