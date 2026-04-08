type LocationResult = { address: string; city: string; lat: number; lng: number };

let _cb: ((r: LocationResult) => void) | null = null;

export function setLocationCallback(cb: typeof _cb) {
  _cb = cb;
}

export function clearLocationCallback() {
  _cb = null;
}

export function fireLocationCallback(r: LocationResult) {
  _cb?.(r);
  _cb = null;
}
