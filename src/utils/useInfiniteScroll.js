import { useEffect, useRef } from "react";

export default function useInfiniteScroll(callback, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line
  }, deps);

  return ref;
}
