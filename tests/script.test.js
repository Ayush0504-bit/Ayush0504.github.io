/**
 * Unit tests for the pure logic in script.js.
 *
 * script.js only wires up DOM behaviour when a `#typedText` element exists, so
 * requiring it from a bare jsdom environment simply exposes the `portfolio`
 * helpers without triggering any animation loops or timers.
 */
const portfolio = require('../script.js');

const {
  WORDS,
  PARTICLE_COLORS,
  PARTICLE_COUNT,
  CONNECT_DIST,
  computeTypedFrame,
  createParticle,
  distance,
  connectionOpacity,
  bounceVelocity,
  particleColor,
  isScrolled,
  hasRequiredFields,
  parallaxRatios,
  avatarTransform,
  ringTransform,
} = portfolio;

describe('constants', () => {
  test('exposes the expected typing words', () => {
    expect(WORDS).toEqual([
      'AI Engineer',
      'Full-Stack Developer',
      'WebRTC Builder',
      'ML Enthusiast',
    ]);
  });

  test('particle configuration', () => {
    expect(PARTICLE_COLORS).toHaveLength(3);
    expect(PARTICLE_COUNT).toBe(90);
    expect(CONNECT_DIST).toBe(120);
  });
});

describe('computeTypedFrame', () => {
  const words = ['ab'];

  test('types the first character', () => {
    const frame = computeTypedFrame(words, 0, 0, false);
    expect(frame.text).toBe('a');
    expect(frame.charIndex).toBe(1);
    expect(frame.isDeleting).toBe(false);
    expect(frame.wordIndex).toBe(0);
    expect(frame.speed).toBe(110);
  });

  test('pauses and flips to deleting once the word is complete', () => {
    const frame = computeTypedFrame(words, 0, 1, false);
    expect(frame.text).toBe('ab');
    expect(frame.charIndex).toBe(2);
    expect(frame.isDeleting).toBe(true);
    expect(frame.speed).toBe(1800);
  });

  test('deletes a character', () => {
    const frame = computeTypedFrame(words, 0, 2, true);
    expect(frame.text).toBe('a');
    expect(frame.charIndex).toBe(1);
    expect(frame.isDeleting).toBe(true);
    expect(frame.speed).toBe(60);
  });

  test('advances to the next word when fully deleted and wraps around', () => {
    const multi = ['ab', 'cd'];
    const frame = computeTypedFrame(multi, 0, 1, true);
    expect(frame.text).toBe('');
    expect(frame.charIndex).toBe(0);
    expect(frame.isDeleting).toBe(false);
    expect(frame.wordIndex).toBe(1);
    expect(frame.speed).toBe(400);

    const wrap = computeTypedFrame(multi, 1, 1, true);
    expect(wrap.wordIndex).toBe(0);
  });

  test('runs a full cycle for a single word without going out of bounds', () => {
    let state = { wordIndex: 0, charIndex: 0, isDeleting: false };
    const rendered = [];
    for (let i = 0; i < 20; i++) {
      const frame = computeTypedFrame(WORDS, state.wordIndex, state.charIndex, state.isDeleting);
      rendered.push(frame.text);
      state = frame;
      expect(frame.charIndex).toBeGreaterThanOrEqual(0);
      expect(frame.charIndex).toBeLessThanOrEqual(WORDS[frame.wordIndex].length);
    }
    expect(rendered).toContain('AI Engineer');
  });
});

describe('createParticle', () => {
  test('uses the injected RNG for deterministic output', () => {
    const rng = () => 0.5;
    const p = createParticle(200, 100, rng);
    expect(p.x).toBe(100);
    expect(p.y).toBe(50);
    expect(p.r).toBeCloseTo(0.5 * 1.8 + 0.4);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.alpha).toBeCloseTo(0.5 * 0.5 + 0.1);
    expect(PARTICLE_COLORS).toContain(p.color);
  });

  test('keeps coordinates within canvas bounds across many draws', () => {
    let seed = 0;
    const rng = () => {
      seed += 0.13;
      return seed % 1;
    };
    for (let i = 0; i < 50; i++) {
      const p = createParticle(300, 150, rng);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(300);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(150);
    }
  });

  test('falls back to Math.random when no RNG is provided', () => {
    const p = createParticle(10, 10);
    expect(typeof p.x).toBe('number');
    expect(Number.isNaN(p.x)).toBe(false);
  });
});

