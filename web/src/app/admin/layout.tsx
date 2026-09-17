import { SiteFooter } from "@/components/site-footer";

/**
 * Shared admin shell (owner, 2026-09-17): the site footer sits after every
 * /admin page's content — including the tall, scrolling builder — not
 * fixed to the viewport. The admin header itself is rendered by the root
 * layout's <SiteHeader />, which already switches on the /admin pathname.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {children}
      <SiteFooter variant="admin" />
    </>
  );
}
