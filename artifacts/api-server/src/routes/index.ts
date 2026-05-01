import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import accessRouter from "./access.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accessRouter);
router.use(adminRouter);

export default router;
