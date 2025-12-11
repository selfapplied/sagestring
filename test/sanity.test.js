const pkg = require('../package.json');

test('package.json has a name', () => {
  expect(typeof pkg.name).toBe('string');
  expect(pkg.name.length).toBeGreaterThan(0);
});
