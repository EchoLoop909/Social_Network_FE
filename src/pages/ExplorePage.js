import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExplore } from "../store/exploreSlice";

export default function ExplorePage() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.explore);
  useEffect(() => {
    dispatch(fetchExplore());
  }, [dispatch]);

  return (
    <div className="p-6 grid grid-cols-3 gap-2 max-w-[950px]">
      {items.map((i) => (
        <img
          key={i.id}
          src={i.image}
          alt=""
          className="w-full h-64 object-cover rounded"
        />
      ))}
    </div>
  );
}
