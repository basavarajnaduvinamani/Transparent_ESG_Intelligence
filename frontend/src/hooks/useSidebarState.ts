import { useEffect, useState } from 'react';

const STORAGE_KEY = 'three-body-sidebar-expanded';

export function useSidebarState() {
  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(expanded));
  }, [expanded]);

  const toggle = () => setExpanded((prev) => !prev);

  return { expanded, toggle, setExpanded };
}
