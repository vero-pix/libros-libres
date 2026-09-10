import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * El boton del sitio, en un solo lugar.
 *
 * Antes el boton primario existia en ~15 variantes escritas a mano: cuatro
 * radios (md/lg/xl/2xl), cuatro alturas (py-2.5 a py-4) y `font-bold` o
 * `font-semibold` segun la pantalla. Los valores de aca reproducen la variante
 * dominante, la que ya estaba repetida mas veces, para que el sitio se vea
 * igual y el cambio siguiente se haga una sola vez. (10-09-2026)
 *
 * `coral` es el boton de comprar: se reserva para la accion de compra de la
 * ficha, no se usa como acento decorativo.
 */

type Variant = "primary" | "secondary" | "outline" | "coral" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-cream " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary:
    "border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white",
  // el acompanante del primario en las landings: blanco con borde tinta
  outline:
    "bg-white border border-ink/20 text-ink hover:border-brand-500 hover:text-brand-600",
  coral: "bg-coral text-white hover:bg-coral-deep",
  ghost: "text-ink hover:bg-cream-warm",
};

const sizes: Record<Size, string> = {
  sm: "px-5 py-2.5 text-sm rounded-lg",
  md: "px-6 py-3 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-base rounded-xl",
};

function classes(variant: Variant, size: Size, fullWidth: boolean, extra?: string) {
  return [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type SharedProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = SharedProps &
  Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, fullWidth, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = SharedProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

/** Mismo boton, cuando la accion es navegar. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </Link>
  );
}
