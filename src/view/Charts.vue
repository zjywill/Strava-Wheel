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
      <CardTitle>Charts</CardTitle>
      <CardDescription>图表示例页。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>在此放置图表示例或嵌入实时统计数据。</p>
    </CardContent>
  </Card>
</template>
