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
      <CardTitle>Docs</CardTitle>
      <CardDescription>这里是示例文档页内容。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>欢迎使用导航栏。点击上方的链接在不同页面之间切换，体验路由与暗黑模式的组合效果。</p>
    </CardContent>
  </Card>
</template>
