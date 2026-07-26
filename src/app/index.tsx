// import React, { useRef, useState } from 'react';
// import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
// import { GLView } from 'expo-gl';
// import * as THREE from 'three';
// import { Ball, Goalkeeper } from '@football/engine';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // 🎨 Procedural Ball Material Helper
// function createCheckeredBallMaterial() {
//   return new THREE.MeshStandardMaterial({
//     color: 0xffffff,
//     roughness: 0.4,
//     wireframe: true,
//   });
// }

// export default function App() {
//   const [debugInfo, setDebugInfo] = useState({
//     posX: '0.00',
//     posY: '0.00',
//     posZ: '0.00',
//     spinX: '0.00',
//     spinY: '0.00',
//     isKicked: false,
//     keeperStatus: 'Standing',
//   });

//   // Refs for tracking state inside requestAnimationFrame & PanResponder
//   const ballRef = useRef<any>(null);
//   const goalkeeperRef = useRef<any>(null);
//   const isKickedRef = useRef(false);
//   const resetMatchRef = useRef<(() => void) | null>(null);

//   // PanResponder for Swipe/Flick Gesture handling
//   const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onPanResponderGrant: (evt) => {
//         if (isKickedRef.current) {
//           if (resetMatchRef.current) resetMatchRef.current();
//           return;
//         }
//         touchStartPos.current = {
//           x: evt.nativeEvent.pageX,
//           y: evt.nativeEvent.pageY,
//           time: Date.now(),
//         };
//       },
//       onPanResponderRelease: (evt) => {
//         if (isKickedRef.current || !ballRef.current || !goalkeeperRef.current) return;

//         const duration = (Date.now() - touchStartPos.current.time) / 1000;
//         const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
//         const deltaY = Math.abs(evt.nativeEvent.pageY - touchStartPos.current.y);

//         if (deltaY < 10 && Math.abs(deltaX) < 10) return;

//         const flickSpeed = deltaY / Math.max(duration, 0.05);
//         const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

//         ballRef.current.kickFromSwipe({ deltaX, deltaY, duration, deltaTopspin });

//         goalkeeperRef.current.predictShot({
//           ballPos: ballRef.current.position,
//           ballVel: ballRef.current.velocity,
//           ballSpin: ballRef.current.spin,
//         });

//         isKickedRef.current = true;
//       },
//     })
//   ).current;

//   const _onGLContextCreate = async (gl: any) => {
//     // 1. WebGL 2 Context Bypass for Three.js r163+
//     const glContext = gl.glContext || gl;
//     if (!glContext.isWebGL2) {
//       glContext.isWebGL2 = true;
//     }

//     // 2. Custom Canvas Wrapper to bypass WebGL1 check in Three.js
//     const canvasWrapper = {
//       width: gl.drawingBufferWidth,
//       height: gl.drawingBufferHeight,
//       style: {},
//       addEventListener: () => {},
//       removeEventListener: () => {},
//       clientHeight: gl.drawingBufferHeight,
//       clientWidth: gl.drawingBufferWidth,
//       getContext: (type: string) => {
//         if (type === 'webgl2' || type === 'webgl') {
//           return glContext;
//         }
//         return null;
//       },
//     };

//     // 3. Native Three.js WebGLRenderer Setup
//     const renderer = new THREE.WebGLRenderer({
//       canvas: canvasWrapper as unknown as HTMLCanvasElement,
//       context: glContext,
//       antialias: true,
//     });

//     renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
//     renderer.setClearColor(0x1a1a24);

//     // Scene setup
//     const scene = new THREE.Scene();

//     // Camera Setup
//     const initialCamPos = new THREE.Vector3(0, 3.2, 9.5);
//     const initialCamTarget = new THREE.Vector3(0, 1.0, -10);

//     const camera = new THREE.PerspectiveCamera(
//       55,
//       gl.drawingBufferWidth / gl.drawingBufferHeight,
//       0.1,
//       1000
//     );
//     camera.position.copy(initialCamPos);
//     camera.lookAt(initialCamTarget);

//     // Lights
//     const light = new THREE.DirectionalLight(0xffffff, 1.5);
//     light.position.set(5, 10, 7);
//     scene.add(light);
//     scene.add(new THREE.AmbientLight(0xffffff, 0.6));

//     // Ground Grid
//     const grid = new THREE.GridHelper(40, 40, 0x00ffcc, 0x333333);
//     grid.position.y = 0;
//     scene.add(grid);

