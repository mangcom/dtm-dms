import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  ...props,
});

export const LogoIcon = (props: IconProps) => (
  <svg {...base({ stroke: "#fff", strokeWidth: 1.9, ...props })}>
    <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M14 4v5h5" />
  </svg>
);

export const DashboardIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MaterialsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21 8V7l-9-4-9 4v1l9 4 9-4Z" />
    <path d="M3 8v9l9 4 9-4V8" />
    <path d="M12 12v9" />
  </svg>
);

export const WorkflowIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const DocumentsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

export const AdminIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <circle cx="17.5" cy="9" r="2.4" />
    <path d="M16 20a4.7 4.7 0 0 1 5.5-4.6" />
  </svg>
);

export const LogoutIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 12H3M6 8l-4 4 4 4" />
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...base({ width: 18, height: 18, strokeWidth: 1.9, ...props })}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const SunIcon = (props: IconProps) => (
  <svg {...base({ width: 16, height: 16, strokeWidth: 1.9, ...props })}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg {...base({ width: 16, height: 16, strokeWidth: 1.9, ...props })}>
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
  </svg>
);

export const SystemIcon = (props: IconProps) => (
  <svg {...base({ width: 16, height: 16, strokeWidth: 1.9, ...props })}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base({ width: 15, height: 15, stroke: "var(--text-3)", strokeWidth: 2, ...props })}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base({ width: 16, height: 16, stroke: "var(--text-3)", strokeWidth: 2, ...props })}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);

export const EditIcon = (props: IconProps) => (
  <svg {...base({ width: 15, height: 15, strokeWidth: 1.9, ...props })}>
    <path d="M4 20h4L18 10l-4-4L4 16v4Z" />
    <path d="M13 5l4 4" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base({ width: 15, height: 15, strokeWidth: 1.9, ...props })}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);
