import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

// 🛑 ১. কম্পোনেন্টের বাইরে স্ট্যাটিক টেক্সচার জেনারেটর (একবারই এক্সিকিউট হবে)
function createStaticNetTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const border = 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const isBorder = x < border || x >= size - border || y < border || y >= size - border;

      if (isBorder) {
        data[index] = 255;     // R
        data[index + 1] = 255; // G
        data[index + 2] = 255; // B
        data[index + 3] = 220; // A
      }
      // Uint8Array ডিফল্টভাবেই 0 থাকে, তাই else দিয়ে আলাদা করে 0 অ্যাসাইন করার দরকার নেই (অতিরিক্ত CPU লুপ এড়ানো হলো)
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(36, 18);
  texture.generateMipmaps = false; // 👈 Mobile GPU performance boost
  texture.needsUpdate = true;

  return texture;
}

// 🥅 React Native Safe & GPU-Optimized Net Texture Hook
export function useNetTexture() {
  const texture = useMemo(() => createStaticNetTexture(), []);

  // 🧹 ২. GPU Memory Clean-up (Memory Leak রোধ করতে)
  useEffect(() => {
    return () => {
      texture.dispose(); // কম্পোনেন্ট আনমাউন্ট হলে GPU মেমরি খালি করে দেবে
    };
  }, [texture]);

  return texture;
}