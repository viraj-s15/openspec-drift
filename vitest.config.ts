import { defineConfig } from 'vitest/config';

// .tools/ holds third-party checkouts with their own test suites, which must not run here.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
});
