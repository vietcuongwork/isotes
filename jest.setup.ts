// Let a requestAnimationFrame queued by the last test (jest-preset polyfills it
// as a 0ms setTimeout) fire before Jest tears the environment down
afterAll(() => new Promise((resolve) => setTimeout(resolve, 50)));
