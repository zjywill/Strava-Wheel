<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Blocks</CardTitle>
      <CardDescription>区块/模版示例页。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>展示可复用的页面区块和模版，帮助快速拼装页面。</p>
    </CardContent>
  </Card>
</template>
