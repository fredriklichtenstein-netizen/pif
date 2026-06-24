
interface PostFieldErrorProps {
  message?: string;
  className?: string;
}

/** Inline error message for a post form field. Renders nothing when empty. */
export function PostFieldError({ message, className }: PostFieldErrorProps) {
  if (!message) return null;
  return (
    <p
      data-post-error="true"
      className={`text-sm text-destructive mt-1 ${className ?? ""}`}
      role="alert"
    >
      {message}
    </p>
  );
}
