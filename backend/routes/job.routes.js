import express from "express"
import { getAdminJobs,getJobById,postJob,getAllJobs } from "../controllers/job.controller.js"
import isAuthenticated from "../middleware/isAuthenticated.js"

const router = express.Router()

router.route("/addJob").post(isAuthenticated,postJob)
router.route("/get").get(isAuthenticated,getAllJobs)
router.route("/get/:id").get(isAuthenticated,getJobById)
router.route("/getAdminJobs").get(isAuthenticated,getAdminJobs)

export default router