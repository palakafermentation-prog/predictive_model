import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

export function FloatingLabelInput({
  id,
  label,
  error,
  className,
  ...props
}: FloatingLabelInputProps) {
  const hasAsterisk = label.endsWith(" *");
  const labelText = hasAsterisk ? label.slice(0, -2) : label;
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="relative">
      <Input
        id={id}
        className={cn("peer placeholder-transparent", className)}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={errorId}
        aria-required={hasAsterisk || undefined}
        {...props}
      />
      <Label
        htmlFor={id}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground
                   cursor-text transition-all duration-200 motion-reduce:transition-none bg-transparent px-1
                   peer-focus:top-0 peer-focus:text-xs peer-focus:text-foreground
                   peer-[:not(:placeholder-shown)]:top-0
                   peer-[:not(:placeholder-shown)]:text-xs
                   peer-[:not(:placeholder-shown)]:text-foreground"
      >
        {labelText}
        {hasAsterisk && <span className="text-destructive"> *</span>}
      </Label>
      {error && <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
