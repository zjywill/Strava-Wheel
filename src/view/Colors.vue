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
      <CardTitle>Colors</CardTitle>
      <CardDescription>色板示例页。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>在这里展示颜色样式、配色方案或生成器。</p>
    </CardContent>
  </Card>
</template>
