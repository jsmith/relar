import express from "express";
import cors from "cors";
import { Sentry } from "./sentry";
import bodyParser from "body-parser";

export const ORIGINS = [
  "http://localhost:3000",
  "http://0.0.0.0:3000",
  "http://192.168.2.16:3000",
  "https://toga-4e3f5.web.app",
  "https://relar-production.web.app",
  "https://relar.app",
  "https://staging.relar.app",
  // iOS webview
  "capacitor://localhost",
  // Android webview
  "http://localhost",
];

export const configureExpress = (define: (app: ReturnType<typeof express>) => void) => {
  const app = express();

  app.use(Sentry.Handlers.requestHandler());
  app.use(bodyParser.json());
  app.use(
    cors({
      origin: ORIGINS,
    }),
  );
  define(app);
  app.use(Sentry.Handlers.errorHandler());

  return app;
};
