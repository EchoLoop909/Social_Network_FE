import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { exchangeCodeForToken } from "../services/authApi";
import { setTokens, fetchMe } from "../store/authSlice";

export default function OAuthGate({ children }) {
  const loc = useLocation();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const p = new URLSearchParams(loc.search);
    const code = p.get("code");
    const state = p.get("state");
    if (!code || !state) return;

    (async () => {
      done.current = true;
      const tokens = await exchangeCodeForToken({ code, state });
      dispatch(setTokens(tokens));
      await dispatch(fetchMe());
      nav("/", { replace: true });
    })().catch(() => {
      nav("/login", { replace: true });
    });
  }, [loc.search, nav, dispatch]);

  return children;
}
