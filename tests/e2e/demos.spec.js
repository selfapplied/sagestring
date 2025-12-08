import { test, expect } from '@playwright/test';

// Mock camera for WebRTC demos
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    // Mock getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        // Return a mock video stream
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const stream = canvas.captureStream(30);
        return stream;
      };
    }
  });
});

const demos = [
  // Main demos
  { path: '/demo/kaleid.html', name: 'Mathematical Kaleidoscope' },
  { path: '/demo/renorm.html', name: 'Symbolic Renormalization Flow' },
  { path: '/demo/zp.html', name: 'ZP Functor Demo' },
  { path: '/demo/quantum.html', name: 'Quantum Learning' },
  { path: '/demo/ecology.html', name: 'Ecological Energy Landscape' },
  { path: '/demo/diatom.html', name: 'Diatom Computing' },
  { path: '/demo/kernel.html', name: 'CE1 Kernel Binding' },
  { path: '/demo/learn.html', name: 'CE1 Learning Law' },
  
  // Sobel demos
  { path: '/demo/sobel/sobel.html', name: 'Sobel System' },
  
  // SVG Kernel demos
  { path: '/demo/svgkern/svgkern.html', name: 'SVG Kernel Demo' },
  
  // Livecam demos (with camera mock)
  { path: '/demo/livecam/liveCam.html', name: 'Livecam' },
];

for (const demo of demos) {
  test(`should load ${demo.name}`, async ({ page }) => {
    await page.goto(demo.path);
    await page.waitForLoadState('networkidle');
    
    // Check page loaded (no critical errors)
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore non-critical errors
        if (!text.includes('favicon') && !text.includes('404')) {
          errors.push(text);
        }
      }
    });
    
    // Wait a bit for any async initialization
    await page.waitForTimeout(1000);
    
    // Page should have loaded without critical errors
    expect(errors.length).toBe(0);
  });
}

