
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suppressFocus?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suppressFocus, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (suppressFocus && internalRef.current) {
        // Prevent focus on initial mount if suppressFocus is true
        const onFocus = (e: FocusEvent) => {
            e.preventDefault();
            (e.target as HTMLElement).blur();
        };
        const element = internalRef.current;
        
        // A bit of a hack: Dialogs often use a timeout to focus.
        // We add a listener briefly to catch and prevent this.
        const timeoutId = setTimeout(() => {
            element.addEventListener('focus', onFocus);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            if (element) {
              element.removeEventListener('focus', onFocus);
            }
        };
      }
    }, [suppressFocus]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={internalRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