describe('distance', () => {
  test('computes a 3-4-5 triangle', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  test('is zero for identical points', () => {
    expect(distance(7, 7, 7, 7)).toBe(0);
  });
});

describe('connectionOpacity', () => {
  test('returns null beyond the max distance', () => {
    expect(connectionOpacity(150)).toBeNull();
    expect(connectionOpacity(120)).toBeNull();
  });

  test('fades linearly toward zero as distance grows', () => {
    expect(connectionOpacity(0)).toBeCloseTo(0.12);
    expect(connectionOpacity(60)).toBeCloseTo(0.06);
  });

  test('respects a custom max distance', () => {
    expect(connectionOpacity(40, 50)).toBeCloseTo(0.12 * (1 - 40 / 50));
    expect(connectionOpacity(50, 50)).toBeNull();
  });
});

describe('bounceVelocity', () => {
  test('reflects when below zero', () => {
    expect(bounceVelocity(-1, 0.3, 100)).toBe(-0.3);
  });

  test('reflects when past the max', () => {
    expect(bounceVelocity(101, -0.3, 100)).toBe(0.3);
  });

  test('leaves velocity untouched inside bounds', () => {
    expect(bounceVelocity(50, 0.3, 100)).toBe(0.3);
  });
});

describe('particleColor', () => {
  test('composes a valid rgba string', () => {
    expect(particleColor('rgba(232,97,26,', 0.5)).toBe('rgba(232,97,26,0.5)');
  });
});

describe('isScrolled', () => {
  test('true above the default threshold', () => {
    expect(isScrolled(51)).toBe(true);
  });

  test('false at or below the default threshold', () => {
    expect(isScrolled(50)).toBe(false);
    expect(isScrolled(0)).toBe(false);
  });

  test('honours a custom threshold', () => {
    expect(isScrolled(30, 20)).toBe(true);
    expect(isScrolled(10, 20)).toBe(false);
  });
});

describe('hasRequiredFields', () => {
  test('true when all fields are filled', () => {
    expect(hasRequiredFields('Ayush', 'a@b.com', 'hi')).toBe(true);
  });

  test('false when any field is empty or whitespace', () => {
    expect(hasRequiredFields('', 'a@b.com', 'hi')).toBe(false);
    expect(hasRequiredFields('Ayush', '   ', 'hi')).toBe(false);
    expect(hasRequiredFields('Ayush', 'a@b.com', '')).toBe(false);
  });

  test('handles non-string inputs safely', () => {
    expect(hasRequiredFields(undefined, null, 5)).toBe(false);
  });
});

describe('parallaxRatios', () => {
  test('center of the viewport yields zero ratios', () => {
    expect(parallaxRatios(500, 400, 1000, 800)).toEqual({ xRatio: 0, yRatio: 0 });
  });

  test('corners map to the [-1, 1] extremes', () => {
    expect(parallaxRatios(0, 0, 1000, 800)).toEqual({ xRatio: -1, yRatio: -1 });
    expect(parallaxRatios(1000, 800, 1000, 800)).toEqual({ xRatio: 1, yRatio: 1 });
  });
});

describe('transforms', () => {
  test('avatarTransform scales the ratios by 6px', () => {
    expect(avatarTransform(1, -1)).toBe('translate(6px, -6px)');
  });

  test('ringTransform includes rotation from the timestamp', () => {
    expect(ringTransform(1, 1, 5000)).toBe('rotate(100deg) translate(10px, 10px)');
  });
});
