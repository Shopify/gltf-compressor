uniform sampler2D gradientsTextureAtlas;

varying vec2 vUv;
varying float vLifetime;
varying float vGradientID;

void main() {
  if(vLifetime <= 0.0 || vLifetime >= 1.0) {
    discard;
  }

  // Calculate the row and column based on vGradientID, which ranges from 0 to 31
  // Column: 0, 1, 2, or 3
  float column = mod(vGradientID, 4.0);
  // Row: 0, 1, 2, 3, 4, 5, 6, or 7
  float row = floor(vGradientID / 4.0);

  // Calculate the UV coordinates for the specific gradient
  // 0.25 (quarter of texture width)
  float gradientU = (1.0 - vUv.x) * 0.25 + column * 0.25;
  // 0.125 (eighth of texture height)
  float gradientV = vUv.y * 0.125 + row * 0.125;

  gl_FragColor = texture2D(gradientsTextureAtlas, vec2(gradientU, gradientV));
}
