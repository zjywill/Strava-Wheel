<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Separator } from '@/components/ui/separator';
import ModeToggle from './components/ModeToggle.vue';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Login', to: '/login' },
  { label: 'Activities', to: '/activities' },
];

const route = useRoute();
const activePath = computed(() => route.path);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header
      class="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur"
    >
      <div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <RouterLink
          to="/"
          class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40"
        >
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-background shadow-sm"
            aria-hidden="true"
          >
            <Icon icon="lucide:slash" class="h-4 w-4" />
          </span>
          <span class="text-sm font-semibold tracking-tight">Strava Wheel</span>
        </RouterLink>

        <nav class="flex items-center gap-3 text-sm">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-2 py-1 transition-colors"
            :class="
              activePath === item.to
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            "
            :aria-current="activePath === item.to ? 'page' : undefined"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-3">
          <Separator orientation="vertical" class="hidden h-6 md:block" />

          <ModeToggle />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