//     // Goal Post Setup
//     const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
//     const postRadius = 0.08;
//     const goalWidth = 7.32;
//     const goalHeight = 2.44;
//     const goalZ = -10;

//     const leftPostMesh = new THREE.Mesh(
//       new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16),
//       postMat
//     );
//     leftPostMesh.position.set(-goalWidth / 2, goalHeight / 2, goalZ);
//     scene.add(leftPostMesh);

//     const rightPostMesh = new THREE.Mesh(
//       new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16),
//       postMat
//     );
//     rightPostMesh.position.set(goalWidth / 2, goalHeight / 2, goalZ);
//     scene.add(rightPostMesh);

//     const crossbarMesh = new THREE.Mesh(
//       new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16),
//       postMat
//     );
//     crossbarMesh.rotation.z = Math.PI / 2;
//     crossbarMesh.position.set(0, goalHeight, goalZ);
//     scene.add(crossbarMesh);

//     const netDepth = 1.5;
//     const netMesh = new THREE.Mesh(
//       new THREE.BoxGeometry(goalWidth, goalHeight, netDepth),
//       new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.35, transparent: true })
//     );
//     netMesh.position.set(0, goalHeight / 2, goalZ - netDepth / 2);
//     scene.add(netMesh);

//     // 🧤 Goalkeeper Setup
//     const goalkeeper = new Goalkeeper();
//     goalkeeper.position.z = goalZ + 0.2;
//     goalkeeperRef.current = goalkeeper;

//     const keeperGroup = new THREE.Group();
//     const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 });
//     const shirtMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3 });
//     const shortsMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
//     const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.2 });

//     const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.7, 16), shirtMat);
//     bodyMesh.position.y = 1.05;
//     keeperGroup.add(bodyMesh);

//     const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
//     headMesh.position.y = 1.52;
//     keeperGroup.add(headMesh);

//     const shortsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.25, 16), shortsMat);
//     shortsMesh.position.y = 0.62;
//     keeperGroup.add(shortsMesh);

//     const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 12);
//     const leftLeg = new THREE.Mesh(legGeo, skinMat);
//     leftLeg.position.set(-0.14, 0.3, 0);
//     keeperGroup.add(leftLeg);

//     const rightLeg = new THREE.Mesh(legGeo, skinMat);
//     rightLeg.position.set(0.14, 0.3, 0);
//     keeperGroup.add(rightLeg);

//     const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.55, 12);

//     const leftArmGroup = new THREE.Group();
//     leftArmGroup.position.set(-0.32, 1.3, 0);
//     const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
//     leftArmMesh.position.y = -0.25;
//     leftArmGroup.add(leftArmMesh);

//     const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), gloveMat);
//     leftGlove.position.y = -0.55;
//     leftArmGroup.add(leftGlove);
//     keeperGroup.add(leftArmGroup);

//     const rightArmGroup = new THREE.Group();
//     rightArmGroup.position.set(0.32, 1.3, 0);
//     const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
//     rightArmMesh.position.y = -0.25;
//     rightArmGroup.add(rightArmMesh);

//     const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), gloveMat);
//     rightGlove.position.y = -0.55;
//     rightArmGroup.add(rightGlove);
//     keeperGroup.add(rightArmGroup);

//     keeperGroup.position.set(goalkeeper.position.x, 0, goalkeeper.position.z);
//     scene.add(keeperGroup);

//     const sceneObjects = {
//       posts: [
//         { start: { x: -goalWidth / 2, y: 0, z: goalZ }, end: { x: -goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
//         { start: { x: goalWidth / 2, y: 0, z: goalZ }, end: { x: goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
//         { start: { x: -goalWidth / 2, y: goalHeight, z: goalZ }, end: { x: goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
//       ],
//       net: { minX: -goalWidth / 2, maxX: goalWidth / 2, minY: 0, maxY: goalHeight, minZ: goalZ - netDepth, maxZ: goalZ - 0.05 },
//     };

//     // ⚽ Ball Setup
//     const ball = new Ball({ x: 0, y: 0.2, z: 0 }, 0.2);
//     ballRef.current = ball;

//     const ballMaterial = createCheckeredBallMaterial();
//     const ballMesh = new THREE.Mesh(
//       new THREE.SphereGeometry(ball.radius, 32, 32),
//       ballMaterial
//     );
//     scene.add(ballMesh);

//     let isSaved = false;
//     let isGoal = false;
//     let shotFinished = false;
//     let autoResetTimer: any = null;

