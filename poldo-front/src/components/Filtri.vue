<!-- Filtri.vue (Disposizione orizzontale) -->
<template>
    <div class="filtri-container">
      <h3>Filtri</h3>
      <div class="filtri-row">
        <!-- FILTRO INGREDIENTI -->
        <div class="filtro-dropdown">
          <div class="filtro-header" @click="toggleDropdown('ingredienti')">
            <h4>Ingredienti</h4>
            <div class="arrow" :class="{ 'open': dropdownStates.ingredienti }">
              <span>&#9660;</span>
            </div>
          </div>
          
          <div class="filtro-content" v-if="dropdownStates.ingredienti">
            <div class="input-group">
              <input 
                v-model="searchTexts.ingredienti" 
                type="text" 
                placeholder="Cerca ingredienti..." 
                @input="filterItems('ingredienti')"
              />
            </div>
            <div class="checkbox-group">
              <div v-for="item in filteredLists.ingredienti" :key="item.id" class="item-row">
                <input 
                  type="checkbox" 
                  :id="'ing-' + item.id" 
                  :value="item.id" 
                  v-model="selections.ingredienti" 
                  @change="updateFilters('ingredienti', selections.ingredienti)"
                />
                <label :for="'ing-' + item.id">{{ item.nome }}</label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- FILTRO PREZZO -->
        <div class="filtro-dropdown">
          <div class="filtro-header" @click="toggleDropdown('prezzo')">
            <h4>Prezzo</h4>
            <div class="arrow" :class="{ 'open': dropdownStates.prezzo }">
              <span>&#9660;</span>
            </div>
          </div>
          
          <div class="filtro-content" v-if="dropdownStates.prezzo">
            <div class="range-container">
              <span>€{{ priceRange.min }}</span>
              <div class="sliders-container">
                <input 
                  type="range" 
                  v-model.number="priceRange.min" 
                  :min="0" 
                  :max="priceRange.max" 
                  @input="validatePriceRange"
                  @change="updateFilters('prezzo', priceRange)"
                />
                <input 
                  type="range" 
                  v-model.number="priceRange.max" 
                  :min="priceRange.min" 
                  :max="100" 
                  @input="validatePriceRange"
                  @change="updateFilters('prezzo', priceRange)"
                />
              </div>
              <span>€{{ priceRange.max }}</span>
            </div>
          </div>
        </div>
        
        <!-- FILTRO CATEGORIE -->
        <div class="filtro-dropdown">
          <div class="filtro-header" @click="toggleDropdown('categorie')">
            <h4>Categorie</h4>
            <div class="arrow" :class="{ 'open': dropdownStates.categorie }">
              <span>&#9660;</span>
            </div>
          </div>
          
          <div class="filtro-content" v-if="dropdownStates.categorie">
            <div class="radio-group">
              <div v-for="item in filteredLists.categorie" :key="item.id" class="item-row">
                <input 
                  type="radio" 
                  :id="'cat-' + item.id" 
                  :value="item.id" 
                  v-model="selections.categorie" 
                  @change="updateFilters('categorie', selections.categorie ? [selections.categorie] : [])"
                />
                <label :for="'cat-' + item.id">{{ item.nome }}</label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ALTRI FILTRI QUI -->
        
      </div>
      <div class="filtri-actions">
        <button @click="applyFilters" class="apply-btn">Applica Filtri</button>
        <button @click="resetFilters" class="reset-btn">Reset</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Filtri',
    data() {
      return {
        // Dati dei filtri
        lists: {
          ingredienti: [
            { id: 1, nome: 'Pomodoro' },
            { id: 2, nome: 'Mozzarella' },
            { id: 3, nome: 'Basilico' },
            { id: 4, nome: 'Farina' },
            { id: 5, nome: 'Funghi' },
            { id: 6, nome: 'Prosciutto' },
            { id: 7, nome: 'Olive' },
            { id: 8, nome: 'Peperoni' },
          ],
          categorie: [
            { id: 1, nome: 'Pizza' },
            { id: 2, nome: 'Pasta' },
            { id: 3, nome: 'Carne' },
            { id: 4, nome: 'Pesce' },
            { id: 5, nome: 'Dolci' },
          ]
        },
        
        // Stato dei dropdown
        dropdownStates: {
          ingredienti: false,
          prezzo: false,
          categorie: false
        },
        
        // Selezioni correnti
        selections: {
          ingredienti: [],
          categorie: null
        },
        
        // Filtri attivi
        activeFilters: {
          ingredienti: [],
          prezzo: { min: 0, max: 100 },
          categorie: []
        },
        
        // Stato della ricerca
        searchTexts: {
          ingredienti: '',
          categorie: ''
        },
        
        // Liste filtrate per la ricerca
        filteredLists: {
          ingredienti: [],
          categorie: []
        },
        
        // Range di prezzo
        priceRange: {
          min: 0,
          max: 100
        }
      };
    },
    created() {
      // Inizializza le liste filtrate
      this.filteredLists.ingredienti = [...this.lists.ingredienti];
      this.filteredLists.categorie = [...this.lists.categorie];
    },
    methods: {
      // Gestione dei dropdown
      toggleDropdown(type) {
        // Chiude gli altri dropdown quando ne viene aperto uno
        if (!this.dropdownStates[type]) {
          for (const key in this.dropdownStates) {
            if (key !== type) {
              this.dropdownStates[key] = false;
            }
          }
        }
        this.dropdownStates[type] = !this.dropdownStates[type];
      },
      
      // Filtraggio degli elementi in base alla ricerca
      filterItems(type) {
        if (this.searchTexts[type]) {
          this.filteredLists[type] = this.lists[type].filter(item => 
            item.nome.toLowerCase().includes(this.searchTexts[type].toLowerCase())
          );
        } else {
          this.filteredLists[type] = [...this.lists[type]];
        }
      },
      
      // Validazione del range di prezzo
      validatePriceRange() {
        if (this.priceRange.min > this.priceRange.max) {
          this.priceRange.min = this.priceRange.max;
        }
      },
      
      // Aggiornamento dei filtri attivi
      updateFilters(filterType, value) {
        this.activeFilters[filterType] = value;
      },
      
      // Applicazione dei filtri
      applyFilters() {
        // Emette l'evento con i filtri attivi verso il componente padre
        this.$emit('filters-applied', this.activeFilters);
      },
      
      // Reset dei filtri
      resetFilters() {
        // Reset delle selezioni
        this.selections.ingredienti = [];
        this.selections.categorie = null;
        this.searchTexts.ingredienti = '';
        this.searchTexts.categorie = '';
        this.priceRange.min = 0;
        this.priceRange.max = 100;
        
        // Reset dei filtri attivi
        this.activeFilters = {
          ingredienti: [],
          prezzo: { min: 0, max: 100 },
          categorie: []
        };
        
        // Reset delle liste filtrate
        this.filteredLists.ingredienti = [...this.lists.ingredienti];
        this.filteredLists.categorie = [...this.lists.categorie];
        
        // Notifica anche il componente padre
        this.$emit('filters-applied', this.activeFilters);
      }
    }
  };
  </script>
  
  <style scoped>
  .filtri-container {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    background-color: #f9f9f9;
  }
  
  /* Modificata da filtri-list a filtri-row per layout orizzontale */
  .filtri-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap; /* Permette il wrap su schermi piccoli */
  }
  
  .filtri-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  }
  
  .apply-btn, .reset-btn {
    padding: 8px 15px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  
  .apply-btn {
    background-color: #4caf50;
    color: white;
  }
  
  .reset-btn {
    background-color: #f44336;
    color: white;
  }
  
  /* Stili per i filtri a tendina */
  .filtro-dropdown {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #e0e0e0;
    position: relative;
    min-width: 150px; /* Larghezza minima per i filtri */
    flex-grow: 1;
    flex-basis: 0;
  }
  
  .filtro-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    cursor: pointer;
    background-color: #f9f9f9;
    border-bottom: 1px solid #e0e0e0;
    user-select: none;
  }
  
  .filtro-header h4 {
    margin: 0;
    font-weight: 500;
  }
  
  .arrow {
    transition: transform 0.2s ease;
  }
  
  .arrow.open {
    transform: rotate(180deg);
  }
  
  .filtro-content {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    z-index: 10;
    background: white;
    padding: 12px 15px;
    border: 1px solid #e0e0e0;
    border-top: none;
    border-radius: 0 0 6px 6px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  /* Stili per la ricerca */
  .input-group {
    margin-bottom: 10px;
  }
  
  .input-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  /* Stili per i gruppi di checkbox e radio */
  .checkbox-group, .radio-group {
    max-height: 150px;
    overflow-y: auto;
  }
  
  .item-row {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
  }
  
  .item-row input {
    margin-right: 8px;
  }
  
  /* Stili per il range di prezzo */
  .range-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  
  .sliders-container {
    margin: 10px 0;
    position: relative;
  }
  
  input[type="range"] {
    width: 100%;
    margin: 5px 0;
  }
  
  /* Stili responsive */
  @media (max-width: 768px) {
    .filtri-row {
      flex-direction: column;
    }
    
    .filtro-dropdown {
      width: 100%;
    }
    
    .filtri-actions {
      flex-direction: column;
    }
    
    .apply-btn, .reset-btn {
      width: 100%;
    }
  }
  </style>