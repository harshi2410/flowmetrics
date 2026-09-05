import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = BaseProps & {
  href: string;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

const variantClasses: Record<NonNullable<BaseProps["variant"]>, string> = {
  primary: "bg-signal text-ink hover:bg-signal/90",
  secondary: "border border-line bg-surface text-text hover:border-signal/50",
  ghost: "text-text hover:bg-surface",
};

const sizeClasses: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
};

function classes(variant: BaseProps["variant"], size: BaseProps["size"], className?: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    variantClasses[variant ?? "primary"],
    sizeClasses[size ?? "md"],
    className ?? "",
  ].join(" ");
}

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant, size, className, children } = props;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes(variant, size, className)}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _variant, size: _size, className: _className, children: _children, href: _href, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
