import Link from "next/link";

/** The pink-bordered "Back to …" button from the Figma pages. */
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-link">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/back-arrow.svg" alt="" width={25} height={25} />
      <span>{label}</span>
    </Link>
  );
}
