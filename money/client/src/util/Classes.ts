export const cls = (...classes: (string | boolean | null | undefined)[]) => classes.filter(c => typeof c == 'string').join(' ');

export const camelCase = (term: string) => term
  .split('-')
  .map((w, i) => i == 0 ? w : w[0].toUpperCase() + w.slice(1))
  .join('');
