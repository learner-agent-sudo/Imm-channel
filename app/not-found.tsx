import NotFoundContent from "@/components/not-found-content";

// Replaces Next's default 404 markup, which uses inline styles that the
// site's Content-Security-Policy (scripts/csp.mjs) does not allow.
export default function NotFound() {
  return <NotFoundContent />;
}
