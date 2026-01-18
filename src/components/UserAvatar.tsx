interface UserAvatarProps {
  email: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function UserAvatar({ email, color, size = "md", className = "" }: UserAvatarProps) {
  const firstLetter = email.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white select-none shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {firstLetter}
    </div>
  );
}
