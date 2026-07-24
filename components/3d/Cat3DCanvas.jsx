"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Cat3DCanvas({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.5);

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clean previous canvases
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff3ea, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffb74d, 2.2);
    mainLight.position.set(4, 6, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xff6b81, 1.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffe0b2, 1.2, 10);
    fillLight.position.set(0, -1, 3);
    scene.add(fillLight);

    // 4. Stylized 3D Cat Construction
    const catGroup = new THREE.Group();
    scene.add(catGroup);

    // Materials
    const furOrangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c42,
      roughness: 0.4,
      metalness: 0.1,
    });
    const furWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05,
    });
    const earInnerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb3c1,
      roughness: 0.5,
    });
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2b2b,
      roughness: 0.1,
    });
    const eyeGlintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b81 });
    const collarMaterial = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.3,
    });
    const bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    });

    // --- Cat Body ---
    const bodyGeometry = new THREE.SphereGeometry(0.85, 32, 32);
    bodyGeometry.scale(1, 1.15, 0.95);
    const body = new THREE.Mesh(bodyGeometry, furOrangeMaterial);
    body.position.y = 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    catGroup.add(body);

    // White Chest Fur Patch
    const chestGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    chestGeometry.scale(0.85, 1, 0.4);
    const chest = new THREE.Mesh(chestGeometry, furWhiteMaterial);
    chest.position.set(0, 0.25, 0.65);
    catGroup.add(chest);

    // --- Cat Head ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.25, 0.1);
    catGroup.add(headGroup);

    const headGeometry = new THREE.SphereGeometry(0.75, 32, 32);
    headGeometry.scale(1.15, 0.95, 1.05);
    const head = new THREE.Mesh(headGeometry, furOrangeMaterial);
    head.castShadow = true;
    headGroup.add(head);

    // White Muzzle
    const muzzleGeometry = new THREE.SphereGeometry(0.4, 24, 24);
    muzzleGeometry.scale(1.1, 0.7, 0.6);
    const muzzle = new THREE.Mesh(muzzleGeometry, furWhiteMaterial);
    muzzle.position.set(0, -0.15, 0.55);
    headGroup.add(muzzle);

    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.08, 0.08, 4);
    noseGeometry.rotateX(Math.PI);
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.08, 0.82);
    headGroup.add(nose);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeLeft = new THREE.Mesh(eyeGeom, eyeMaterial);
    eyeLeft.position.set(-0.28, 0.08, 0.68);
    headGroup.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeom, eyeMaterial);
    eyeRight.position.set(0.28, 0.08, 0.68);
    headGroup.add(eyeRight);

    // Eye Glints
    const glintGeom = new THREE.SphereGeometry(0.04, 8, 8);
    const glintL = new THREE.Mesh(glintGeom, eyeGlintMaterial);
    glintL.position.set(-0.25, 0.12, 0.78);
    headGroup.add(glintL);

    const glintR = new THREE.Mesh(glintGeom, eyeGlintMaterial);
    glintR.position.set(0.31, 0.12, 0.78);
    headGroup.add(glintR);

    // Ears
    const createEar = (isLeft) => {
      const earGroup = new THREE.Group();
      const outerCone = new THREE.ConeGeometry(0.28, 0.5, 4);
      const outerEar = new THREE.Mesh(outerCone, furOrangeMaterial);
      outerEar.rotation.y = Math.PI / 4;
      earGroup.add(outerEar);

      const innerCone = new THREE.ConeGeometry(0.18, 0.38, 4);
      const innerEar = new THREE.Mesh(innerCone, earInnerMaterial);
      innerEar.position.z = 0.04;
      innerEar.rotation.y = Math.PI / 4;
      earGroup.add(innerEar);

      const sign = isLeft ? -1 : 1;
      earGroup.position.set(sign * 0.48, 0.65, 0.1);
      earGroup.rotation.z = sign * -0.25;
      earGroup.rotation.x = -0.1;
      return earGroup;
    };

    const earL = createEar(true);
    const earR = createEar(false);
    headGroup.add(earL);
    headGroup.add(earR);

    // Collar & Bell
    const collarGeom = new THREE.TorusGeometry(0.62, 0.06, 16, 32);
    collarGeom.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeom, collarMaterial);
    collar.position.set(0, 0.68, 0);
    catGroup.add(collar);

    const bellGeom = new THREE.SphereGeometry(0.1, 16, 16);
    const bell = new THREE.Mesh(bellGeom, bellMaterial);
    bell.position.set(0, 0.6, 0.62);
    catGroup.add(bell);

    // Paws
    const createPaw = (x, z) => {
      const pawGeom = new THREE.SphereGeometry(0.22, 16, 16);
      pawGeom.scale(1, 0.6, 1.2);
      const paw = new THREE.Mesh(pawGeom, furWhiteMaterial);
      paw.position.set(x, -0.65, z);
      paw.castShadow = true;
      return paw;
    };

    catGroup.add(createPaw(-0.4, 0.5));
    catGroup.add(createPaw(0.4, 0.5));
    catGroup.add(createPaw(-0.45, -0.3));
    catGroup.add(createPaw(0.45, -0.3));

    // Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.4, -0.7);
    catGroup.add(tailGroup);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.3, -0.3),
      new THREE.Vector3(0.2, 0.7, -0.4),
      new THREE.Vector3(0.3, 1.1, -0.2),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 20, 0.09, 8, false);
    const tailMesh = new THREE.Mesh(tailGeom, furOrangeMaterial);
    tailMesh.castShadow = true;
    tailGroup.add(tailMesh);

    // Floating Sparkles / Particles surrounding the Cat
    const particleCount = 40;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffb74d,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 5. Scroll & Mouse Tracking States
    let scrollPercent = 0;
    let targetScrollPercent = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      targetScrollPercent = Math.min(
        1,
        Math.max(0, window.scrollY / maxScroll)
      );
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      targetMouseX = (x / rect.width) * 2;
      targetMouseY = (y / rect.height) * 2;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Initial scroll call
    handleScroll();

    // 6. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp for scroll & mouse
      scrollPercent += (targetScrollPercent - scrollPercent) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      // 3D Cat Scroll Reaction: Rotate Y 360° as page scrolls
      catGroup.rotation.y = scrollPercent * Math.PI * 4 + Math.sin(elapsedTime * 0.5) * 0.1;

      // Floating Y Position + gentle bobbing
      catGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12 - scrollPercent * 0.4;
      catGroup.position.x = Math.cos(elapsedTime * 1.2) * 0.05;

      // Head mouse look-at tracking
      headGroup.rotation.y = mouseX * 0.4;
      headGroup.rotation.x = mouseY * 0.3;

      // Tail wiggling
      tailGroup.rotation.z = Math.sin(elapsedTime * 3.5) * 0.25;
      tailGroup.rotation.x = Math.cos(elapsedTime * 2) * 0.15;

      // Bell subtle jingle rotation
      bell.rotation.z = Math.sin(elapsedTime * 5) * 0.2;

      // Particles rotation
      particleSystem.rotation.y = elapsedTime * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 320;
      const h = mountRef.current.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose geometries & materials
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-72 h-72 sm:w-96 sm:h-96 relative flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}
