import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

export type TokenPayload = {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
};

type StoredSession = {
  tokens: TokenPayload | null;
  athlete: Record<string, unknown> | null;
};

const STORAGE_KEY = 'strava.session.v1';

function readStorage(): StoredSession {
  if (typeof window === 'undefined') {
    return { tokens: null, athlete: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tokens: null, athlete: null };
    const parsed = JSON.parse(raw) as StoredSession;
    return {
      tokens: parsed.tokens ?? null,
      athlete: parsed.athlete ?? null,
    };
  } catch {
    return { tokens: null, athlete: null };
  }
}

function writeStorage(payload: StoredSession) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore write errors */
  }
}

export const useStravaStore = defineStore('strava', () => {
  const initial = readStorage();
  const tokens = ref<TokenPayload | null>(initial.tokens);
  const athlete = ref<Record<string, unknown> | null>(initial.athlete);

  watch(
    [tokens, athlete],
    () => {
      writeStorage({ tokens: tokens.value, athlete: athlete.value });
    },
    { deep: true },
  );

  function setSession(payload: Partial<StoredSession>) {
    tokens.value = payload.tokens ?? null;
    athlete.value = payload.athlete ?? null;
  }

  function restoreFromStorage() {
    const restored = readStorage();
    tokens.value = restored.tokens;
    athlete.value = restored.athlete;
  }

  function clearSession() {
    tokens.value = null;
    athlete.value = null;
    writeStorage({ tokens: null, athlete: null });
  }

  return {
    tokens,
    athlete,
    setSession,
    clearSession,
    restoreFromStorage,
  };
});
