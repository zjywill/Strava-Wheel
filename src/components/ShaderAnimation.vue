<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import * as THREE from 'three';

type SceneBundle = {
  camera: THREE.Camera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
  uniforms: {
    time: { value: number };
    resolution: { value: THREE.Vector2 };
  };
  animationId: number;
};

const containerRef = ref<HTMLDivElement | null>(null);
// Use shallowRef to avoid Vue making Three.js objects reactive proxies (which breaks internals).
const sceneRef = shallowRef<SceneBundle | null>(null);

const vertexShader = `
  void main() {
    gl_Position = vec4( position, 1.0 );
  }
`;

const fragmentShader = `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359

  precision highp float;
  uniform vec2 resolution;
  uniform float time;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time*0.05;
    float lineWidth = 0.002;

    vec3 color = vec3(0.0);
    for(int j = 0; j < 3; j++){
      for(int i=0; i < 5; i++){
        color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
      }
    }
    
    gl_FragColor = vec4(color[0],color[1],color[2],1.0);
  }
`;

const handleResize = () => {
  const container = containerRef.value;
  const state = sceneRef.value;
  if (!container || !state) return;

  const { renderer, uniforms } = state;
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);
  uniforms.resolution.value.x = renderer.domElement.width;
  uniforms.resolution.value.y = renderer.domElement.height;
};

const animate = () => {
  const state = sceneRef.value;
  if (!state) return;

  state.animationId = requestAnimationFrame(animate);
  state.uniforms.time.value += 0.05;
  state.renderer.render(state.scene, state.camera);
};

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  const camera = new THREE.Camera();
  camera.position.z = 1;

  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);

  const uniforms = {
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  sceneRef.value = {
    camera,
    scene,
    renderer,
    geometry,
    material,
    uniforms,
    animationId: 0,
  };

  handleResize();
  window.addEventListener('resize', handleResize, false);

  animate();
});

onBeforeUnmount(() => {
  const state = sceneRef.value;
  window.removeEventListener('resize', handleResize);

  if (!state) return;

  cancelAnimationFrame(state.animationId);

  const container = containerRef.value;
  if (container && state.renderer.domElement) {
    container.removeChild(state.renderer.domElement);
  }

  state.renderer.dispose();
  state.geometry.dispose();
  state.material.dispose();
  sceneRef.value = null;
});
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-screen"
    style="background: #000; overflow: hidden"
  />
</template>
