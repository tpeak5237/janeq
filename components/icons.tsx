import type { SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "arrow-up-right"
  | "check"
  | "copy"
  | "download"
  | "external"
  | "moon"
  | "printer"
  | "refresh"
  | "shield"
  | "sun"
  | "upload"
  | "warning"
  | "x";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  const paths: Record<IconName, React.ReactNode> = {
    "arrow-right": <path d="M4 12h15m-6-6 6 6-6 6" {...common} />,
    "arrow-up-right": <path d="M5 19 19 5m-9 0h9v9" {...common} />,
    check: <path d="m5 12 4 4L19 6" {...common} />,
    copy: (
      <g {...common}>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </g>
    ),
    download: (
      <g {...common}>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M4 20h16" />
      </g>
    ),
    external: (
      <g {...common}>
        <path d="M14 5h5v5" />
        <path d="m19 5-8 8" />
        <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </g>
    ),
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" {...common} />,
    printer: (
      <g {...common}>
        <path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
        <path d="M7 14h10v6H7z" />
        <path d="M17 12h.01" />
      </g>
    ),
    refresh: (
      <g {...common}>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11" />
        <path d="M3 5v6h6" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 3L21 13" />
        <path d="M21 19v-6h-6" />
      </g>
    ),
    shield: (
      <path d="M12 3 5 6v5c0 4.7 2.9 8.8 7 10 4.1-1.2 7-5.3 7-10V6l-7-3Z" {...common} />
    ),
    sun: (
      <g {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </g>
    ),
    upload: (
      <g {...common}>
        <path d="M12 16V4m-5 5 5-5 5 5" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </g>
    ),
    warning: (
      <g {...common}>
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M12 9v4m0 3h.01" />
      </g>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" {...common} />,
  };

  return (
    <svg aria-hidden="true" focusable="false" height={size} viewBox="0 0 24 24" width={size} {...props}>
      {paths[name]}
    </svg>
  );
}
