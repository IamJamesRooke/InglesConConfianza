import Image from "next/image";
import logo from "@/app/icon.png";

/** Temporary conversation-C identity; replace the source asset to update it. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1"
      style={{ width: size, height: size }}
    >
      <Image
        src={logo}
        alt=""
        width={size - 8}
        height={size - 8}
        sizes={`${size - 8}px`}
      />
    </span>
  );
}
