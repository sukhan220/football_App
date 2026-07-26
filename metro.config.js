const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// ১. প্রজেক্ট রুট এবং ইঞ্জিনের পাথ নির্ধারণ
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// ২. Metro-কে বাইরের monorepo/workspace ফোল্ডার ওয়াচ করার অনুমতি দেওয়া
config.watchFolders = [workspaceRoot];

// ৩. node_modules রেজোলিউশন ঠিক রাখা
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ৪. 3D Model (.glb, .gltf) সাপোর্ট যুক্ত করা
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;