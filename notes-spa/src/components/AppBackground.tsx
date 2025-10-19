import { useEffect, useState } from "react";
import { useApi } from "../useApi";

export default function AppBackground() {
  const api = useApi();
  const [hash, setHash] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getNotes();
        const seed = Array.isArray(data) ? data.length : 7;
        setHash(seed);
      } catch {
        setHash(3);
      }
    })();
  }, []);

  return (
    <div aria-hidden className="bg-root">
      <div
        className="bg-gradient"
        style={{
          backgroundImage: `
            radial-gradient(60vmax 60vmax at ${20 + (hash % 60)}% ${30 + (hash % 40)}%, var(--bg-spot-1), transparent 70%),
            radial-gradient(50vmax 50vmax at ${70 - (hash % 50)}% ${70 - (hash % 30)}%, var(--bg-spot-2), transparent 70%)
          `,
        }}
      />
      <div className="bg-blur" />
    </div>
  );
}
