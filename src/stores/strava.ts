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
  wheel: WheelSettings;
};

export type WheelSettings = {
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
};

const STORAGE_KEY = 'strava.session.v1';
const defaultWheelSettings: WheelSettings = {
  model: '',
  baseUrl: '',
  apiKey: '',
  systemPrompt: '',
};

function readStorage(): StoredSession {
  if (typeof window === 'undefined') {
    return { tokens: null, athlete: null, wheel: { ...defaultWheelSettings } };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw)
      return { tokens: null, athlete: null, wheel: { ...defaultWheelSettings } };
    const parsed = JSON.parse(raw) as StoredSession;
    const parsedWheel =
      typeof parsed.wheel === 'object' && parsed.wheel !== null
        ? parsed.wheel
        : { ...defaultWheelSettings };
    return {
      tokens: parsed.tokens ?? null,
      athlete: parsed.athlete ?? null,
      wheel: { ...defaultWheelSettings, ...parsedWheel },
    };
  } catch {
    return { tokens: null, athlete: null, wheel: { ...defaultWheelSettings } };
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
  // WheelLoop 配置，存本地用于生成锐评
  const wheelSettings = ref<WheelSettings>(initial.wheel);

  watch(
    [tokens, athlete, wheelSettings],
    () => {
      writeStorage({
        tokens: tokens.value,
        athlete: athlete.value,
        wheel: wheelSettings.value,
      });
    },
    { deep: true },
  );

  function setSession(payload: Partial<StoredSession>) {
    tokens.value = payload.tokens ?? null;
    athlete.value = payload.athlete ?? null;
  }

  function setWheelSettings(payload: Partial<WheelSettings>) {
    wheelSettings.value = {
      ...wheelSettings.value,
      ...payload,
    };
  }

  function restoreFromStorage() {
    const restored = readStorage();
    tokens.value = restored.tokens;
    athlete.value = restored.athlete;
    wheelSettings.value = restored.wheel;
  }

  function clearSession() {
    tokens.value = null;
    athlete.value = null;
    writeStorage({ tokens: null, athlete: null, wheel: wheelSettings.value });
  }

  return {
    tokens,
    athlete,
    wheelSettings,
    setSession,
    setWheelSettings,
    clearSession,
    restoreFromStorage,
  };
});
