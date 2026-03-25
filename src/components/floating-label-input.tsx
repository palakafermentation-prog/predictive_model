import * as React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useFormField } from "./ui/form";
import { cn } from "@/lib/utils";

function useOptionalFormField() {
  try {
    return useFormField();
  } catch {
    return null;
  }
}

interface FloatingLabelInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(({ id, label, error, className, ...props }, ref) => {
  const formField = useOptionalFormField();

  const inputId = formField?.formItemId ?? id;
  const hasError = !!(formField?.error ?? error);
  const errorDescId =
    formField?.formMessageId ?? (error && id ? `${id}-error` : undefined);
  const hasAsterisk = label.endsWith(" *");
  const labelText = hasAsterisk ? label.slice(0, -2) : label;

  return (
    <div className="relative">
      <Input
        ref={ref}
        id={inputId}
        className={cn("peer placeholder-transparent", className)}
        placeholder=" "
        aria-invalid={hasError || undefined}
        aria-describedby={errorDescId}
        aria-required={hasAsterisk || undefined}
        {...props}
      />
      <Label
        htmlFor={inputId}
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
      {!formField && error && (
        <p id={errorDescId} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
FloatingLabelInput.displayName = "FloatingLabelInput";
