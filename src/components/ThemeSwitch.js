import { Moon, Sun } from "lucide-react";
import { useSelector } from "react-redux";

export default function ThemeSwitch({ onToggle }) {
  const theme = useSelector((s) => s.ui.theme);
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg 
                text-gray-700 dark:text-neutral-200
                hover:bg-gray-100 dark:hover:bg-neutral-800"
      onClick={onToggle}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      <span className="hidden xl:inline">
        Chế độ {theme === "dark" ? "Sáng" : "Tối"}
      </span>
    </button>
  );
}
