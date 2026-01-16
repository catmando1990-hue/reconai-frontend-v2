// Lighthouse CI Configuration
// Uses JS to properly resolve BASE_URL environment variable
const baseUrl = process.env.BASE_URL || 'https://www.reconaitechnology.com';

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/`,
        `${baseUrl}/how-it-works`,
        `${baseUrl}/packages`,
        `${baseUrl}/security`,
      ],
      numberOfRuns: 2,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
