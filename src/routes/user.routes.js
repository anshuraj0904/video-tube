import { Router } from "express";

import { registerUser,
    loginUser,
    refreshAccessToken,
    changeLoginPassword,
    logoutUser,
    getCurrentUserDetails,
    updateAccountDetail,
    updateCoverImage,
    updateUserAvatar
} from "../controllers/user.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

// This one's important, wherein we'll be defining the place where we want to serve the following route.
router.route("/register").post(
        upload.fields([{
            name:"avatar",
            maxCount:1
        },
    {
        name:"coverImage",
        maxCount:1
    }]),
        registerUser)


router.route('/login').post(loginUser)        

router.route('/update-password').post(verifyJWT,changeLoginPassword) // since we need the _id so, here, the middleware named verifyJWT is being called here.
// Note:- next() in the middleware is simply used for the passing of baton from one part to the other.

router.route("/refresh-token").post(refreshAccessToken)

router.route('/logout').get(verifyJWT,logoutUser)

router.route('/user-details').get(verifyJWT,getCurrentUserDetails)

router.route('/update-details').post(verifyJWT, updateAccountDetail)

router.route('/update-coverImage').post(verifyJWT, updateCoverImage)

router.route('/update-avatar').post(verifyJWT, updateUserAvatar)

export default router        