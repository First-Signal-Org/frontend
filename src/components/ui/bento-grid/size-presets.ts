import type { BentoItem, BentoSize } from './types'

// Size presets for different card types with 5 size options
export const getSizePresets = (type: BentoItem['type'], size: BentoSize = 'medium') => {
  const presets = {
    text: {
      xs: { w: 1.5, h: 1.5 },      // tiny square
      small: { w: 2.5, h: 2.5 },   // small square
      medium: { w: 4, h: 2.5 },    // medium rectangle
      large: { w: 5, h: 3 },       // large rectangle
      xl: { w: 2, h: 6 }           // extra large rectangle (tall)
    },
    url: {
      xs: { w: 1, h: 1 },      // tiny square
      small: { w: 2, h: 1 },   // small rectangle
      medium: { w: 3, h: 2 },  // medium rectangle
      large: { w: 4, h: 2 },   // large rectangle
      xl: { w: 5, h: 3 }       // extra large rectangle
    },
    image: {
      xs: { w: 1, h: 1 },      // tiny square
      small: { w: 2, h: 2 },   // small square
      medium: { w: 3, h: 3 },  // medium square
      large: { w: 4, h: 4 },   // large square
      xl: { w: 5, h: 4 }       // extra large rectangle
    },
    embed: {
      xs: { w: 1.5, h: 1.5 },      // tiny rectangle
      small: { w: 2.5, h: 2.5 },   // small rectangle
      medium: { w: 4, h: 2.5 },  // medium rectangle (16:9-ish)
      large: { w: 5, h: 3 },   // large rectangle
      xl: { w: 2, h: 6 }       // extra large rectangle
    }
  }
  
  return presets[type][size]
}
