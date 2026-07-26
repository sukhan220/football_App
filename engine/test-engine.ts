import { Vector3Utils } from './src/core/Vector3';

console.log('====================================');
console.log('⚽ FOOTBALL ENGINE TEST RUNNER');
console.log('====================================\n');

// ১. ম্যাথ ভেক্টর টেস্ট
console.log('📌 Test 1: Vector Math Check...');
const v1 = Vector3Utils.create(1, 2, 3);
const v2 = Vector3Utils.create(4, 5, 6);
const sum = Vector3Utils.add(v1, v2);

console.log(`Vector Add Result: X:${sum.x}, Y:${sum.y}, Z:${sum.z}`);

if (sum.x === 5 && sum.y === 7 && sum.z === 9) {
  console.log('✅ Vector Math Test PASSED!\n');
} else {
  console.log('❌ Vector Math Test FAILED!\n');
}

console.log('====================================');
console.log('🎉 ALL ENGINE TESTS EXECUTED!');
console.log('====================================');