import { Router } from "express";

import { registerUser } from "../controllers/user.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";


const router = Router()

// This one's important, wherein we'll be defining the place where we wantto serve the following route.
router.route("/register").post(
        upload.fields({
            name:"avatar",
            maxCount:1
        },
    {
        name:"coverImage",
        maxCount:1
    }),
        registerUser)


export default router        