import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo-black.png"
      alt="Sapore di Carne"
      width={18527}
      height={3600}
      priority
      className={className}
    />
  );
}
