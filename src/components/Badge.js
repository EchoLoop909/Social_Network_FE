export default function Badge({ className = "" }) {
  return (
    <span
      className={`inline-block min-w-[18px] h-[18px] px-1 text-[11px] leading-[18px] text-white bg-red-500 rounded-full text-center ${className}`}
    >
      •
    </span>
  );
}
