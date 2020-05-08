import React, {ReactChild} from 'react';

export const DialogFooter = ({
  children,
}: {
  children: ReactChild | ReactChild[],
}) => (
  <div>
    {children}
  </div>
);
