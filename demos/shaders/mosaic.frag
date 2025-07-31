precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uImageSize0;
uniform vec2 uImageSize1;

varying vec2 vTexCoord;

// Calculate UV coordinates for cover fit
vec2 getCoverUV(vec2 uv, vec2 imageSize, vec2 resolution) {
  if (imageSize.x <= 0.0 || imageSize.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
    return uv;
  }
  
  float imageAspect = imageSize.x / imageSize.y;
  float canvasAspect = resolution.x / resolution.y;
  
  vec2 scale = vec2(1.0);
  if (imageAspect > canvasAspect) {
    scale.x = imageAspect / canvasAspect;
  } else {
    scale.y = canvasAspect / imageAspect;
  }
  
  return (uv - 0.5) / scale + 0.5;
}

// Random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vTexCoord;
  
  // Mosaic tile size based on progress
  float tileSize = mix(1.0, 40.0, uProgress);
  vec2 tileCount = vec2(tileSize);
  
  // Calculate tile position
  vec2 tilePos = floor(uv * tileCount) / tileCount;
  
  // Random value for this tile
  float rand = random(tilePos);
  
  // Determine which image to show based on random value and progress
  bool showNext = rand < uProgress;
  
  // Use tile center for sampling
  vec2 tileCenterUV = tilePos + 0.5 / tileCount;
  
  vec4 color;
  if (showNext) {
    vec2 uv1 = getCoverUV(tileCenterUV, uImageSize1, uResolution);
    color = texture2D(uTexture1, uv1);
  } else {
    vec2 uv0 = getCoverUV(tileCenterUV, uImageSize0, uResolution);
    color = texture2D(uTexture0, uv0);
  }
  
  // Add tile border for visual effect
  vec2 tileFract = fract(uv * tileCount);
  float border = 1.0 - step(0.02, min(tileFract.x, tileFract.y)) * 
                      step(0.02, min(1.0 - tileFract.x, 1.0 - tileFract.y));
  color.rgb *= 1.0 - border * 0.3;
  
  gl_FragColor = color;
}