//     // Reset Match logic
//     const resetMatch = () => {
//       if (autoResetTimer) clearTimeout(autoResetTimer);
//       autoResetTimer = null;

//       ball.reset();
//       goalkeeper.reset();
//       goalkeeper.position.z = goalZ + 0.2;
//       isKickedRef.current = false;
//       isSaved = false;
//       isGoal = false;
//       shotFinished = false;

//       ballMesh.position.set(ball.position.x, ball.position.y, ball.position.z);
//       ballMesh.rotation.set(0, 0, 0);

//       keeperGroup.position.set(goalkeeper.position.x, 0, goalkeeper.position.z);
//       keeperGroup.rotation.set(0, 0, 0);

//       leftArmGroup.rotation.z = 0;
//       rightArmGroup.rotation.z = 0;
//     };

//     resetMatchRef.current = resetMatch;

//     let lastTime = Date.now();

//     // 🔄 Animation Loop
//     const render = () => {
//       requestAnimationFrame(render);

//       const now = Date.now();
//       const dt = Math.min((now - lastTime) / 1000, 0.05);
//       lastTime = now;

//       if (isKickedRef.current) {
//         ball.update(dt, sceneObjects);
//         goalkeeper.updateAI(ball.position, ball.velocity, dt);

//         if (!isSaved && goalkeeper.checkSave(ball.position, ball.radius)) {
//           isSaved = true;
//           ball.velocity.x = (ball.position.x - goalkeeper.position.x) * 3.5;
//           ball.velocity.z = Math.abs(ball.velocity.z) * 0.5;
//           ball.velocity.y = Math.abs(ball.velocity.y) * 0.3 + 2.0;
//         }

//         if (
//           ball.position.z < goalZ &&
//           Math.abs(ball.position.x) < goalWidth / 2 &&
//           ball.position.y < goalHeight &&
//           !isSaved
//         ) {
//           isGoal = true;
//         }

//         if (!shotFinished && (ball.position.z < goalZ - 1.5 || isSaved || ball.position.y < 0.22)) {
//           shotFinished = true;

//           if (!autoResetTimer) {
//             autoResetTimer = setTimeout(() => {
//               resetMatch();
//             }, 3000);
//           }
//         }

//         ballMesh.position.set(ball.position.x, ball.position.y, ball.position.z);
//         ballMesh.rotation.y += ball.spin.y * dt;
//         ballMesh.rotation.x += (ball.spin.x + ball.velocity.z) * dt * 0.1;
//       }

//       camera.position.copy(initialCamPos);
//       camera.lookAt(initialCamTarget);

//       const targetKeeperY = goalkeeper.isDiving ? Math.max(0, goalkeeper.position.y) : 0;
//       keeperGroup.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);

//       if (goalkeeper.isDiving && !shotFinished) {
//         let tiltAngle = goalkeeper.diveDirection === 'right' ? -0.85 : 0.85;
//         let armAngleLeft = goalkeeper.diveDirection === 'right' ? -2.2 : 1.8;
//         let armAngleRight = goalkeeper.diveDirection === 'right' ? -1.8 : 2.2;

//         keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, tiltAngle, dt * 8.0);
//         leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, armAngleLeft, dt * 8.0);
//         rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, armAngleRight, dt * 8.0);
//       } else if (shotFinished && !isGoal) {
//         keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, 0, dt * 6.0);
//         const jumpY = Math.sin(now * 0.012) * 0.3;
//         keeperGroup.position.y = Math.max(0, jumpY);

//         leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 2.8, dt * 8.0);
//         rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -2.8, dt * 8.0);
//       } else {
//         keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, 0, dt * 6.0);
//         leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.2, dt * 6.0);
//         rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.2, dt * 6.0);
//       }

//       // Telemetry UI Update
//       setDebugInfo({
//         posX: ball.position.x.toFixed(2),
//         posY: ball.position.y.toFixed(2),
//         posZ: ball.position.z.toFixed(2),
//         spinX: ball.spin.x.toFixed(2),
//         spinY: ball.spin.y.toFixed(2),
//         isKicked: isKickedRef.current,
//         keeperStatus: shotFinished && !isGoal
//           ? '🎉 CELEBRATING'
//           : goalkeeper.isDiving
//             ? `🧤 Diving ${goalkeeper.diveDirection.toUpperCase()}`
//             : '🧍 Standing Ready',
//       });

//       renderer.render(scene, camera);
//       gl.endFrameEXP();
//     };

//     render();
//   };

