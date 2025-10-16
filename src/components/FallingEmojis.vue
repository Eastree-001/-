<template>
  <div class="falling-container">
    <span v-for="i in 30" :key="i" class="emoji" :style="getStyle(i)"></span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emojis = ['👑', '✨', '🏆', '🥇', '🎉', '🚀', '👍', '🔥'];

const getStyle = (i: number) => {
  const size = Math.random() * 1 + 0.5; // 1rem to 3rem
  const left = Math.random() * 100;
  const delay = Math.random() * 10; // 0 to 10s delay
  const duration = Math.random() * 5 + 10; // 5 to 10s duration
  const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return {
    '--emoji': `'${selectedEmoji}'`,
    fontSize: `${size}rem`,
    left: `${left}vw`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};
</script>

<style scoped>
.falling-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 999;
}

.emoji {
  position: absolute;
  top: -10%;
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.emoji::before {
  content: var(--emoji);
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0);
  }
  100% {
    transform: translateY(110vh) rotate(360deg);
    opacity: 0;
  }
}
</style>
