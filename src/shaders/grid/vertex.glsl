varying vec3 localPosition;
varying vec4 worldPosition;

uniform float fadeDistance;
uniform bool infiniteGrid;

void main() {
  localPosition = position.xzy;
  if (infiniteGrid) localPosition *= 1.0 + fadeDistance;
  worldPosition = modelMatrix * vec4(localPosition, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
