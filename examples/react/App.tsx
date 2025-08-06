import React, { useState, useCallback } from 'react';
import { WebGLCarouselReact } from 'webgl-carousel/react';
import type { Effect } from 'webgl-carousel';
import './App.css';

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

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<Effect>('fade');
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(1500);

  const handleImageChange = useCallback((index: number) => {
    setCurrentIndex(index);
    console.log('Image changed to:', index);
  }, []);

  const handleTransitionStart = useCallback(() => {
    console.log('Transition started');
  }, []);

  const handleTransitionEnd = useCallback(() => {
    console.log('Transition ended');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>WebGL Carousel - React Integration</h1>
      </header>

      <div className="carousel-container">
        <WebGLCarouselReact
          images={images}
          effect={selectedEffect}
          autoplay={isAutoplay}
          transitionDuration={transitionDuration}
          loop={true}
          preload={true}
          onImageChange={handleImageChange}
          onTransitionStart={handleTransitionStart}
          onTransitionEnd={handleTransitionEnd}
        />
      </div>

      <div className="status-bar">
        <span>Current Image: {currentIndex + 1} / {images.length}</span>
        <span>Effect: {selectedEffect}</span>
        <span>Duration: {transitionDuration}ms</span>
      </div>

      <div className="controls">
        <div className="control-group">
          <h3>Effects</h3>
          <div className="effects-grid">
            {effects.map(effect => (
              <button
                key={effect}
                className={`effect-btn ${selectedEffect === effect ? 'active' : ''}`}
                onClick={() => setSelectedEffect(effect)}
              >
                {effect}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <h3>Settings</h3>
          <div className="settings">
            <label>
              <input
                type="checkbox"
                checked={isAutoplay}
                onChange={(e) => setIsAutoplay(e.target.checked)}
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
                value={transitionDuration}
                onChange={(e) => setTransitionDuration(Number(e.target.value))}
              />
              <span>{transitionDuration}ms</span>
            </label>
          </div>
        </div>
      </div>

      <div className="info">
        <h2>React Integration Features</h2>
        <ul>
          <li>Declarative component API</li>
          <li>State management with hooks</li>
          <li>Event callbacks for transitions</li>
          <li>Dynamic prop updates</li>
          <li>TypeScript support</li>
        </ul>
        
        <h3>Usage Example</h3>
        <pre><code>{`import { WebGLCarouselReact } from 'webgl-carousel/react';

<WebGLCarouselReact
  images={images}
  effect="fade"
  autoplay={true}
  transitionDuration={1500}
  onImageChange={handleImageChange}
/>`}</code></pre>
      </div>
    </div>
  );
}

export default App;