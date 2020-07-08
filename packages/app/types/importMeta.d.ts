declare interface ImportMeta {
  readonly env: {
    [key: string]: string | boolean | undefined;
    BASE_URL: string;
    MODE: string;
    DEV: boolean;
    PROD: boolean;
  };
}
