import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import stakingPlansRouter from "./staking-plans";
import stakesRouter from "./stakes";
import transactionsRouter from "./transactions";
import webhooksRouter from "./webhooks";
import referralsRouter from "./referrals";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(stakingPlansRouter);
router.use(stakesRouter);
router.use(transactionsRouter);
router.use(webhooksRouter);
router.use(referralsRouter);
router.use(notificationsRouter);
router.use(adminRouter);

export default router;
