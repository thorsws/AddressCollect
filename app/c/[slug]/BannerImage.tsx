'use client';

interface BannerImageProps {
  src: string;
  alt: string;
}

export default function BannerImage({ src, alt }: BannerImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-24 h-24 object-cover rounded"
      onError={(e) => {
        // Hide image if it fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
