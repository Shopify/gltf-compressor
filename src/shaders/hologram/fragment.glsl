uniform vec3 color;
uniform float bloomIntensity;

varying float vAge;
varying vec2 vUv;

void main() {
  float forwardSweep = clamp(vAge - vUv.y, 0.0, 1.0);
  float reverseSweep = clamp(vAge - (1.0 - vUv.y), 0.0, 1.0);
  float adjustedAge = max(forwardSweep, reverseSweep);
  if (adjustedAge == 0.0) {
    discard;
  }

  gl_FragColor = vec4(color * bloomIntensity, adjustedAge);
}
