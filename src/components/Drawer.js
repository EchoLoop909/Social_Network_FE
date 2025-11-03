import { motion, AnimatePresence } from "framer-motion";

export default function Drawer({
  open,
  onClose,
  width = 400,
  leftPx = 80,
  children,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/10 dark:bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -width, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -width, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 bottom-0 z-50 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 shadow-lg overflow-y-auto"
            style={{ width, left: leftPx }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
