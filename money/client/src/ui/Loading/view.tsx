import React from 'react';

export const MaybeLoadingStrip = ({
  loading
}: {
  loading: boolean;
}) => !loading ? null : (
  <div>Loading</div>
);
