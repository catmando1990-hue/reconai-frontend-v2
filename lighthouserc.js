// Lighthouse CI Configuration
// Uses JS to properly resolve BASE_URL environment variable
// PERFORMANCE BASELINE: Established 2026-01-22 with desktop preset
const baseUrl = process.env.BASE_URL || "https://www.reconaitechnology.com";

module.exports = {
  ci: {
    collect: {
      url: [
        // Public routes (no auth required)
        `${baseUrl}/`,
        `${baseUrl}/how-it-works`,
        `${baseUrl}/packages`,
        `${baseUrl}/security`,
        `${baseUrl}/sign-in`,
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        onlyCategories: ["performance"],
        throttlingMethod: "simulate",
        // Skip audits that are flaky on Windows CI
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        // Performance score: fail if below 75%
        "categories:performance": ["error", { minScore: 0.75 }],

        // Core Web Vitals thresholds (fail on regression)
        // LCP: 2.8s is "needs improvement" threshold - we target better
        "largest-contentful-paint": ["error", { maxNumericValue: 2800 }],
        // CLS: 0.1 is "good" threshold
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // INP: 200ms is "good" threshold
        "interaction-to-next-paint": ["warn", { maxNumericValue: 200 }],

        // Additional performance budgets
        "first-contentful-paint": ["warn", { maxNumericValue: 1800 }],
        "speed-index": ["warn", { maxNumericValue: 3400 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
      // Aggregate assertion: require majority of runs to pass
      aggregationMethod: "median-all",
    },
    upload: {
      // Store reports locally for CI archiving
      target: "filesystem",
      outputDir: "./lhci_reports",
    },
  },
};
