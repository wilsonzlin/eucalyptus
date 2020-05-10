export function OptionalView<T> ({
  props,
  children,
}: {
  props: T | undefined;
  children: (definedProps: T) => JSX.Element;
}) {
  return props == undefined ? null : children(props);
}