//   return (
//     <View style={styles.container} {...panResponder.panHandlers}>
//       <GLView style={styles.glView} onContextCreate={_onGLContextCreate} />

//       {/* 📊 Telemetry Overlay */}
//       <View style={styles.telemetryOverlay}>
//         <Text style={styles.telemetryTitle}>⚙️ Physics Telemetry</Text>
//         <Text style={styles.telemetryText}>
//           Status: {debugInfo.isKicked ? '🚀 In Motion' : '⏸️ Ready for Shot'}
//         </Text>
//         <Text style={styles.telemetryText}>
//           Keeper:{' '}
//           <Text
//             style={{
//               color: debugInfo.keeperStatus.includes('CELEBRATING') ? '#ffcc00' : '#00ffcc',
//             }}
//           >
//             {debugInfo.keeperStatus}
//           </Text>
//         </Text>
//         <Text style={styles.telemetryText}>
//           Pos X: {debugInfo.posX}m | Y: {debugInfo.posY}m | Z: {debugInfo.posZ}m
//         </Text>
//         <Text style={styles.telemetryText}>
//           Spin Y: {debugInfo.spinY} | Spin X: {debugInfo.spinX}
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111',
//   },
//   glView: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//   },
//   telemetryOverlay: {
//     position: 'absolute',
//     top: 50,
//     left: 15,
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     padding: 12,
//     borderRadius: 8,
//     borderColor: '#00ffcc',
//     borderWidth: 1,
//     pointerEvents: 'none',
//   },
//   telemetryTitle: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   telemetryText: {
//     color: '#00ffcc',
//     fontFamily: 'monospace',
//     fontSize: 12,
//   },
// });

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Ball, Goalkeeper } from '@football/engine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function createCheckeredBallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    wireframe: false,
  });
}

