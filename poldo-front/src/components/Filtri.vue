<template>
  <div ref="filtriContainer">
    <!-- Sidebar -->
    <div 
      class="sidebar" 
      :class="{ open: isSidebarOpen }"
    >
      <!-- Toggle Button  -->
      <button class="filtri-btn" @click="toggleSidebar">
        <span v-if="isSidebarOpen">×</span>
        <span v-else>Filtri</span>
      </button>

      <div class="sidebar-content" v-show="isSidebarOpen">
        <div class="sidebar-header">
          <h3 style="font-weight: 500;">Filtri</h3>
        </div>

        <!-- Price Filter -->
        <div class="filter-section">
          <h4>Prezzo</h4>
          <div class="price-inputs">
            <div class="price-row">
              <label for="min-price">Min:</label>
              <input 
                id="min-price" 
                type="number" 
                v-model.number="priceRange.min" 
                :min="0" 
                :max="priceRange.max" 
                @input="validatePriceRange"
              />
            </div>
            <div class="price-row">
              <label for="max-price">Max:</label>
              <input 
                id="max-price" 
                type="number" 
                v-model.number="priceRange.max" 
                :min="priceRange.min" 
                :max="100" 
                @input="validatePriceRange"
              />
            </div>
          </div>
        </div>

        <!-- Ingredients Filter -->
        <div class="filter-section">
          <h4>Ingredienti</h4>
          <div class="checkbox-group">
            <div 
              v-for="item in lists.ingredienti" 
              :key="item.id" 
              class="item-row"
            >
              <input 
                type="checkbox" 
                :id="'ing-' + item.id" 
                :value="item.id" 
                v-model="selections.ingredienti"
              />
              <label :for="'ing-' + item.id">{{ item.nome }}</label>
            </div>
          </div>
        </div>

        <!-- Categories Filter -->
        <div class="filter-section">
          <h4>Categorie</h4>
          <div class="radio-group">
            <div 
              v-for="item in lists.categorie" 
              :key="item.id" 
              class="item-row"
            >
              <input 
                type="radio" 
                :id="'cat-' + item.id" 
                :value="item.id" 
                v-model="selections.categorie"
              />
              <label :for="'cat-' + item.id">{{ item.nome }}</label>
            </div>
          </div>
        </div>

        <!-- Attivo Filter -->
        <div class="filter-section">
          <h4>Stato</h4>
          <div class="radio-group">
            <div class="item-row">
              <input 
                type="radio" 
                id="attivo-tutti" 
                :value="null" 
                v-model="selections.attivo"
              />
              <label for="attivo-tutti">Tutti</label>
            </div>
            <div class="item-row">
              <input 
                type="radio" 
                id="attivo-si" 
                :value="true" 
                v-model="selections.attivo"
              />
              <label for="attivo-si">Attivo</label>
            </div>
            <div class="item-row">
              <input 
                type="radio" 
                id="attivo-no" 
                :value="false" 
                v-model="selections.attivo"
              />
              <label for="attivo-no">Non Attivo</label>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="sidebar-actions">
          <button @click="resetFilters" class="reset-btn">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// TODO: interagire con il backend per ottenere le liste ingredienti e categorie
