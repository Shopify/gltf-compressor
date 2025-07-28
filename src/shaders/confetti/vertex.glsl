uniform float time;
uniform float duration;
uniform float fallSpeed;
uniform float rotationSpeed;
uniform float circleRadius;
uniform float flutterSpeed;
uniform float scale;
uniform float globalScalingFactor;

attribute vec3 spawnPosition;
attribute float timeOffset;
attribute float gradientID;
attribute float rotationDirection;

varying vec2 vUv;
varying float vLifetime;
varying float vGradientID;

void main() {
  vUv = uv;

  // Calculate looping particle time and lifetime
  float particleTime = mod(time + timeOffset, duration);
  vLifetime = particleTime / duration;

  if(vLifetime <= 0.0 || vLifetime >= 1.0) {
    gl_Position = vec4(0.0);
    return;
  }

  vec3 particlePosition = spawnPosition;

  // Make particles float down while rotating in circles
  float floatTime = time + timeOffset * 1000.0;
  float rotationAngle = floatTime * rotationSpeed / circleRadius * rotationDirection;
  particlePosition.x += sin(rotationAngle) * circleRadius;
  particlePosition.y -= fallSpeed * particleTime;
  particlePosition.z += cos(rotationAngle) * circleRadius;

  // Construct billboarded coordinate frame
  vec3 toCameraVector = normalize(cameraPosition - particlePosition);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(up, toCameraVector));
  up = normalize(cross(toCameraVector, right));

  // Add rotation around the forward vector (camera-facing)
  float flutterAngle = flutterSpeed * rotationDirection * floatTime;
  float cosAngle = cos(flutterAngle);
  float sinAngle = sin(flutterAngle);
  vec3 rotatedUp = cosAngle * up + sinAngle * cross(toCameraVector, up);
  vec3 rotatedRight = cosAngle * right + sinAngle * cross(toCameraVector, right);
  // Rotate the up vector (already rotated around forward) around the right vector
  vec3 finalUp = cosAngle * rotatedUp + sinAngle * cross(rotatedRight, rotatedUp);

  float growAndShrinkScalingFactor = 1.0;
  if (vLifetime <= 0.05) {
    growAndShrinkScalingFactor = vLifetime / 0.05;
  } else if (vLifetime >= 0.95) {
    growAndShrinkScalingFactor = 1.0 - ((vLifetime - 0.95) / 0.05);
  }

  float finalScale = scale * growAndShrinkScalingFactor * globalScalingFactor;

  vec3 orientedPosition = position.x * rotatedRight * finalScale +
    position.y * finalUp * finalScale;

  vGradientID = gradientID;

  gl_Position = projectionMatrix * viewMatrix * vec4(particlePosition + orientedPosition, 1.0);
}
