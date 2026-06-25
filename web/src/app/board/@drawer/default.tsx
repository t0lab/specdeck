// Fallback for the `@drawer` slot when no route is intercepted — i.e. on the
// plain /board route and on hard-nav/refresh of /board/[spec]. Rendering null
// keeps the drawer closed; the full detail page renders via `children` instead.
export default function DrawerDefault() {
  return null;
}