export default {
  name: "Filtri",
  data() {
    return {
      isSidebarOpen: false,
      lists: {
        ingredienti: [
          { id: 1, nome: "Pomodoro" },
          { id: 2, nome: "Mozzarella" },
          { id: 3, nome: "Basilico" },
          { id: 4, nome: "Farina" },
          { id: 5, nome: "Funghi" },
          { id: 6, nome: "Prosciutto" },
          { id: 7, nome: "Olive" },
          { id: 8, nome: "Peperoni" },
        ],
        categorie: [
          { id: 1, nome: "Pizza" },
          { id: 2, nome: "Pasta" },
          { id: 3, nome: "Carne" },
          { id: 4, nome: "Pesce" },
          { id: 5, nome: "Dolci" },
        ],
      },
      selections: {
        ingredienti: [],
        categorie: null,
        attivo: null,
      },
      priceRange: {
        min: 0,
        max: 100,
      },
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
      
      if (this.isSidebarOpen) {
        // Add event listener when sidebar opens
        setTimeout(() => {
          document.addEventListener('click', this.handleOutsideClick);
        }, 0);
      } else {
        // Remove event listener when sidebar closes manually
        document.removeEventListener('click', this.handleOutsideClick);
      }
    },
    handleOutsideClick(event) {
      // Check if click is outside the sidebar
      const container = this.$refs.filtriContainer;
      if (container && !container.contains(event.target)) {
        this.isSidebarOpen = false;
        document.removeEventListener('click', this.handleOutsideClick);
      }
    },
    validatePriceRange() {
      if (this.priceRange.min > this.priceRange.max) {
        this.priceRange.min = this.priceRange.max;
      }
      this.applyFilters();
    },
    applyFilters() {
      const filters = {
        ingredienti: this.selections.ingredienti,
        categorie: this.selections.categorie,
        attivo: this.selections.attivo,
        prezzo: this.priceRange,
      };
      this.$emit("filters-applied", filters);
    },
    resetFilters() {
      this.selections.ingredienti = [];
      this.selections.categorie = null;
      this.selections.attivo = null;
      this.priceRange.min = 0;
      this.priceRange.max = 100;
      this.applyFilters();
    },
  },
  mounted() {
    // Handle case where sidebar might be open on initial render
    if (this.isSidebarOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      }, 0);
    }
  },
  beforeUnmount() {
    // Clean up event listener when component is destroyed
    document.removeEventListener('click', this.handleOutsideClick);
  },
  watch: {
    "selections.ingredienti": "applyFilters",
    "selections.categorie": "applyFilters",
    "selections.attivo": "applyFilters",
    priceRange: {
      handler: "applyFilters",
      deep: true,
    },
  },
};
</script>

<style scoped>

.sidebar {
    position: fixed;
    top: 100px; 
    left: 0;
    width: 40%;
    height: calc(95% - 110px); /* Adjust height to stay under the Navbar */
    background: var(--color-background-soft);
    box-shadow: 5px 0 5px var(--poldo-card-shadow);
    z-index: 20;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    transform: translateX(-70%); /* Hide most of the sidebar by default */
    border-radius: 0 20px 20px 0;
    overflow: hidden; 
}

.sidebar.open {
    transform: translateX(0); 
}

.sidebar-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    overflow-y: auto;
    height: 100%;
    margin: 20px 5px 20px 5px;
    padding: 0 15px 0 15px; 
    direction: rtl; /* This moves the scrollbar to the left */
}

/* This container reverses the direction back to normal for all child elements */
.sidebar-content > * {
    direction: ltr;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filter-section {
    border-bottom: 1px solid var(--color-border); 
    padding-bottom: 10px;
    width: 100%;
}

.sidebar-actions {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
}

.apply-btn,
.reset-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.apply-btn {
    background-color: var(--poldo-accent); 
    color: var(--poldo-text); 
}

.reset-btn {
    background-color: var(--red); 
    color: var(--poldo-text); 
}

.filtri-btn {
    position: absolute;
    top: 40px;
    right: -10px; 
    background: var(--poldo-primary);
    color: white;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    padding: 5px;
    width: 70px;
    cursor: pointer;
    z-index: 30;
    transform: rotate(90deg);
    transition: transform 0.3s ease;
}

.sidebar.open .filtri-btn {
    transform: rotate(0deg);
    top: 20px;
    right: 10px; 
    width: 30px;
    height: 30px;
}

/* Price Inputs */
.price-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.price-inputs label {
    font-weight: bold;
}

.price-inputs input {
    width: 50px;
    padding: 5px;
    border-radius: 4px;
    margin: 0 5px;
}

/* Checkbox and Radio Groups */
.checkbox-group, .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.item-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>