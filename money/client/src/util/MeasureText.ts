const $textMeasure = document.createElement('div');
Object.assign($textMeasure.style, {
  position: 'fixed',
  top: '100vh',
  left: '100vw',
  zIndex: -1024,
  opacity: 0,
  pointerEvents: 'none',
});
document.body.append($textMeasure);

export const measureText = (text: string): number => {
  $textMeasure.textContent = text;
  return $textMeasure.clientWidth;
};
