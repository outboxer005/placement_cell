import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, EffectPass, RenderPass, Effect } from "postprocessing";
import clsx from "clsx";
import "./PixelBlast.css";

type PixelBlastProps = {
  className?: string;
};

const createTouchTexture = () => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const trail: Array<{ x: number; y: number; age: number; force: number; vx: number; vy: number }> = [];
  let last: { x: number; y: number } | null = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;
  const clear = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  const drawPoint = (p: typeof trail[number]) => {
    const pos = { x: p.x * size, y: (1 - p.y) * size };
    let intensity = 1;
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
    const easeOutQuad = (t: number) => -t * (t - 2);
    if (p.age < maxAge * 0.3) intensity = easeOutSine(p.age / (maxAge * 0.3));
    else intensity = easeOutQuad(1 - (p.age - maxAge * 0.3) / (maxAge * 0.7)) || 0;
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;
    ctx.shadowOffsetX = offset;
    ctx.shadowOffsetY = offset;
    ctx.shadowBlur = radius;
    ctx.shadowColor = `rgba(${color},${0.22 * intensity})`;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,0,120,1)";
    ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  const addTouch = (norm: { x: number; y: number }) => {
    let force = 0;
    let vx = 0;
    let vy = 0;
    if (last) {
      const dx = norm.x - last.x;
      const dy = norm.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / (d || 1);
      vy = dy / (d || 1);
      force = Math.min(dd * 10000, 1);
    }
    last = { x: norm.x, y: norm.y };
    trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
  };
  const update = () => {
    clear();
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const f = point.force * speed * (1 - point.age / maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > maxAge) trail.splice(i, 1);
    }
    for (let i = 0; i < trail.length; i++) drawPoint(trail[i]);
    texture.needsUpdate = true;
  };
  return {
    canvas,
    texture,
    addTouch,
    update,
    set radiusScale(v: number) {
      radius = 0.1 * size * v;
    },
    get radiusScale() {
      return radius / (0.1 * size);
    },
    size,
  };
};

const createLiquidEffect = (texture: THREE.Texture, opts?: { strength?: number; freq?: number }) => {
  const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);
      float amt = uStrength * intensity * wave;
      uv += vec2(vx, vy) * amt;
    }
  `;
  return new Effect("LiquidEffect", fragment, {
    uniforms: new Map([
      ["uTexture", new THREE.Uniform(texture)],
      ["uStrength", new THREE.Uniform(opts?.strength ?? 0.035)],
      ["uTime", new THREE.Uniform(0)],
      ["uFreq", new THREE.Uniform(opts?.freq ?? 4.5)],
    ]),
  });
};

const PixelBlast = ({ className }: PixelBlastProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const payloadRef = useRef<{
    renderer: THREE.WebGLRenderer;
    composer?: EffectComposer;
    material: THREE.ShaderMaterial;
    quad: THREE.Mesh;
    clock: THREE.Clock;
    resizeObserver?: ResizeObserver;
    touch?: ReturnType<typeof createTouchTexture>;
    liquidEffect?: Effect;
    raf?: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);
    renderer.setClearAlpha(0);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#a78bfa") },
      uPixelSize: { value: 3 * renderer.getPixelRatio() },
    };

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColor;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uPixelSize;

      void main(){
        vec2 uv = gl_FragCoord.xy / uResolution;
        float wave = sin((uv.x + uTime * 0.2) * 20.0) * 0.5 + 0.5;
        float glow = smoothstep(0.4, 1.0, wave);
        vec3 color = mix(vec3(0.08, 0.04, 0.12), uColor, glow);
        gl_FragColor = vec4(color, 0.8);
      }
    `;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const quadGeom = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(quadGeom, material);
    scene.add(quad);
    const clock = new THREE.Clock();

    const setSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      uniforms.uPixelSize.value = 3 * renderer.getPixelRatio();
    };
    setSize();
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);

    const touch = createTouchTexture();
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const liquidEffect = createLiquidEffect(touch.texture);
    const effectPass = new EffectPass(camera, liquidEffect);
    effectPass.renderToScreen = true;
    composer.addPass(renderPass);
    composer.addPass(effectPass);
    composer.setSize(renderer.domElement.width, renderer.domElement.height);

    const handlePointer = (evt: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (evt.clientX - rect.left) / rect.width;
      const y = 1 - (evt.clientY - rect.top) / rect.height;
      touch.addTouch({ x, y });
    };
    renderer.domElement.addEventListener("pointermove", handlePointer, { passive: true });
    renderer.domElement.addEventListener("pointerdown", handlePointer, { passive: true });

    const animate = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      touch.update();
      composer.render();
      payloadRef.current!.raf = requestAnimationFrame(animate);
    };
    payloadRef.current = { renderer, composer, material, quad, clock, resizeObserver, touch, liquidEffect };
    payloadRef.current!.raf = requestAnimationFrame(animate);

    return () => {
      if (payloadRef.current?.raf) cancelAnimationFrame(payloadRef.current.raf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointer);
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      composer.dispose();
      quadGeom.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      payloadRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={clsx("pixel-blast-container", className)} aria-hidden="true" />;
};

export default PixelBlast;

