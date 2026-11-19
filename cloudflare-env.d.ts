declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare const __GLUCO_SITES_GATEWAY__: boolean;
