import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onStoreChange);

  return () => mql.removeEventListener('change', onStoreChange);
}

// Read the same query we subscribe to: innerWidth can disagree with the media
// query near the breakpoint (zoom, fractional widths) without firing a change.
function getSnapshot() {
  return (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
