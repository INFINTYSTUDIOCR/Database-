/**
 * Lighthouse CI — local lab budgets for Infinity Studio CR homepage.
 * Not a substitute for Google PageSpeed Insights field data.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx --yes serve -l 5173 .',
      startServerReadyPattern: 'Accepting connections|Local:',
      startServerReadyTimeout: 60000,
      url: ['http://127.0.0.1:5173/'],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
