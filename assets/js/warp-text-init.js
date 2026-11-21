import { createWarpText } from './warp-text.js';

const designer = document.querySelector('#heroWord');

if (designer) {
  let instance;

  const start = async () => {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!designer.isConnected) return;

      instance = createWarpText(designer, {
        text: 'DESIGNER',
        color: '#ffffff',
        warpStrength: 0.14,
        warpScale: 2.2,
        speed: 1.25,
        lens: 'swirl',
        pointerInfluence: 0.52,
        pointerStrength: 0.59,
        refraction: 0.021,
        chromatic: 0.1,
        idleDrift: 0.85,
        ripple: true,
        clickRipple: true,
        intro: true,
        fontSize: 'clamp(3rem, 10vw, 9rem)',
        fontWeight: 900,
        fontFamily: 'inherit',
        letterSpacing: '-0.08em',
        lineHeight: 0.9
      });
    } catch (error) {
      console.error('WarpText DESIGNER: falha na inicialização.', error);
      instance?.destroy();
    }
  };

  start();
  window.addEventListener('pagehide', () => instance?.destroy(), { once: true });
}
