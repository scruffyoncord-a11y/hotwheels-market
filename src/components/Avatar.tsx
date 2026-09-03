import Image from "next/image";

export function Avatar({
  name,
  url,
  size = 40,
  className = "",
}: {
  name: string;
  url?: string;
  size?: number;
  className?: string;
}) {
  if (url) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={name} fill unoptimized className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
