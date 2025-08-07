uniform float thickness;
uniform float progress;

attribute vec3 direction;
attribute float timeDelay;

varying float vAge;
varying vec2 vUv;

float easeInCubic(float x) {
  return x * x * x;
}

void main() {
  if(progress == 0.0 || progress < timeDelay) {
    return;
  }

  float duration = 1.0;
  vAge = easeInCubic((progress - timeDelay) / duration);
  vUv = uv;

  vec3 modelPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 look = normalize(modelPos - cameraPosition);
  vec3 direction = normalize(vec3(modelMatrix * vec4(normalize(direction), 0.0)));
  float side = 2.0 * uv.x - 1.0;
  vec3 offset = cross(look, direction * side);
  vec3 billboardedPos = modelPos.xyz + normalize(offset) * thickness * 0.0012;
  gl_Position = projectionMatrix * viewMatrix * vec4(billboardedPos, 1.0);
}
