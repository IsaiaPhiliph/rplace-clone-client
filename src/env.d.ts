/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMAGE_URL: string;
  readonly VITE_SOCKET_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
