const ASSET_CACHE = new Map();

export function loadImage(url) {
  if (ASSET_CACHE.has(url)) {
    return Promise.resolve(ASSET_CACHE.get(url));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ASSET_CACHE.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}
