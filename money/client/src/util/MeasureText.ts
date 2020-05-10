const $textMeasure = document.createElement('div');
Object.assign($textMeasure.style, {
  left: '100vw',
  opacity: 0,
  overflow: 'visible',
  pointerEvents: 'none',
  position: 'fixed',
  top: '100vh',
  whiteSpace: 'nowrap',
  zIndex: -1024,
});
document.body.append($textMeasure);

export const measureText = (text: string): number => {
  $textMeasure.textContent = text;
  return $textMeasure.clientWidth;
};
