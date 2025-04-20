<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import IconMenu from './icons/IconMenu.vue'

const router = useRouter()
const showMenu = ref(false)

defineProps<{
  img_profilo: string
  nome: string
}>()

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const filteredRoutes = router.getRoutes().filter(route => 
  route.name && !route.path.includes(':')
)

const t = [
    {
        name: 'Home',
        path: '/'
    },
    {
        name: 'Prodotti',
        path: '/prodotti'
    },
    {
        name: 'Carrello',
        path: '/carrello'
    }
]
</script>


<!-- https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c -->

<template>
    <div class="navbar">
        <div class="menu-icon" @click="toggleMenu">
            <IconMenu />
        </div>

        <div class="dropdown-menu" v-show="showMenu">
            <ul>
                <li v-for="route in t" :key="route.path">
                    <router-link :to="route.path" @click="toggleMenu">
                        {{ route.name }}
                    </router-link>
                </li>
            </ul>
        </div>

        <div id="img-poldo"></div>
        <img :src="img_profilo" alt="Profilo" />
    </div>
</template>


<style>
.navbar {
    height: 70px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #ffcc00;
    color: white;
    border-radius: 20px;
    position: relative;
}

.navbar a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
}

.menu-icon {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.dropdown-menu {
    position: absolute;
    top: 70px;
    left: 0;
    background-color: #ffcc00;
    border-radius: 0 0 10px 10px;
    width: 200px;
    z-index: 100;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.dropdown-menu li {
    padding: 0;
}

.dropdown-menu a {
    display: block;
    padding: 12px 16px;
    text-decoration: none;
    color: white;
}

.dropdown-menu a:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

#img-poldo {
    position: absolute;
    left: 50vw;
    top: 50%;
    transform: translate(-50%, -50%);
    height: 40px;
    width: 15em;
    background-color: red;
    border-radius: 15px;
}

.navbar>img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}
</style>
