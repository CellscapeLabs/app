import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 h-10 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
    secondary:
      "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-400",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
