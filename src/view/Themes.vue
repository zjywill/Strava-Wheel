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
      <CardTitle>Themes</CardTitle>
      <CardDescription>主题示例页。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p>调整色板、字体和阴影，展示多套主题方案。</p>
    </CardContent>
  </Card>
</template>
