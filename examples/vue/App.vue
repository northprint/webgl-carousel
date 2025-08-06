<template>
  <div class="app">
    <header class="app-header">
      <h1>WebGL Carousel - Vue Integration</h1>
    </header>

    <div class="carousel-container">
      <WebGLCarouselVue
        :images="images"
        :effect="selectedEffect"
        :autoplay="isAutoplay"
        :transition-duration="transitionDuration"
        :loop="true"
        :preload="true"
        @image-change="handleImageChange"
        @transition-start="handleTransitionStart"
        @transition-end="handleTransitionEnd"
      />
    </div>

    <div class="status-bar">
      <span>Current Image: {{ currentIndex + 1 }} / {{ images.length }}</span>
      <span>Effect: {{ selectedEffect }}</span>
      <span>Duration: {{ transitionDuration }}ms</span>
    </div>

    <div class="controls">
      <div class="control-group">
        <h3>Effects</h3>
        <div class="effects-grid">
          <button
            v-for="effect in effects"
            :key="effect"
            :class="['effect-btn', { active: selectedEffect === effect }]"
            @click="selectedEffect = effect"
          >
            {{ effect }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <h3>Settings</h3>
        <div class="settings">
          <label>
            <input
              type="checkbox"
              v-model="isAutoplay"
            />
            Autoplay
          </label>
          
          <label>
            Transition Duration:
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              v-model.number="transitionDuration"
            />
            <span>{{ transitionDuration }}ms</span>
          </label>

          <label>
            Autoplay Interval:
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              v-model.number="autoplayInterval"
            />
            <span>{{ autoplayInterval }}ms</span>
          </label>
        </div>
      </div>
    </div>

    <div class="info">
      <h2>Vue 3 Integration Features</h2>
      <ul>
        <li>Vue 3 Composition API</li>
        <li>Reactive state management</li>
        <li>Event handling with @ syntax</li>
        <li>Two-way binding with v-model</li>
        <li>TypeScript support</li>
      </ul>
      
      <h3>Usage Example</h3>
      <pre><code>{{ codeExample }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { WebGLCarouselVue } from 'webgl-carousel/vue';
import type { Effect } from 'webgl-carousel';

const images = [
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop'
];

const effects: Effect[] = [
  'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown',
  'wave', 'distortion', 'dissolve', 'circle', 'glitch'
];

const currentIndex = ref(0);
const selectedEffect = ref<Effect>('fade');
const isAutoplay = ref(false);
const transitionDuration = ref(1500);
const autoplayInterval = ref(3000);

const handleImageChange = (index: number) => {
  currentIndex.value = index;
  console.log('Image changed to:', index);
};

const handleTransitionStart = () => {
  console.log('Transition started');
};

const handleTransitionEnd = () => {
  console.log('Transition ended');
};

const codeExample = `<template>
  <WebGLCarouselVue
    :images="images"
    :effect="selectedEffect"
    :autoplay="true"
    :transition-duration="1500"
    @image-change="handleImageChange"
  />
</template>

<script setup>
import { WebGLCarouselVue } from 'webgl-carousel/vue';

const images = ['image1.jpg', 'image2.jpg'];
const selectedEffect = ref('fade');

const handleImageChange = (index) => {
  console.log('Changed to image:', index);
};
<\/script>`;
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  padding: 20px;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.app-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.carousel-container {
  max-width: 1200px;
  height: 600px;
  margin: 0 auto;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.status-bar {
  max-width: 1200px;
  margin: 20px auto;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  display: flex;
  justify-content: space-around;
  font-size: 1.1rem;
  backdrop-filter: blur(10px);
}

.controls {
  max-width: 1200px;
  margin: 30px auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.control-group {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.control-group h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5rem;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.effect-btn {
  padding: 10px 15px;
  background: #f0f0f0;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.effect-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.effect-btn.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.settings label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #333;
}

.settings input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.settings input[type="range"] {
  flex: 1;
  margin: 0 10px;
}

.settings span {
  min-width: 60px;
  text-align: right;
  font-weight: 600;
  color: #42b883;
}

.info {
  max-width: 1200px;
  margin: 30px auto;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.info h2 {
  color: #333;
  margin-bottom: 20px;
}

.info h3 {
  color: #555;
  margin-top: 30px;
  margin-bottom: 15px;
}

.info ul {
  list-style-type: none;
  padding: 0;
}

.info li {
  padding: 8px 0;
  padding-left: 25px;
  position: relative;
  color: #555;
}

.info li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #42b883;
  font-weight: bold;
}

.info pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
}

.info code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre;
}

@media (max-width: 768px) {
  .controls {
    grid-template-columns: 1fr;
  }
  
  .carousel-container {
    height: 400px;
  }
  
  .app-header h1 {
    font-size: 1.8rem;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>