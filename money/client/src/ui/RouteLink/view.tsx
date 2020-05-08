import React from 'react';

export const RouteLink = ({
  title,
  path,
  children,
}: {
  title?: string,
  path: string;
  children: string;
}) => (
  <a href={`#${path}`} title={title}>{children}</a>
);
