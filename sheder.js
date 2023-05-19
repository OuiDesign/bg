const canvas = document.querySelector(".myCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("Your browser does not support WebGL");
}

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float iTime;
  uniform vec2 iResolution;

  float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
    vec2 sourceToCoord = coord - raySource;
    float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
    
    return clamp(
      (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
      (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
      0.0, 1.0) *
      clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.y = 1.0 - uv.y;
    vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
    
    // Set the parameters of the sun rays
    vec2 rayPos1 = vec2(iResolution.x * 0.5, iResolution.y * -0.4);
    vec2 rayRefDir1 = normalize(vec2(1.0, -0.116));
    float raySeedA1 = 36.2214;
    float raySeedB1 = 21.11349;
    float raySpeed1 = 1.5;
    
    vec2 rayPos2 = vec2(iResolution.x * 0.5, iResolution.y * -0.6);
    vec2 rayRefDir2 = normalize(vec2(1.0, 0.241));
    const float raySeedA2 = 22.39910;
    const float raySeedB2 = 18.0234;
    const float raySpeed2 = 1.1;
    
    // Calculate the colour of the sun rays on the current fragment
    vec4 rays1 =
      vec4(1.0, 1.0, 1.0, 1.0) *
      rayStrength(rayPos1, rayRefDir1, coord, raySeedA1, raySeedB1, raySpeed1);
    
    vec4 rays2 =
      vec4(1.0, 1.0, 1.0, 1.0) *
      rayStrength(rayPos2, rayRefDir2, coord, raySeedA2, raySeedB2, raySpeed2);
    
    gl_FragColor = rays1 * 0.5 + rays2 * 0.4;
    
    // Attenuate brightness towards the bottom, simulating light-loss due to depth.
    // Give the whole thing a blue-green tinge as well.
    float brightness = 1.0 - (coord.y /iResolution.y);
    gl_FragColor.x *= 0.1 + (brightness * 0.8);
    gl_FragColor.y *= 0.3 + (brightness * 0.6);
    gl_FragColor.z *= 0.5 + (brightness * 0.5);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!linked) {
  const error = gl.getProgramInfoLog(program);
  console.log("Error while compiling the program: " + error);
  gl.deleteProgram(program);
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [-1, -1, 1, -1, 1, 1, -1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const iResolutionUniformLocation = gl.getUniformLocation(
  program,
  "iResolution"
);
const iTimeUniformLocation = gl.getUniformLocation(program, "iTime");

gl.useProgram(program);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 1);

let startTime = Date.now();
function animate() {
  gl.uniform2f(iResolutionUniformLocation, canvas.width, canvas.height);
  gl.uniform1f(iTimeUniformLocation, (Date.now() - startTime) / 1500);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(animate);
}

animate();
