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
        <span v-for="page in pages" :key="page.id" @click="clickPage(page.id)"
            :class="{ 'hidden': !visibilityState[page.id] }">
            {{ page.name }}
        </span>
    </div>
</template>

<style scoped>
.menu-laterale {
    margin: 0;
    border-radius: 0 15px 15px 0;
    position: fixed;
    top: 85px;
    left: 0;
    max-width: 250px;
    max-height: calc(100vh - 85px);
    background-color: var(--menu-bg);
    box-shadow: 2px 0 5px var(--card-shadow);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    justify-content: flex-start;
    transition: background-color 0.5s;
    z-index: 10;
    overflow-y: auto;
}

.menu-laterale>span {
    color: var(--menu-text);
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.menu-laterale>span:hover {
    opacity: 0.7;
}

.hidden {
    display: none;
}
</style>