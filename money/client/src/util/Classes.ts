export const cls = (...classes: (string | boolean | null | undefined)[]) => classes.filter(c => typeof c == 'string').join(' ');
