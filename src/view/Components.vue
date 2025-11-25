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
      <CardTitle>Components</CardTitle>
      <CardDescription>组件库示例页。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>在这里展示或列出你的组件，或引导用户前往文档查看详情。</p>
    </CardContent>
  </Card>
</template>
