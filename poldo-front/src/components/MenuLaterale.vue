<script setup lang="ts">
import { defineProps, PropType, reactive } from 'vue';

interface Page {
  id: number;
  name: string;
  path: string;
}

const props = defineProps({
  pages: {
    type: Array as PropType<Page[]>,
    required: true
  }
});

const visibilityState = reactive<Record<number, boolean>>({});

// Initialize visibility state for all pages
props.pages.forEach(page => {
  visibilityState[page.id] = true;
});


const clickPage = (pageId: number): void => {
    const page = props.pages.find(p => p.id === pageId);
    if (page) {
        console.log(`Navigating to ${page.name}`);
        window.location.href = page.path;
    }
};

</script>

<template>
  <div class="menu-laterale">
    <span 
      v-for="page in pages" 
      :key="page.id"
      @click="clickPage(page.id)"
      :class="{ 'hidden': !visibilityState[page.id] }"
    >
      {{ page.name }}
    </span>
  </div>
</template>

<style scoped>
.menu-laterale {
  margin: 15px;
  border-radius: 15px;
  position: fixed;
  top: 85px;
  left: 0;
  max-width: 250px;
  background-color: #f8f9fa;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  justify-content: center;
}

.menu-laterale > span {
  color: black;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.menu-laterale > span:hover {
  opacity: 0.7;
}

.hidden {
  display: none;
}
</style>