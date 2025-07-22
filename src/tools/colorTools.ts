// Color Tools Module: Provides utilities for color manipulation, palette generation, and gradient creation
// This module includes functions for color conversion, palette generation, and gradient creation.

// Interfaces for type safety and API contracts
export interface Color {
    hex: string; // e.g., "#FF0000"
    rgb: [number, number, number]; // e.g., [255, 0, 0]
    hsl: [number, number, number]; // e.g., [0, 100, 50] (hue: 0-360, saturation: 0-100, lightness: 0-100)
  }

  export interface ColorPalette {
    primary: Color;
    complementary: Color;
    analogous: [Color, Color]; // Two analogous colors
    triadic: [Color, Color]; // Two triadic colors
    shades: Color[]; // Array of shades (darker variations)
    tints: Color[]; // Array of tints (lighter variations)
  }

  export interface Gradient {
    css: string; // CSS gradient string, e.g., "linear-gradient(90deg, #FF0000, #00FF00)"
    colors: Color[]; // Array of colors in the gradient
    direction: string; // e.g., "90deg"
  }

  // Utility to validate hex color format
  const validateHexColor = (hex: string, toolName: string): void => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
      throw new Error(`${toolName}: Invalid hex color format. Use #RRGGBB (e.g., #FF0000)`);
    }
  };

  // Utility to convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Utility to convert RGB to HSL
  const rgbToHsl = (rgb: [number, number, number]): [number, number, number] => {
    const [r, g, b] = rgb.map(val => val / 255); // Normalize to 0-1
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  // Utility to convert HSL to RGB
  const hslToRgb = (hsl: [number, number, number]): [number, number, number] => {
    const [h, s, l] = [hsl[0] / 360, hsl[1] / 100, hsl[2] / 100];
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Utility to convert RGB to Hex
  const rgbToHex = (rgb: [number, number, number]): string => {
    const [r, g, b] = rgb.map(val => Math.max(0, Math.min(255, Math.round(val))));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  };

  // Utility to create a Color object from a hex color
  const createColor = (hex: string): Color => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    return { hex, rgb, hsl };
  };

  // Color Picker: Converts a hex color to various formats (RGB, HSL)
  export const colorPicker = (hexColor: string): Color => {
    validateHexColor(hexColor, 'Color Picker');
    return createColor(hexColor);
  };

  // Palette Generator: Generates a color palette based on a base color
  export const paletteGenerator = (baseHex: string, shadeSteps: number = 5, tintSteps: number = 5): ColorPalette => {
    validateHexColor(baseHex, 'Palette Generator');
    if (shadeSteps < 1 || tintSteps < 1) {
      throw new Error('Palette Generator: shadeSteps and tintSteps must be positive integers');
    }

    const baseColor = createColor(baseHex);
    const [h, s, l] = baseColor.hsl;

    // Complementary color (180 degrees opposite on the color wheel)
    const complementaryHsl: [number, number, number] = [(h + 180) % 360, s, l];
    const complementaryRgb = hslToRgb(complementaryHsl);
    const complementary = createColor(rgbToHex(complementaryRgb));

    // Analogous colors (30 degrees on either side of the base color)
    const analogous1Hsl: [number, number, number] = [(h + 30) % 360, s, l];
    const analogous2Hsl: [number, number, number] = [(h - 30 + 360) % 360, s, l];
    const analogous1 = createColor(rgbToHex(hslToRgb(analogous1Hsl)));
    const analogous2 = createColor(rgbToHex(hslToRgb(analogous2Hsl)));

    // Triadic colors (120 degrees on either side of the base color)
    const triadic1Hsl: [number, number, number] = [(h + 120) % 360, s, l];
    const triadic2Hsl: [number, number, number] = [(h - 120 + 360) % 360, s, l];
    const triadic1 = createColor(rgbToHex(hslToRgb(triadic1Hsl)));
    const triadic2 = createColor(rgbToHex(hslToRgb(triadic2Hsl)));

    // Shades (darker variations by decreasing lightness)
    const shades: Color[] = [];
    const shadeStep = l / (shadeSteps + 1);
    for (let i = 1; i <= shadeSteps; i++) {
      const shadeHsl: [number, number, number] = [h, s, Math.max(0, l - shadeStep * i)];
      const shadeRgb = hslToRgb(shadeHsl);
      shades.push(createColor(rgbToHex(shadeRgb)));
    }

    // Tints (lighter variations by increasing lightness)
    const tints: Color[] = [];
    const tintStep = (100 - l) / (tintSteps + 1);
    for (let i = 1; i <= tintSteps; i++) {
      const tintHsl: [number, number, number] = [h, s, Math.min(100, l + tintStep * i)];
      const tintRgb = hslToRgb(tintHsl);
      tints.push(createColor(rgbToHex(tintRgb)));
    }

    return {
      primary: baseColor,
      complementary,
      analogous: [analogous1, analogous2],
      triadic: [triadic1, triadic2],
      shades,
      tints,
    };
  };

  // Gradient Creator: Generates a CSS gradient from a list of colors
  export const gradientCreator = (colors: string[], direction: string = '90deg'): Gradient => {
    if (!colors || colors.length < 2) {
      throw new Error('Gradient Creator: At least two colors are required');
    }
    if (!direction.match(/^\d+deg$/)) {
      throw new Error('Gradient Creator: Direction must be in the format "Xdeg" (e.g., "90deg")');
    }

    // Validate and convert colors
    const gradientColors: Color[] = colors.map((hex, index) => {
      validateHexColor(hex, `Gradient Creator (color ${index + 1})`);
      return createColor(hex);
    });

    // Generate CSS gradient string
    const colorStops = gradientColors.map(color => color.hex).join(', ');
    const css = `linear-gradient(${direction}, ${colorStops})`;

    return {
      css,
      colors: gradientColors,
      direction,
    };
  };