import { useMemo } from 'react';
import * as THREE from 'three';

// ⚽ React Native Safe Procedural Football Texture Generator
export function useFootballTexture() {
  return useMemo(() => {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const gridX = Math.floor(x / 32) % 2;
        const gridY = Math.floor(y / 32) % 2;
        const isDark = gridX === gridY;

        data[i] = isDark ? 30 : 255;
        data[i + 1] = isDark ? 30 : 255;
        data[i + 2] = isDark ? 30 : 255;
        data[i + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);
}