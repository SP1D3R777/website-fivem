/* ==========================================================================
   WAVESIDE ROLEPLAY — Scène Three.js d'arrière-plan
   Champ 3D de braises rouges + embruns blancs, en profondeur.
   - Remontée accélérée par le défilement de la page
   - Parallaxe caméra à la souris
   - Intensité réduite hors de la page d'accueil
   ========================================================================== */
import * as THREE from "three";

const vert = /* glsl */ `
  uniform float uTime; uniform float uScroll; uniform float uPR; uniform vec2 uMouse;
  attribute float aSize; attribute float aSpeed; attribute float aPhase; attribute float aHue;
  varying float vHue; varying float vAlpha;
  void main(){
    vec3 p = position;
    float range = 14.0;
    p.y = mod(p.y + uTime * aSpeed + uScroll * aSpeed * 2.2, range) - 5.0;
    p.x += sin(uTime * 0.55 + aPhase) * 0.4 + uMouse.x * (p.z + 8.0) * 0.06;
    p.z += cos(uTime * 0.35 + aPhase * 1.3) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPR * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vHue = aHue;
    float edge = smoothstep(-5.0, -3.0, p.y) * (1.0 - smoothstep(6.0, 9.0, p.y));
    vAlpha = edge * (0.5 + 0.5 * sin(uTime * 2.0 + aPhase * 6.0));
  }`;

const frag = /* glsl */ `
  uniform float uDim;
  varying float vHue; varying float vAlpha;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float core = pow(smoothstep(0.5, 0.0, d), 2.2);
    vec3 red = vec3(0.94, 0.2, 0.25), hot = vec3(1.0, 0.55, 0.42), white = vec3(1.0);
    vec3 col = vHue < 0.6 ? mix(red, hot, vHue / 0.6) : mix(hot, white, (vHue - 0.6) / 0.4);
    gl_FragColor = vec4(col, core * vAlpha * uDim);
  }`;

export function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0); // transparent : laisse voir le fond du site / hero
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 1, 8);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COUNT = window.innerWidth < 860 ? 700 : 1800;

  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3), size = new Float32Array(COUNT), speed = new Float32Array(COUNT), phase = new Float32Array(COUNT), hue = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = Math.random() * 14;
    pos[i * 3 + 2] = -12 + Math.random() * 16;
    size[i] = 0.6 + Math.pow(Math.random(), 3) * 3.4;
    speed[i] = 0.12 + Math.random() * 0.45;
    phase[i] = Math.random() * Math.PI * 2;
    hue[i] = Math.random() < 0.2 ? 0.85 + Math.random() * 0.15 : Math.random() * 0.6; // 20 % d'embruns blancs
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  g.setAttribute("aHue", new THREE.BufferAttribute(hue, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uPR: { value: 1 }, uMouse: { value: new THREE.Vector2() }, uDim: { value: 1 } },
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  scene.add(points);

  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  let scrollY = window.scrollY, scrollS = scrollY, scrollAcc = 0, dimTarget = 1;

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    mat.uniforms.uPR.value = renderer.getPixelRatio();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), { passive: true });
  window.addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });

  const clock = new THREE.Clock();
  let running = true, raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = 1 - Math.pow(0.002, dt);
    mat.uniforms.uTime.value += dt * (reduced ? 0.3 : 1);
    mouseS.lerp(mouse, k * 0.6);
    const prev = scrollS;
    scrollS += (scrollY - scrollS) * k;
    scrollAcc += Math.abs(scrollS - prev) * 0.004; // le scroll « souffle » sur les braises
    mat.uniforms.uScroll.value = scrollAcc;
    mat.uniforms.uMouse.value.copy(mouseS);
    mat.uniforms.uDim.value += (dimTarget - mat.uniforms.uDim.value) * k * 0.5;
    camera.position.x += (mouseS.x * 0.6 - camera.position.x) * k * 0.4;
    camera.position.y += (1 + mouseS.y * 0.4 - camera.position.y) * k * 0.4;
    camera.lookAt(0, 1, 0);
    renderer.render(scene, camera);
  }
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) clock.getDelta(); });

  resize();
  frame();

  return {
    setView(v) { dimTarget = v === "accueil" ? 1 : 0.55; },
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); },
  };
}
