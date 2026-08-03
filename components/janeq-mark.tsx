import type { SVGProps } from "react";

interface JaneQMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  accent?: string;
}

export function JaneQMark({ size = 42, accent = "#e9674f", ...props }: JaneQMarkProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 52 52"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M26 5.5c-11.3 0-20.5 8.9-20.5 20S14.7 45.5 26 45.5c3.3 0 6.4-.8 9.1-2.1l5.6 5.6 4.2-4.2-5.3-5.3c4.4-3.6 7-9.1 7-15.1 0-11.1-9.2-20-20.6-20Zm0 6c8 0 14.6 6.2 14.6 14s-6.6 14-14.6 14-14.5-6.2-14.5-14 6.5-14 14.5-14Z"
        fill="currentColor"
      />
      <path d="M25 20.5h7v7h-7v-7Z" fill={accent} />
      <path d="M37.5 31.5h5v5h-5v-5Z" fill={accent} opacity=".92" />
    </svg>
  );
}
