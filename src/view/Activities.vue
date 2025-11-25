<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from 'vue';
import OpenAI from 'openai';
import { storeToRefs } from 'pinia';
import { useStravaStore } from '@/stores/strava';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Activity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  description?: string;
  sport_type?: string;
};

type Athlete = {
  firstname?: string;
  lastname?: string;
};

const stravaStore = useStravaStore();
const { tokens, athlete, wheelSettings } = storeToRefs(stravaStore);

const activities = ref<Activity[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const reviewText = ref<Record<number, string>>({});
const reviewLoading = ref<Record<number, boolean>>({});
const reviewError = ref<Record<number, string>>({});
const publishLoading = ref<Record<number, boolean>>({});
const publishError = ref<Record<number, string>>({});
const publishSuccess = ref<Record<number, string>>({});

const isTokenValid = computed(() => {
  const token = tokens.value;
  if (!token?.expires_at) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return token.expires_at > nowInSeconds;
});

const tokenType = computed(() => tokens.value?.token_type || 'Bearer');

const athleteName = computed(() => {
  const data = athlete.value as Athlete | null;
  return data?.firstname ?? '';
});

const wheelConfig = computed(() => ({
  model: wheelSettings.value.model || 'gpt-4o-mini',
  baseUrl: wheelSettings.value.baseUrl || '',
  apiKey: wheelSettings.value.apiKey || '',
}));

function formatDistance(meters?: number) {
  if (meters === undefined || meters === null) return '—';
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds?: number) {
  if (seconds === undefined || seconds === null) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

async function loadActivities() {
  if (!tokens.value?.access_token) {
    activities.value = [];
    errorMessage.value = '请先登录获取 token。';
    return;
  }

  if (!isTokenValid.value) {
    activities.value = [];
    errorMessage.value = '当前 token 已过期，请重新登录。';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=20',
      {
        headers: {
          Authorization: `${tokenType.value} ${tokens.value.access_token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Strava 活动获取失败: ${res.status}`);
    }

    const data = await res.json();
    activities.value = Array.isArray(data) ? data : [];
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '获取活动失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  if (isTokenValid.value) {
    loadActivities();
  } else if (!tokens.value) {
    errorMessage.value = '请先登录获取 token。';
  } else {
    errorMessage.value = '当前 token 已过期，请重新登录。';
  }
});

watch(
  () => [tokens.value?.access_token, tokens.value?.expires_at],
  () => {
    activities.value = [];
    errorMessage.value = '';

    if (!tokens.value) {
      errorMessage.value = '请先登录获取 token。';
      return;
    }

    if (!isTokenValid.value) {
      errorMessage.value = '当前 token 已过期，请重新登录。';
      return;
    }

    loadActivities();
  }
);

function updateMapValue<T>(
  target: Ref<Record<number, T>>,
  key: number,
  value: T
) {
  target.value = { ...target.value, [key]: value };
}

async function generateReview(act: Activity) {
  const id = act.id;
  updateMapValue(reviewError, id, '');
  updateMapValue(reviewLoading, id, true);
  updateMapValue(publishError, id, '');
  updateMapValue(publishSuccess, id, '');

  const config = wheelConfig.value;

  if (!config.apiKey) {
    updateMapValue(
      reviewError,
      id,
      '缺少 OpenAI API Key，请在 Login 页填写或 .env 中配置 VITE_WHEELLOOP_API_KEY。'
    );
    updateMapValue(reviewLoading, id, false);
    return;
  }

  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    });

    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            '你是毒舌又幽默的运动解说员，用一句精炼的中文锐评点评用户的运动表现，保持轻松但不要太刻薄，不要重复活动的原始字段。',
        },
        {
          role: 'user',
          content: `请针对下面这条 Strava 活动生成一句不超过 40 字的锐评：\n${JSON.stringify(
            act
          )}`,
        },
      ],
    });

    updateMapValue(
      reviewText,
      id,
      completion.choices?.[0]?.message?.content?.trim() ||
        '生成失败，请稍后重试。'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '生成锐评失败，请稍后重试。';
    updateMapValue(reviewError, id, message);
  } finally {
    updateMapValue(reviewLoading, id, false);
  }
}

