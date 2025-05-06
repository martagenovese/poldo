// src/stores/filters.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5005/v1',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDksInJ1b2xvIjoic3R1ZGVudGUiLCJpYXQiOjE3NDQzMDc3NjksImV4cCI6MTc3NTg2NTM2OX0.mdqnDVZpEotkEEXMaCj9f-rfYBx_b4WeJr97g3L6MP8'
}

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

async function handleRequest<T>(endpoint: string, errorMsg: string): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`
  const response = await fetch(url, { headers, mode: 'cors' })
  if (!response.ok) throw new Error(`${errorMsg}: ${response.status}`)
  return response.json()
}

export const useFiltersStore = defineStore('filters', () => {
  const allIngredients = ref<string[]>([])
  const allTags = ref<string[]>([])

  const fetchIngredients = async () => {
    try {
      const response = await handleRequest<{ nome: string }[]>('ingredienti', 'Errore fetch ingredienti')
      allIngredients.value = response
        .map(item => item.nome)
        .sort((a, b) => a.localeCompare(b))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const fetchTags = async () => {
    try {
      const response = await handleRequest<{ nome: string }[]>('tag', 'Errore fetch tags')
      allTags.value = response
        .map(item => item.nome)
        .sort((a, b) => a.localeCompare(b))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  /** Inizializza store caricando ingredienti e tag in parallelo */
  const initializeFilters = async () => {
    try {
      await Promise.all([
        fetchIngredients(),
        fetchTags()
      ])
    } catch (err) {
      console.error('initializeFilters failed:', err)
      throw err
    }
  }

  return {
    allIngredients,
    allTags,
    fetchIngredients,
    fetchTags,
    initializeFilters
  }
})
