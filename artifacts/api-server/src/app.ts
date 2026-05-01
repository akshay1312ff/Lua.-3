import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  const url = req.url ?? "";
  if (url.includes("/Access.php")) {
    express.raw({ type: "*/*", limit: "5mb" })(req, res, next);
  } else {
    express.json()(req, res, () => {
      express.urlencoded({ extended: true })(req, res, next);
    });
  }
});

app.use("/", router);
app.use("/api", router);

export default app;
