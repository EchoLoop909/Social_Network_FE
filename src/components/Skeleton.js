export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-neutral-800 rounded ${className}`}
    />
  );
}
