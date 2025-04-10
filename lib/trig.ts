export type Point = {
  x: number;
  y: number;
};

export function isPointInArc(
  point: Point,
  origin: Point,
  radius: number,
  angleStart: number,
  angleEnd: number,
) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distSq = dx * dx + dy * dy;

  if (distSq > radius * radius) return false;

  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;

  let start = angleStart % (2 * Math.PI);
  let end = angleEnd % (2 * Math.PI);
  if (start < 0) start += 2 * Math.PI;
  if (end < 0) end += 2 * Math.PI;

  return start < end
    ? angle >= start && angle <= end
    : // handles wrap-around
      angle >= start || angle <= end;
}

export function getDirectionInRadians(p: Point) {
  // Calculates direction from the origin.
  const angle = Math.atan2(p.y, p.x);
  // Normalize to [0, 2π] for angle < 0
  return angle < 0 ? 2 * Math.PI + angle : angle;
}

export function getUnitVector(v: Point) {
  const mag = v.x * v.x + v.y * v.y;
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / Math.sqrt(mag), y: v.y / Math.sqrt(mag) };
}

export function addVectors(v1: Point, v2: Point): Point {
  return {
    x: v1.x + v2.x / 2,
    y: v1.y + v2.y / 2,
  };
}

export function getPointOnCircleAtAngle(
  cx: number,
  cy: number,
  r: number,
  angleInRad: number,
) {
  return {
    x: cx + r * Math.cos(angleInRad),
    y: cy + r * Math.sin(angleInRad),
  };
}

export function radToDeg(rad: number) {
  return rad * (180 / Math.PI);
}

export function degToRad(deg: number) {
  return deg * (Math.PI / 180);
}