export default function App() {
  const [debugInfo, setDebugInfo] = useState({
    posX: '0.00',
    posY: '0.00',
    posZ: '0.00',
    spinX: '0.00',
    spinY: '0.00',
    isKicked: false,
    keeperStatus: 'Standing',
  });

  const ballRef = useRef<any>(null);
  const goalkeeperRef = useRef<any>(null);
  const isKickedRef = useRef(false);
  const resetMatchRef = useRef<(() => void) | null>(null);

  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (isKickedRef.current) {
          if (resetMatchRef.current) resetMatchRef.current();
          return;
        }
        touchStartPos.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          time: Date.now(),
        };
      },
      onPanResponderRelease: (evt) => {
        if (isKickedRef.current || !ballRef.current || !goalkeeperRef.current) return;

        const duration = (Date.now() - touchStartPos.current.time) / 1000;
        const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
        const deltaY = Math.abs(evt.nativeEvent.pageY - touchStartPos.current.y);

        if (deltaY < 10 && Math.abs(deltaX) < 10) return;

        const flickSpeed = deltaY / Math.max(duration, 0.05);
        const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

        ballRef.current.kickFromSwipe({ deltaX, deltaY, duration, deltaTopspin });

        goalkeeperRef.current.predictShot({
          ballPos: ballRef.current.position,
          ballVel: ballRef.current.velocity,
          ballSpin: ballRef.current.spin,
        });

        isKickedRef.current = true;
      },
    })
  ).current;

  const _onGLContextCreate = async (gl: any) => {
    // 🚀 LATEST SOLUTION FOR THREE.JS r163+ (WebGL 2 Compatibility)

    // 1. Polyfill WebGL2RenderingContext globally if missing in RN Environment
    if (typeof (globalThis as any).WebGL2RenderingContext === 'undefined') {
      (globalThis as any).WebGL2RenderingContext = class WebGL2RenderingContext { };
    }

    // 2. Mark the expo-gl context explicitly as WebGL2
    const glContext = gl.glContext || gl;
    glContext.isWebGL2 = true;

    // 3. Modern WebGL2 Canvas Wrapper for Three.js WebGLRenderer
    const canvasWrapper = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      addEventListener: () => { },
      removeEventListener: () => { },
      clientHeight: gl.drawingBufferHeight,
      clientWidth: gl.drawingBufferWidth,
      getContext: (type: string) => {
        return glContext;
      },
    };

    // 4. Initialize Renderer safely with Modern Three.js
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasWrapper as unknown as HTMLCanvasElement,
      context: glContext,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x1a1a24);

    const scene = new THREE.Scene();

    const initialCamPos = new THREE.Vector3(0, 3.2, 9.5);
    const initialCamTarget = new THREE.Vector3(0, 1.0, -10);

    const camera = new THREE.PerspectiveCamera(
      55,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.copy(initialCamPos);
    camera.lookAt(initialCamTarget);

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const grid = new THREE.GridHelper(40, 40, 0x00ffcc, 0x333333);
    grid.position.y = 0;
    scene.add(grid);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const postRadius = 0.08;
    const goalWidth = 7.32;
    const goalHeight = 2.44;
    const goalZ = -10;

    const leftPostMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16),
      postMat
    );
    leftPostMesh.position.set(-goalWidth / 2, goalHeight / 2, goalZ);
    scene.add(leftPostMesh);

    const rightPostMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16),
      postMat
    );
    rightPostMesh.position.set(goalWidth / 2, goalHeight / 2, goalZ);
    scene.add(rightPostMesh);

    const crossbarMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16),
      postMat
    );
    crossbarMesh.rotation.z = Math.PI / 2;
    crossbarMesh.position.set(0, goalHeight, goalZ);
    scene.add(crossbarMesh);

    const netDepth = 1.5;
    const netMesh = new THREE.Mesh(
      new THREE.BoxGeometry(goalWidth, goalHeight, netDepth),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.35, transparent: true })
    );
    netMesh.position.set(0, goalHeight / 2, goalZ - netDepth / 2);
    scene.add(netMesh);

    const goalkeeper = new Goalkeeper();
    goalkeeper.position.z = goalZ + 0.2;
    goalkeeperRef.current = goalkeeper;

    const keeperGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.2 });

    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.7, 16), shirtMat);
    bodyMesh.position.y = 1.05;
    keeperGroup.add(bodyMesh);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
    headMesh.position.y = 1.52;
    keeperGroup.add(headMesh);

    const shortsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.25, 16), shortsMat);
    shortsMesh.position.y = 0.62;
    keeperGroup.add(shortsMesh);

    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 12);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.14, 0.3, 0);
    keeperGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.14, 0.3, 0);
    keeperGroup.add(rightLeg);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.55, 12);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.32, 1.3, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.y = -0.25;
    leftArmGroup.add(leftArmMesh);

    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), gloveMat);
    leftGlove.position.y = -0.55;
    leftArmGroup.add(leftGlove);
    keeperGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.32, 1.3, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.y = -0.25;
    rightArmGroup.add(rightArmMesh);

    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), gloveMat);
    rightGlove.position.y = -0.55;
    rightArmGroup.add(rightGlove);
    keeperGroup.add(rightArmGroup);

    keeperGroup.position.set(goalkeeper.position.x, 0, goalkeeper.position.z);
    scene.add(keeperGroup);

    const sceneObjects = {
      posts: [
        { start: { x: -goalWidth / 2, y: 0, z: goalZ }, end: { x: -goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
        { start: { x: goalWidth / 2, y: 0, z: goalZ }, end: { x: goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
        { start: { x: -goalWidth / 2, y: goalHeight, z: goalZ }, end: { x: goalWidth / 2, y: goalHeight, z: goalZ }, radius: postRadius },
      ],
      net: { minX: -goalWidth / 2, maxX: goalWidth / 2, minY: 0, maxY: goalHeight, minZ: goalZ - netDepth, maxZ: goalZ - 0.05 },
    };

    const ball = new Ball({ x: 0, y: 0.2, z: 0 }, 0.2);
    ballRef.current = ball;

    const ballMaterial = createCheckeredBallMaterial();
    const ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(ball.radius, 32, 32),
      ballMaterial
    );
    scene.add(ballMesh);

    let isSaved = false;
    let isGoal = false;
    let shotFinished = false;
    let autoResetTimer: any = null;

    const resetMatch = () => {
      if (autoResetTimer) clearTimeout(autoResetTimer);
      autoResetTimer = null;

      ball.reset();
      goalkeeper.reset();
      goalkeeper.position.z = goalZ + 0.2;
      isKickedRef.current = false;
      isSaved = false;
      isGoal = false;
      shotFinished = false;

      ballMesh.position.set(ball.position.x, ball.position.y, ball.position.z);
      ballMesh.rotation.set(0, 0, 0);

      keeperGroup.position.set(goalkeeper.position.x, 0, goalkeeper.position.z);
      keeperGroup.rotation.set(0, 0, 0);

      leftArmGroup.rotation.z = 0;
      rightArmGroup.rotation.z = 0;
    };

    resetMatchRef.current = resetMatch;

    let lastTime = Date.now();

    const render = () => {
      requestAnimationFrame(render);

      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isKickedRef.current) {
        ball.update(dt, sceneObjects);
        goalkeeper.updateAI(ball.position, ball.velocity, dt);

        if (!isSaved && goalkeeper.checkSave(ball.position, ball.radius)) {
          isSaved = true;
          ball.velocity.x = (ball.position.x - goalkeeper.position.x) * 3.5;
          ball.velocity.z = Math.abs(ball.velocity.z) * 0.5;
          ball.velocity.y = Math.abs(ball.velocity.y) * 0.3 + 2.0;
        }

        if (
          ball.position.z < goalZ &&
          Math.abs(ball.position.x) < goalWidth / 2 &&
          ball.position.y < goalHeight &&
          !isSaved
        ) {
          isGoal = true;
        }

        if (!shotFinished && (ball.position.z < goalZ - 1.5 || isSaved || ball.position.y < 0.22)) {
          shotFinished = true;

          if (!autoResetTimer) {
            autoResetTimer = setTimeout(() => {
              resetMatch();
            }, 3000);
          }
        }

        ballMesh.position.set(ball.position.x, ball.position.y, ball.position.z);
        ballMesh.rotation.y += ball.spin.y * dt;
        ballMesh.rotation.x += (ball.spin.x + ball.velocity.z) * dt * 0.1;
      }

      camera.position.copy(initialCamPos);
      camera.lookAt(initialCamTarget);

      const targetKeeperY = goalkeeper.isDiving ? Math.max(0, goalkeeper.position.y) : 0;
      keeperGroup.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);

      if (goalkeeper.isDiving && !shotFinished) {
        let tiltAngle = goalkeeper.diveDirection === 'right' ? -0.85 : 0.85;
        let armAngleLeft = goalkeeper.diveDirection === 'right' ? -2.2 : 1.8;
        let armAngleRight = goalkeeper.diveDirection === 'right' ? -1.8 : 2.2;

        keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, tiltAngle, dt * 8.0);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, armAngleLeft, dt * 8.0);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, armAngleRight, dt * 8.0);
      } else if (shotFinished && !isGoal) {
        keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, 0, dt * 6.0);
        const jumpY = Math.sin(now * 0.012) * 0.3;
        keeperGroup.position.y = Math.max(0, jumpY);

        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 2.8, dt * 8.0);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -2.8, dt * 8.0);
      } else {
        keeperGroup.rotation.z = THREE.MathUtils.lerp(keeperGroup.rotation.z, 0, dt * 6.0);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.2, dt * 6.0);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.2, dt * 6.0);
      }

      setDebugInfo({
        posX: ball.position.x.toFixed(2),
        posY: ball.position.y.toFixed(2),
        posZ: ball.position.z.toFixed(2),
        spinX: ball.spin.x.toFixed(2),
        spinY: ball.spin.y.toFixed(2),
        isKicked: isKickedRef.current,
        keeperStatus: shotFinished && !isGoal
          ? '🎉 CELEBRATING'
          : goalkeeper.isDiving
            ? `🧤 Diving ${goalkeeper.diveDirection.toUpperCase()}`
            : '🧍 Standing Ready',
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView style={styles.glView} onContextCreate={_onGLContextCreate} />

      <View style={styles.telemetryOverlay}>
        <Text style={styles.telemetryTitle}>⚙️ Physics Telemetry</Text>
        <Text style={styles.telemetryText}>
          Status: {debugInfo.isKicked ? '🚀 In Motion' : '⏸️ Ready for Shot'}
        </Text>
        <Text style={styles.telemetryText}>
          Keeper:{' '}
          <Text
            style={{
              color: debugInfo.keeperStatus.includes('CELEBRATING') ? '#ffcc00' : '#00ffcc',
            }}
          >
            {debugInfo.keeperStatus}
          </Text>
        </Text>
        <Text style={styles.telemetryText}>
          Pos X: {debugInfo.posX}m | Y: {debugInfo.posY}m | Z: {debugInfo.posZ}m
        </Text>
        <Text style={styles.telemetryText}>
          Spin Y: {debugInfo.spinY} | Spin X: {debugInfo.spinX}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  glView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  telemetryOverlay: {
    position: 'absolute',
    top: 50,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 12,
    borderRadius: 8,
    borderColor: '#00ffcc',
    borderWidth: 1,
    pointerEvents: 'none',
  },
  telemetryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  telemetryText: {
    color: '#00ffcc',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});