export default function Avatar({ src, size = 32, alt = "", ring = false }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${
        ring ? "ring-2 ring-pink-500" : ""
      }`}
    />
  );
}
