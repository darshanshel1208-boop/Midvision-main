'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Helix3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !stageRef.current) return;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    let width = canvas.clientWidth, height = canvas.clientHeight;

    // WebGL Renderer with High Precision & ACES Filmic Tone Mapping for Realism
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference: "high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width/height, 0.1, 100);
    camera.position.set(0, 0, 14.5);

    // ---- Dynamic Studio Environment Map Generation for Realistic Reflections ----
    function generateStudioEnvMap() {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 512;
      envCanvas.height = 256;
      const ctx = envCanvas.getContext('2d');
      if (!ctx) return null;
      
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, '#9aa5b5');
      grad.addColorStop(0.5, '#2e333d');
      grad.addColorStop(1, '#080a0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      
      // Soft studio lightbanks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(140, 50, 90, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdfab';
      ctx.beginPath();
      ctx.ellipse(380, 75, 75, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#aaccff';
      ctx.beginPath();
      ctx.ellipse(260, 200, 100, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(envCanvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();
      return envMap;
    }
    const studioEnvMap = generateStudioEnvMap();
    if (studioEnvMap) {
      scene.environment = studioEnvMap;
    }

    // ---- Build double helix geometry (Realistic PBR ribbons + detailed nucleotide base pairs) ----
    const group = new THREE.Group();
    scene.add(group);

    const turns = 3.6;
    const heightSpan = 13.5;
    const radius = 1.48; // Increased size slightly
    const segsPerTurn = 80;
    const totalSegs = Math.floor(segsPerTurn * turns);

    function strandPoint(t: number, offset: number){
      const angle = t * turns * Math.PI * 2 + offset;
      const y = heightSpan / 2 - t * heightSpan;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, y, z);
    }

    // Realistic Color Gradients: Brushed Titanium Silver to Warm Champagne Gold
    function colorAt(y: number){
      const tt = (y + heightSpan / 2) / heightSpan; // 0 bottom .. 1 top
      const titanium = new THREE.Color(0xa0a8b5);
      const gold = new THREE.Color(0xf3c775);
      
      const gaussianGlow = Math.exp(-Math.pow((tt - 0.58) / 0.28, 2));
      let c = titanium.clone().lerp(gold, Math.min(1, gaussianGlow * 1.2 + 0.08));
      return c;
    }

    // Strand Tubes (Physical Metallic Ribbons with Clearcoat)
    function buildStrandTube(offset: number){
      const pts = [];
      for(let i = 0; i <= totalSegs; i++){
        pts.push(strandPoint(i / totalSegs, offset));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, totalSegs, 0.056, 12, false);

      const colors = [];
      const posAttr = geo.attributes.position;
      for(let i = 0; i < posAttr.count; i++){
        const y = posAttr.getY(i);
        const c = colorAt(y);
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const mat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        metalness: 0.78,
        roughness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
        envMapIntensity: 1.6
      });
      return new THREE.Mesh(geo, mat);
    }

    const strandA = buildStrandTube(0);
    const strandB = buildStrandTube(Math.PI);
    group.add(strandA, strandB);

    // ---- Realistic Base Pairs & Molecular Node Joints ----
    const rungGroup = new THREE.Group();
    const rungCount = Math.floor(turns * 12);
    
    const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const nodeMatA = new THREE.MeshPhysicalMaterial({
      color: 0x333538,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.9
    });
    const nodeMatB = new THREE.MeshPhysicalMaterial({
      color: 0xe0ad54,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1.0
    });

    for(let i = 0; i <= rungCount; i++){
      const t = i / rungCount;
      const p1 = strandPoint(t, 0);
      const p2 = strandPoint(t, Math.PI);
      const mid = p1.clone().lerp(p2, 0.5);
      
      const n1 = new THREE.Mesh(nodeGeo, nodeMatA);
      n1.position.copy(p1);
      const n2 = new THREE.Mesh(nodeGeo, nodeMatB);
      n2.position.copy(p2);
      rungGroup.add(n1, n2);

      const dist = p1.distanceTo(p2) * 0.48; 
      const dir = p2.clone().sub(p1).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      const c = colorAt(mid.y);

      const rungGeoA = new THREE.CylinderGeometry(0.032, 0.032, dist, 8);
      const matBaseA = new THREE.MeshPhysicalMaterial({
        color: 0x2b2d31,
        metalness: 0.7,
        roughness: 0.25,
        clearcoat: 0.6
      });
      const segA = new THREE.Mesh(rungGeoA, matBaseA);
      const posA = p1.clone().lerp(mid, 0.5);
      segA.position.copy(posA);
      segA.quaternion.copy(quat);

      const rungGeoB = new THREE.CylinderGeometry(0.032, 0.032, dist, 8);
      const matBaseB = new THREE.MeshPhysicalMaterial({
        color: c,
        metalness: 0.82,
        roughness: 0.2,
        clearcoat: 0.8
      });
      const segB = new THREE.Mesh(rungGeoB, matBaseB);
      const posB = p2.clone().lerp(mid, 0.5);
      segB.position.copy(posB);
      segB.quaternion.copy(quat);

      const centerNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 12, 12),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: c.clone().multiplyScalar(0.2),
          metalness: 0.9,
          roughness: 0.1
        })
      );
      centerNode.position.copy(mid);

      rungGroup.add(segA, segB, centerNode);
    }
    group.add(rungGroup);

    // ---- Particle Bokeh & Energy Glow Swarm ----
    const PCOUNT = 3200;
    const particleGeo = new THREE.BufferGeometry();
    const basePos = new Float32Array(PCOUNT * 3);
    const randomOffset = new Float32Array(PCOUNT * 3);
    const pColors = new Float32Array(PCOUNT * 3);
    const seedPhase = new Float32Array(PCOUNT);

    for(let i = 0; i < PCOUNT; i++){
      const t = Math.random();
      const strandChoice = Math.random() < 0.5 ? 0 : Math.PI;
      const jitter = (Math.random() - 0.5) * 0.4;
      const p = strandPoint(t, strandChoice);
      
      const jAngle = Math.random() * Math.PI * 2;
      const jr = Math.random() * 0.35;
      p.x += Math.cos(jAngle) * jr;
      p.z += Math.sin(jAngle) * jr;
      p.y += jitter * 0.5;

      basePos[i*3]     = p.x;
      basePos[i*3 + 1] = p.y;
      basePos[i*3 + 2] = p.z;

      const dAngle = Math.random() * Math.PI * 2;
      const dRadius = 1.6 + Math.random() * 3.0;
      randomOffset[i*3]     = Math.cos(dAngle) * dRadius;
      randomOffset[i*3 + 1] = (Math.random() - 0.5) * 5;
      randomOffset[i*3 + 2] = Math.sin(dAngle) * dRadius;

      const c = colorAt(p.y);
      pColors[i*3]     = c.r; 
      pColors[i*3 + 1] = c.g; 
      pColors[i*3 + 2] = c.b;

      seedPhase[i] = Math.random();
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(basePos.slice(), 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // ---- Realistic Studio Lighting Setup ----
    const mainKey = new THREE.DirectionalLight(0xfff8ee, 2.2);
    mainKey.position.set(6, 8, 8);
    scene.add(mainKey);

    const fillWarm = new THREE.DirectionalLight(0xffd8aa, 1.1);
    fillWarm.position.set(-6, 2, 4);
    scene.add(fillWarm);

    const rimCool = new THREE.DirectionalLight(0xb4d4ff, 1.4);
    rimCool.position.set(-5, -6, -6);
    scene.add(rimCool);

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const goldGlow = new THREE.PointLight(0xffc266, 3.0, 16, 2);
    goldGlow.position.set(2.0, 2.5, 3.5);
    group.add(goldGlow);

    const blueGlow = new THREE.PointLight(0x90c2ff, 1.8, 16, 2);
    blueGlow.position.set(-2.5, -4.0, 3.0);
    group.add(blueGlow);

    group.rotation.z = -0.52;
    group.rotation.x = 0.32;

    // ---- Interactive Cursor Parallax & Drag Handling ----
    let mouseX = 0, mouseY = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if(!isDragging){
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        mouseX = (e.clientX - cx) / cx;
        mouseY = (e.clientY - cy) / cy;
      }
      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };
        group.rotation.y += deltaMove.x * 0.008;
        group.rotation.x += deltaMove.y * 0.008;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging = false; };

    window.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // ---- Animation loop ----
    const clock = new THREE.Clock();
    const CYCLE_DURATION = 7.0;
    let animationId: number;

    function dissolveFactor(time: number){
      const local = (time % CYCLE_DURATION) / CYCLE_DURATION;
      const tri = local < 0.5 ? local * 2 : (1 - local) * 2;
      return Math.pow(tri, 1.6);
    }

    const posAttr = particleGeo.attributes.position;

    function animate(){
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if(!isDragging){
        group.rotation.y = t * 0.32 + mouseX * 0.45;
        group.rotation.x = 0.32 + mouseY * 0.25;
      }

      const df = dissolveFactor(t);
      (strandA.material as THREE.MeshPhysicalMaterial).opacity = 1 - df * 0.82;
      (strandA.material as THREE.MeshPhysicalMaterial).transparent = true;
      (strandB.material as THREE.MeshPhysicalMaterial).opacity = 1 - df * 0.82;
      (strandB.material as THREE.MeshPhysicalMaterial).transparent = true;
      
      rungGroup.children.forEach(child => {
        if((child as THREE.Mesh).material){
          const m = (child as THREE.Mesh).material as THREE.Material;
          m.transparent = true; 
          m.opacity = 1 - df * 0.88;
        }
      });

      particleMat.opacity = 0.3 + df * 0.7;

      for(let i = 0; i < PCOUNT; i++){
        const idx = i * 3;
        const localDf = Math.min(1, df * 1.35 + seedPhase[i] * 0.15);
        posAttr.array[idx]     = basePos[idx]     + randomOffset[idx] * localDf;
        posAttr.array[idx + 1] = basePos[idx + 1] + randomOffset[idx + 1] * localDf + Math.sin(t * 0.7 + seedPhase[i] * 12) * 0.06 * localDf;
        posAttr.array[idx + 2] = basePos[idx + 2] + randomOffset[idx + 2] * localDf;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    function onResize(){
      width = canvasRef.current?.clientWidth || window.innerWidth; 
      height = canvasRef.current?.clientHeight || window.innerHeight;
      if(width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 50);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="helix-stage" id="helix-stage" ref={stageRef}>
      <canvas id="helix-canvas" ref={canvasRef}></canvas>
    </div>
  );
}
