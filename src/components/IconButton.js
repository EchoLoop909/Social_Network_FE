export default function IconButton({ children, onClick, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
    >
      {children}
    </button>
  );
}
