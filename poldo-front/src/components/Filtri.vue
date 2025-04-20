<template>
  <div>
    <!-- Sidebar -->
    <div 
      class="sidebar" 
      :class="{ open: isSidebarOpen }"
    >
      <!-- Toggle Button (now inside sidebar) -->
      <button class="toggle-btn" @click="toggleSidebar">
        <span v-if="isSidebarOpen">×</span>
        <span v-else>☰</span>
      </button>

      <div class="sidebar-content" v-show="isSidebarOpen">
        <div class="sidebar-header">
          <h3>Filtri</h3>
        </div>

        <!-- Price Filter -->
        <div class="filter-section">
          <h4>Prezzo</h4>
          <div class="price-inputs">
            <label for="min-price">Min:</label>
            <input 
              id="min-price" 
              type="number" 
              v-model.number="priceRange.min" 
              :min="0" 
              :max="priceRange.max" 
              @input="validatePriceRange"
            />
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
        prezzo: this.priceRange,
      };
      this.$emit("filters-applied", filters);
    },
    resetFilters() {
      this.selections.ingredienti = [];
      this.selections.categorie = null;
      this.priceRange.min = 0;
      this.priceRange.max = 100;
      this.applyFilters();
    },
  },
  watch: {
    "selections.ingredienti": "applyFilters",
    "selections.categorie": "applyFilters",
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
  top: 100px; /* Positioned under the Navbar */
  left: 0;
  width: 30%;
  height: calc(100% - 100px); /* Adjust height to stay under the Navbar */
  background: var(--color-background, #fff);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 20;
  display: flex;
  flex-direction: column;
  border-radius: 0 10px 10px 0;
  transition: transform 0.3s ease;
  transform: translateX(-80%); /* Hide most of the sidebar by default */
}

.sidebar.open {
  transform: translateX(0); 
}

.sidebar-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow-y: auto;
  height: 100%;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  border-bottom: 1px solid var(--color-border, #ddd); 
  padding-bottom: 10px;
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
  background-color: var(--color-primary, #4caf50); 
  color: var(--color-on-primary, white); 
}

.reset-btn {
  background-color: var(--color-secondary, #f44336); 
  color: var(--color-on-secondary, white); 
}

.toggle-btn {
  position: absolute;
  top: 20px;
  right: 10px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  z-index: 30;
  }

/* Price Inputs */
.price-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-inputs label {
  font-weight: bold;
}

.price-inputs input {
  width: 40px;
  padding: 5px;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
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