import type { SVGProps } from "react";

// Line icons on a 24px grid. Built from strokes so they can be drawn on scroll.
const paths = {
  tv: ["M3 5.5h18v11H3z", "M8.5 20h7", "M12 16.5V20"],
  fireplace: ["M3 21h18", "M4 21V9h16v12", "M2.5 9h19", "M9 21v-3.5a3 3 0 0 1 6 0V21", "M12 15.5c-1.2-.8-1.5-2-.6-3.2.5 1 1.4 1.1 1.6.2.9 1 .9 2.2-1 3z"],
  projector: ["M2.5 8.5h19v8h-19z", "M15.5 12.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0", "M5.5 12.5h4", "M5 16.5V19", "M19 16.5V19"],
  gazebo: ["M12 3L2.5 9.5h19z", "M4.5 9.5V20", "M19.5 9.5V20", "M12 9.5V20", "M3 20h18"],
  chevronDown: ["M6 9l6 6 6-6"],
  chevronLeft: ["M15 6l-6 6 6 6"],
  minus: ["M5 12h14"],
  alert: ["M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", "M12 7.5v5.5", "M12 16.5h.01"],
  pause: ["M8 5v14", "M16 5v14"],
  play: ["M7 4.5l12 7.5-12 7.5z"],
  appliance: ["M6 2.5h12v19H6z", "M6 9h12", "M9 5.5v1.5", "M9 11.5v3"],
  shelf: ["M4 3v18", "M20 3v18", "M4 8h16", "M4 14h16", "M4 20h16", "M7 8V5.5h4V8", "M13 14v-3h3.5v3"],
  blinds: ["M3 3.5h18", "M5 3.5v12", "M19 3.5v12", "M5 7h14", "M5 10.5h14", "M5 14h14", "M12 15.5v5"],
  speaker: ["M6 2.5h12v19H6z", "M12 14.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0", "M12 7m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0"],
  frame: ["M3 5h18v13H3z", "M6 8h12v7H6z", "M6 15l3.5-3.5 2.5 2.5 2-2 4 3"],
  wallpaper: ["M4 3h12v18H4z", "M16 6h4v15h-4", "M7 7l3 3-3 3", "M10 13l3 3"],
  wifi: ["M2.5 9a14 14 0 0 1 19 0", "M5.5 12.5a9.5 9.5 0 0 1 13 0", "M8.5 16a5 5 0 0 1 7 0", "M12 19.5h.01"],
  network: ["M9 3h6v5H9z", "M3 16h6v5H3z", "M15 16h6v5h-6z", "M12 8v4", "M6 16v-4h12v4"],
  pin: ["M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z", "M12 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"],
  truck: ["M2 6h12v10H2z", "M14 9h4l3 3.5V16h-7", "M6.5 18.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", "M17.5 18.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"],
  shield: ["M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z", "M8.5 12l2.5 2.5 4.5-5"],
  badge: ["M12 2.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 19.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z", "M8.8 11l2.2 2.2 4.2-4.2"],
  calendar: ["M3.5 5h17v15.5h-17z", "M3.5 9.5h17", "M8 2.5v4", "M16 2.5v4", "M7.5 13.5h3v3h-3z"],
  tools: ["M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2 0z", "M4 4l5 5", "M3 7l4-4"],
  check: ["M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", "M7.5 12.5l3 3 6-6.5"],
  phone: ["M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"],
  mail: ["M3 5h18v14H3z", "M3 6l9 7 9-7"],
  clock: ["M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", "M12 7v5l3.5 2"],
  star: ["M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"],
  arrow: ["M4 12h15", "M13 6l6 6-6 6"],
  arrowLeft: ["M20 12H5", "M11 6l-6 6 6 6"],
  menu: ["M3 7h18", "M3 12h18", "M3 17h18"],
  close: ["M5 5l14 14", "M19 5L5 19"],
  quote: ["M9.5 7H5v5h4v1c0 2-1 3.5-3.5 4", "M19.5 7H15v5h4v1c0 2-1 3.5-3.5 4"],
  user: ["M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M4 21c1-4 4.5-6 8-6s7 2 8 6"],
  plus: ["M12 5v14", "M5 12h14"],
  facebook: ["M14 8h3V4h-3a4 4 0 0 0-4 4v2.5H7.5v4H10V21h4v-6.5h3l.5-4H14V8.5a.5.5 0 0 1 .5-.5z"],
  instagram: ["M4 4h16v16H4z", "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M16.8 7.2h.01"],
  whatsapp: ["M4 20l1.2-4A8.5 8.5 0 1 1 8 19z", "M9 8.5c0 3.5 3 6.5 6.5 6.5l1-2-2-1-1 1c-1.2-.5-2.3-1.6-2.8-2.8l1-1-1-2z"],
} as const;

export type IconName = keyof typeof paths;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 24, strokeWidth = 1.6, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
