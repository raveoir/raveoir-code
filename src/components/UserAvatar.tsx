interface UserAvatarProps {
  email: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
};

export function UserAvatar({ email, color, size = "md", className = "" }: UserAvatarProps) {
  const firstLetter = email.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white select-none ${className}`}
      style={{ backgroundColor: color }}
    >
      {firstLetter}
    </div>
  );
}
