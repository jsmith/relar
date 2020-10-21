interface ImportMeta {
  env: { [_: string]: string | undefined } | undefined;
  hot: {
    accept: () => void;
  };
}
