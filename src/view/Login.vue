<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

function ensureHashLogin() {
  // 强制使用 hash 路由的登录回调
  return `${window.location.origin}/#/login`;
}

const clientId = ref('');
const clientSecret = ref('');
const redirectUri = ref(ensureHashLogin());
const defaultSystemPrompt =
  '你是毒舌又幽默的运动解说员，用一句精炼的中文锐评点评用户的运动表现，保持轻松但不要太刻薄，不要重复活动的原始字段。';
const wheelModel = ref('');
const wheelBaseUrl = ref('');
const wheelApiKey = ref('');
const wheelSystemPrompt = ref('');
const authCode = ref('');
const isLoadingProfile = ref(false);
const errorMessage = ref('');

const stravaStore = useStravaStore();
const { tokens, athlete, wheelSettings } = storeToRefs(stravaStore);

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
    redirectUri.value = ensureHashLogin();
  } catch {
    /* ignore */
  }
}

function restoreWheelSettings() {
  wheelModel.value = wheelSettings.value.model ?? '';
  wheelBaseUrl.value = wheelSettings.value.baseUrl ?? '';
  wheelApiKey.value = wheelSettings.value.apiKey ?? '';
  wheelSystemPrompt.value =
    wheelSettings.value.systemPrompt || defaultSystemPrompt;
}

function extractCodeFromLocation() {
  const url = new URL(window.location.href);
  // 先取 search 参数
  const directCode = url.searchParams.get('code');
  if (directCode) return directCode;

  // hash 路由下 code 会落在 #/login?code=xxx
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const [, hashQuery = ''] = hash.split('?');
  if (!hashQuery) return null;
  const hashParams = new URLSearchParams(hashQuery);
  return hashParams.get('code');
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

    // 清理 URL 中的 code，避免重复交换（兼容 hash 路由）
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('scope');
    url.searchParams.delete('state');
    if (url.hash.includes('?')) {
      const [hashPath, hashQuery = ''] = url.hash.slice(1).split('?');
      const hashParams = new URLSearchParams(hashQuery);
      hashParams.delete('code');
      hashParams.delete('scope');
      hashParams.delete('state');
      const newHashQuery = hashParams.toString();
      url.hash = newHashQuery ? `#${hashPath}?${newHashQuery}` : `#${hashPath}`;
    }
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

function saveWheelSettings() {
  stravaStore.setWheelSettings({
    model: wheelModel.value.trim(),
    baseUrl: wheelBaseUrl.value.trim(),
    apiKey: wheelApiKey.value.trim(),
    systemPrompt: wheelSystemPrompt.value.trim(),
  });
}

onMounted(() => {
  restoreCred();
  stravaStore.restoreFromStorage();
  restoreWheelSettings();

  const codeParam = extractCodeFromLocation();
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

      <div class="space-y-2 border-t border-border/60 pt-4">
        <p class="text-sm font-semibold text-foreground">WheelLoop 配置</p>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="wheel-model">模型</Label>
            <Input
              id="wheel-model"
              v-model="wheelModel"
              placeholder="如 gpt-4o-mini"
            />
            <p class="text-xs text-muted-foreground">
              可填写自定义模型名称，留空则使用默认。
            </p>
          </div>
          <div class="space-y-2">
            <Label for="wheel-base-url">Base URL（可选）</Label>
            <Input
              id="wheel-base-url"
              v-model="wheelBaseUrl"
              placeholder="自定义 OpenAI Base URL"
            />
            <p class="text-xs text-muted-foreground">
              如果需要自定义/代理 OpenAI，可填写 Base URL。
            </p>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="wheel-api-key">API Key</Label>
          <Input
            id="wheel-api-key"
            v-model="wheelApiKey"
            type="password"
            placeholder="必填，用于生成锐评"
          />
          <p class="text-xs text-muted-foreground">
            用于生成锐评，保存在 localStorage。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="wheel-system-prompt">System Prompt</Label>
          <Textarea
            id="wheel-system-prompt"
            v-model="wheelSystemPrompt"
            rows="3"
            placeholder="自定义锐评的 System Prompt，不填则使用默认"
          />
          <p class="text-xs text-muted-foreground">
            用来自定义生成锐评的风格，留空则使用默认的毒舌幽默提示。
          </p>
        </div>
        <Button type="button" class="w-full" @click="saveWheelSettings">
          保存 WheelLoop 配置
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
