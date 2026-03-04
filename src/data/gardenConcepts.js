/**
 * Three distinct garden concept templates.
 * Each concept defines a layout pattern, material palette, and plant selection strategy.
 * The 3D viewer uses these to generate a scene with context-specific plants from the user's zone.
 */

export const GARDEN_CONCEPTS = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    subtitle: 'Clean lines · Structured planting · Architectural focus',
    description: 'Geometric hardscape with precisely placed specimen plants. Emphasis on negative space, gravel planes, and bold foliage contrasts.',
    icon: '▣',
    ground: { material: 'gravel', color: '#c8bfa8', accent: '#8a8070' },
    hardscape: { color: '#9a9080', edging: '#6a6050', style: 'geometric' },
    layout: {
      // Normalized positions (0-1 range), will be scaled to scene size
      trees: [
        { x: 0.25, z: 0.3 },
        { x: 0.75, z: 0.7 },
      ],
      shrubs: [
        { x: 0.15, z: 0.6, count: 3, spacing: 0.06 },
        { x: 0.7,  z: 0.3, count: 2, spacing: 0.08 },
      ],
      ground: [
        { x: 0.5, z: 0.5, radius: 0.15 },
        { x: 0.2, z: 0.8, radius: 0.1 },
      ],
      paths: [
        { from: { x: 0.5, z: 0.0 }, to: { x: 0.5, z: 1.0 }, width: 0.06 },
      ],
      features: [
        { type: 'planter-box', x: 0.4, z: 0.45, w: 0.2, d: 0.08 },
      ],
    },
    plantStrategy: {
      treePreference: ['columnar', 'vase'],
      shrubPreference: ['rounded'],
      groundPreference: ['mat', 'mound'],
    },
  },

  {
    id: 'cottage-garden',
    name: 'Cottage Garden',
    subtitle: 'Lush layers · Flowing borders · Naturalistic charm',
    description: 'Abundant mixed borders with layered heights, meandering paths, and a profusion of color. Inspired by English garden tradition adapted to local climate.',
    icon: '❀',
    ground: { material: 'lawn', color: '#4a7a3a', accent: '#3a6a2a' },
    hardscape: { color: '#a08a6a', edging: '#7a6a50', style: 'organic' },
    layout: {
      trees: [
        { x: 0.2, z: 0.2 },
        { x: 0.8, z: 0.25 },
        { x: 0.5, z: 0.8 },
      ],
      shrubs: [
        { x: 0.1, z: 0.4, count: 4, spacing: 0.07 },
        { x: 0.85, z: 0.5, count: 3, spacing: 0.06 },
        { x: 0.4, z: 0.65, count: 3, spacing: 0.07 },
      ],
      ground: [
        { x: 0.3, z: 0.35, radius: 0.18 },
        { x: 0.65, z: 0.55, radius: 0.15 },
        { x: 0.15, z: 0.75, radius: 0.12 },
      ],
      paths: [
        { from: { x: 0.5, z: 0.0 }, via: { x: 0.4, z: 0.5 }, to: { x: 0.5, z: 1.0 }, width: 0.05, curve: true },
      ],
      features: [
        { type: 'arbor', x: 0.5, z: 0.02, w: 0.08, d: 0.04 },
      ],
    },
    plantStrategy: {
      treePreference: ['vase', 'rounded', 'layered'],
      shrubPreference: ['arching', 'rounded'],
      groundPreference: ['mound', 'grass'],
    },
  },

  {
    id: 'native-habitat',
    name: 'Native Habitat',
    subtitle: 'Ecological layers · Wildlife value · Sustainable design',
    description: 'Ecologically-driven design featuring native species in naturalistic drifts. Supports pollinators, birds, and beneficial insects while minimizing water and maintenance.',
    icon: '🌿',
    ground: { material: 'mulch', color: '#5a4a30', accent: '#4a3a20' },
    hardscape: { color: '#8a7a5a', edging: '#6a5a40', style: 'naturalistic' },
    layout: {
      trees: [
        { x: 0.3, z: 0.25 },
        { x: 0.7, z: 0.35 },
        { x: 0.15, z: 0.7 },
        { x: 0.8, z: 0.75 },
      ],
      shrubs: [
        { x: 0.2, z: 0.4, count: 5, spacing: 0.06 },
        { x: 0.6, z: 0.55, count: 4, spacing: 0.07 },
        { x: 0.45, z: 0.85, count: 3, spacing: 0.06 },
      ],
      ground: [
        { x: 0.35, z: 0.3, radius: 0.2 },
        { x: 0.55, z: 0.7, radius: 0.22 },
        { x: 0.1, z: 0.55, radius: 0.12 },
      ],
      paths: [
        { from: { x: 0.5, z: 0.0 }, via: { x: 0.45, z: 0.4 }, to: { x: 0.4, z: 1.0 }, width: 0.04, curve: true },
      ],
      features: [
        { type: 'boulder', x: 0.6, z: 0.4 },
        { type: 'boulder', x: 0.25, z: 0.6 },
      ],
    },
    plantStrategy: {
      treePreference: ['spreading', 'vase', 'layered'],
      shrubPreference: ['rounded', 'arching', 'rosette', 'grass'],
      groundPreference: ['grass', 'mound', 'mat'],
    },
  },
];
