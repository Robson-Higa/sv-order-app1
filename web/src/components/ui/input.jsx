import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn('input-custom', className)}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
