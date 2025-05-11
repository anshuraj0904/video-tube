import { Router } from "express";
import { healthCheck } from "../controllers/healthCheck.controllers.js";


const router = Router()


router.route("/").get((req, res, next) => {
  console.log("📍 Route middleware hit");
  next();
}, healthCheck);


export default router