async function publishReview(act: Activity) {
  const id = act.id;
  updateMapValue(publishError, id, '');
  updateMapValue(publishSuccess, id, '');

  if (!tokens.value?.access_token || !isTokenValid.value) {
    updateMapValue(publishError, id, 'Token 无效，请重新登录后再试。');
    return;
  }

  const review = reviewText.value[id];
  if (!review) {
    updateMapValue(publishError, id, '请先生成锐评，再尝试发布。');
    return;
  }

  const newDescription = act.description
    ? `${act.description}\n\n锐评：${review}`
    : `锐评：${review}`;

  updateMapValue(publishLoading, id, true);
  try {
    const res = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenType.value} ${tokens.value.access_token}`,
      },
      body: JSON.stringify({ description: newDescription }),
    });

    if (!res.ok) {
      throw new Error(`发布失败：${res.status}`);
    }

    activities.value = activities.value.map((item) =>
      item.id === id ? { ...item, description: newDescription } : item
    );
    updateMapValue(publishSuccess, id, '已发布到 Strava 描述');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '发布失败，请稍后重试。';
    updateMapValue(publishError, id, message);
  } finally {
    updateMapValue(publishLoading, id, false);
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Activities</CardTitle>
      <CardDescription>使用当前 token 拉取的 Strava 活动。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <div class="text-muted-foreground">
          <p v-if="isTokenValid">
            Token 有效{{ athleteName ? ` · ${athleteName}` : '' }}，展示最近 20
            条活动。
          </p>
          <p v-else-if="tokens">当前 token 已过期，请重新登录后再试。</p>
          <p v-else>请先登录以获取 Strava token。</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          :disabled="isLoading || !isTokenValid"
          @click="loadActivities"
        >
          {{ isLoading ? '加载中…' : '刷新活动' }}
        </Button>
      </div>

      <p v-if="errorMessage" class="text-sm text-destructive">
        {{ errorMessage }}
      </p>

      <div v-if="isLoading" class="text-sm text-muted-foreground">
        正在从 Strava 拉取活动…
      </div>

      <div v-else-if="!activities.length" class="text-sm text-muted-foreground">
        {{ isTokenValid ? '暂无活动数据。' : '请确认 token 可用后再刷新。' }}
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="act in activities"
          :key="act.id"
          class="rounded-lg border border-border bg-muted/40 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-foreground">
                {{ act.name || '未命名活动' }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ formatDate(act.start_date_local) }} ·
                {{ act.sport_type || '运动' }}
              </p>
            </div>
            <div class="text-right text-xs text-muted-foreground">
              <p class="text-base font-semibold text-foreground">
                {{ formatDistance(act.distance) }}
              </p>
              <p>移动时间 {{ formatDuration(act.moving_time) }}</p>
            </div>
          </div>

          <div
            class="mt-3 space-y-2 rounded-md border border-dashed border-border bg-background/70 p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-semibold text-foreground">锐评</p>
              <Button
                size="sm"
                variant="secondary"
                :disabled="reviewLoading[act.id]"
                @click="generateReview(act)"
              >
                {{ reviewLoading[act.id] ? '生成中…' : '生成锐评' }}
              </Button>
              <Button
                size="sm"
                variant="outline"
                :disabled="publishLoading[act.id] || !reviewText[act.id]"
                @click="publishReview(act)"
              >
                {{ publishLoading[act.id] ? '发布中…' : '发布到 Strava' }}
              </Button>
              <p v-if="reviewError[act.id]" class="text-xs text-destructive">
                {{ reviewError[act.id] }}
              </p>
              <p v-if="publishError[act.id]" class="text-xs text-destructive">
                {{ publishError[act.id] }}
              </p>
              <p v-if="publishSuccess[act.id]" class="text-xs text-emerald-600">
                {{ publishSuccess[act.id] }}
              </p>
            </div>

            <p
              v-if="reviewText[act.id]"
              class="text-sm leading-relaxed text-foreground"
            >
              {{ reviewText[act.id] }}
            </p>
            <p v-else class="text-xs text-muted-foreground">
              点击生成一句犀利但幽默的活动点评。
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
