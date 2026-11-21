import { createWarpText } from './warp-text.js';

const hero = document.querySelector('#hero');
const designer = document.querySelector('#heroWord');
const luccas = document.querySelector('.hero-top-title');

if (hero && designer && luccas) {
  const instances = [];
  const start = async () => {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!designer.isConnected || !luccas.isConnected) return;
      instances.push(createWarpText(designer, {
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
        fontSize: 'clamp(58px, 11.3vw, 190px)',
        fontWeight: 900,
        fontFamily: "'Michroma', 'Arial Black', sans-serif",
        letterSpacing: '-0.075em',
        lineHeight: 1
      }));
      instances.push(createWarpText(luccas, {
        text: 'LUCCAS',
        color: '#ffffff',
        warpStrength: 0.10,
        warpScale: 2.2,
        speed: 1.25,
        lens: 'swirl',
        pointerInfluence: 0.52,
        pointerStrength: 0.45,
        refraction: 0.021,
        chromatic: 0.1,
        idleDrift: 0.85,
        ripple: true,
        clickRipple: true,
        intro: true,
        fontSize: 'clamp(12px, 2.1vw, 28px)',
        fontWeight: 400,
        fontFamily: "'Michroma', sans-serif",
        letterSpacing: '0.36em',
        lineHeight: 1
      }));
    } catch (error) {
      console.warn('WarpText: não foi possível iniciar o efeito; texto HTML preservado.', error);
      instances.forEach(instance => instance.destroy());
    }
  };
  start();
  window.addEventListener('pagehide', () => instances.forEach(instance => instance.destroy()), { once: true });
}