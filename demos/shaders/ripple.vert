attribute vec2 aPosition;
attribute vec2 aTexCoord;

uniform float uProgress;
uniform vec2 uResolution;

varying vec2 vTexCoord;
varying float vRipple;

void main() {
  vTexCoord = aTexCoord;
  
  // Calculate distance from center
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(aTexCoord, center);
  
  // Create ripple effect
  float rippleRadius = uProgress * 1.5;
  float rippleWidth = 0.2;
  float ripple = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) * 
                 (1.0 - smoothstep(rippleRadius, rippleRadius + rippleWidth, dist));
  
  vRipple = ripple;
  
  // Apply ripple displacement to vertex position
  vec2 displacement = normalize(aTexCoord - center) * ripple * 0.1;
  vec2 position = aPosition + displacement;
  
  gl_Position = vec4(position, 0.0, 1.0);
}