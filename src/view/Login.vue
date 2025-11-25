<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { storeToRefs } from 'pinia';
import { useStravaStore } from '@/stores/strava';
import type { TokenPayload } from '@/stores/strava';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';
const TOKEN_URL = 'https://www.strava.com/oauth/token';
const credentialStorageKey = 'strava.credentials.v1';

type SavedCred = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

const clientId = ref('');
const clientSecret = ref('');
const redirectUri = ref(`${window.location.origin}/login`);
const authCode = ref('');
const isLoadingProfile = ref(false);
const errorMessage = ref('');

const stravaStore = useStravaStore();
const { tokens, athlete } = storeToRefs(stravaStore);

const isTokenValid = computed(() => {
  const token = tokens.value;
  if (!token?.expires_at) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return token.expires_at > nowInSeconds;
});

const loginButtonLabel = computed(() =>
  isTokenValid.value ? '重新登录' : '登录 Strava'
);

function persistCred() {
  try {
    sessionStorage.setItem(
      credentialStorageKey,
      JSON.stringify({
        clientId: clientId.value,
        clientSecret: clientSecret.value,
        redirectUri: redirectUri.value,
      } satisfies SavedCred)
    );
  } catch {
    /* ignore */
  }
}

function restoreCred() {
  try {
    const raw = sessionStorage.getItem(credentialStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<SavedCred>;
    clientId.value = parsed.clientId ?? '';
    clientSecret.value = parsed.clientSecret ?? '';
    redirectUri.value = parsed.redirectUri ?? redirectUri.value;
  } catch {
    /* ignore */
  }
}

function startLogin() {
  errorMessage.value = '';
  if (!clientId.value || !clientSecret.value) {
    errorMessage.value = '请先填写 STRAVA_CLIENT_ID 与 STRAVA_CLIENT_SECRET。';
    return;
  }

  persistCred();
  const params = new URLSearchParams({
    client_id: clientId.value,
    redirect_uri: redirectUri.value,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read,activity:read_all,activity:write',
  });
  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code: string) {
  errorMessage.value = '';
  isLoadingProfile.value = true;

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId.value,
        client_secret: clientSecret.value,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      throw new Error(`Strava token 请求失败: ${res.status}`);
    }

    const data = await res.json();
    const tokenPayload: TokenPayload | null = data?.access_token
      ? {
          token_type: data.token_type || 'Bearer',
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          expires_in: data.expires_in,
        }
      : null;

    stravaStore.setSession({
      tokens: tokenPayload,
      athlete: data?.athlete ?? null,
    });

    // 清理 URL 中的 code，避免重复交换
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('scope');
    url.searchParams.delete('state');
    window.history.replaceState({}, '', url.toString());
    authCode.value = '';
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取 token 失败，请检查填写的凭证与网络。';
  } finally {
    isLoadingProfile.value = false;
  }
}

onMounted(() => {
  restoreCred();
  stravaStore.restoreFromStorage();

  const url = new URL(window.location.href);
  const codeParam = url.searchParams.get('code');
  if (codeParam) {
    authCode.value = codeParam;
    exchangeCodeForToken(codeParam);
  }
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Strava 登录</CardTitle>
      <CardDescription
        >前端直接发起 Strava OAuth，获取的 token 将保存到
        localStorage。</CardDescription
      >
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Label for="strava-client-id">STRAVA_CLIENT_ID</Label>
        <Input
          id="strava-client-id"
          v-model="clientId"
          placeholder="请输入 STRAVA_CLIENT_ID"
          required
        />
        <p class="text-xs text-muted-foreground">
          填写你在 Strava 创建的应用 Client ID。
        </p>
      </div>

      <div class="space-y-2">
        <Label for="strava-client-secret">STRAVA_CLIENT_SECRET</Label>
        <Input
          id="strava-client-secret"
          v-model="clientSecret"
          type="password"
          placeholder="请输入 STRAVA_CLIENT_SECRET"
          required
        />
        <p class="text-xs text-muted-foreground">
          填写对应的 Client Secret，注意保密。
        </p>
      </div>

      <div class="space-y-3">
        <Button
          type="button"
          class="w-full"
          :disabled="!clientId || !clientSecret"
          @click="startLogin"
        >
          {{ loginButtonLabel }}
        </Button>
        <p class="text-xs text-muted-foreground">
          点击后会跳转到 Strava 授权页，回调时携带的 code 会在本页自动换取 Token
          并保存。
        </p>
        <p v-if="errorMessage" class="text-xs text-destructive">
          {{ errorMessage }}
        </p>
      </div>

      <div class="space-y-2">
        <div
          v-if="tokens"
          class="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs"
        >
          <p class="font-semibold text-foreground">
            Token（已存 localStorage）
          </p>
          <pre
            class="mt-2 whitespace-pre-wrap break-words text-muted-foreground"
            >{{ JSON.stringify(tokens, null, 2) }}
          </pre>
        </div>

        <div
          v-if="athlete"
          class="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs"
        >
          <p class="font-semibold text-foreground">Athlete</p>
          <pre
            class="mt-2 whitespace-pre-wrap break-words text-muted-foreground"
            >{{ JSON.stringify(athlete, null, 2) }}
          </pre>
        </div>

        <p class="text-xs text-muted-foreground">
          回调地址默认为当前页面：<code>{{ redirectUri }}</code>
        </p>
      </div>
    </CardContent>
  </Card>
</template>
