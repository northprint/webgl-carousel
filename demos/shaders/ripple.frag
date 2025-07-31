precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uImageSize0;
uniform vec2 uImageSize1;

varying vec2 vTexCoord;
varying float vRipple;

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

void main() {
  vec2 uv = vTexCoord;
  
  // Apply ripple distortion
  vec2 center = vec2(0.5, 0.5);
  vec2 toCenter = normalize(center - uv);
  vec2 distortedUV = uv + toCenter * vRipple * 0.05;
  
  // Get textures with cover fit
  vec2 uv0 = getCoverUV(distortedUV, uImageSize0, uResolution);
  vec2 uv1 = getCoverUV(distortedUV, uImageSize1, uResolution);
  
  vec4 color0 = texture2D(uTexture0, uv0);
  vec4 color1 = texture2D(uTexture1, uv1);
  
  // Mix based on progress and ripple
  float mixFactor = smoothstep(0.0, 1.0, uProgress + vRipple * 0.5);
  vec4 finalColor = mix(color0, color1, mixFactor);
  
  // Add ripple highlight
  finalColor.rgb += vec3(vRipple * 0.2);
  
  gl_FragColor = finalColor;
}