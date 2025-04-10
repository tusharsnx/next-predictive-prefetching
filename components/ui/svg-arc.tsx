import { getPointOnCircleAtAngle } from "#/lib/trig";
import type { ComponentPropsWithRef } from "react";

export function SVGArc({
  radius,
  startAngle,
  endAngle,
  ref,
  cx,
  cy,
  ...otherProps
}: ComponentPropsWithRef<"svg"> & {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}) {
  // SVG coordinates are counter-clockwise, whereas UI coordinates are clockwise.
  const start = getPointOnCircleAtAngle(cx, cy, radius, endAngle);
  const end = getPointOnCircleAtAngle(cx, cy, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

  const svgSize = 2 * radius;

  return (
    <svg
      ref={ref}
      width={`${svgSize}px`}
      height={`${svgSize}px`}
      aria-hidden
      {...otherProps}
    >
      <title>Prefetch Probing Area</title>
      <path
        fill="white"
        opacity="20%"
        d={`M${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy}`}
      />
    </svg>
  );
}
