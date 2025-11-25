<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
  sport_type?: string;
};

type Athlete = {
  firstname?: string;
  lastname?: string;
};

const stravaStore = useStravaStore();
const { tokens, athlete } = storeToRefs(stravaStore);

const activities = ref<Activity[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

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
      error instanceof Error
        ? error.message
        : '获取活动失败，请稍后重试。';
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
            Token 有效{{ athleteName ? ` · ${athleteName}` : '' }}，展示最近 20 条活动。
          </p>
          <p v-else-if="tokens">
            当前 token 已过期，请重新登录后再试。
          </p>
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
        </div>
      </div>
    </CardContent>
  </Card>
</template>
