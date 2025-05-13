import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// The task of this middleware is just to get us the _id of the current user for some tasks. 


export const verifyJWT = asyncHandler(async(req, _, next)=>{
   const token = req.cookies.accessToken || 
                 req.header("Authorization")?.replace("Bearer ", "")
    // Note:- Bearer token is a part of authorization, which we can see in the postman too, which token the refresh token as a header named Authorization.
    // Also, notice that it is "Bearer " with a space, and that's because in the description part of the header with key = "Authorization", we fill in the following:- "Bearer access-token"

    if(!token)
    {
        throw new ApiError(401, "Unauthorized")
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
                               .select("-password -refreshToken")

        if(!user)
            {
                throw new ApiError(401, "Unauthorized!")
            }
        
        req.user = user // req has a user variable of itself, and, that's what we've set equal to the current user.
        
        next()
    }
    catch (error) {
          throw new ApiError(401, error?.message || "Invalid Access Token!")   
        }
    
})