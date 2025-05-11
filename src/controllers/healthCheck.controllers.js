// Note:- Having a health check file in the controllers is a good way to know that everything is working fine, specially if we're running our file after a long time.

import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthCheck =  asyncHandler(async (req,res)=>{   
   console.log(`Able to reach here!`);
   const data = "Apple"
   return res
          .status(200)
          .json(new ApiResponse(200,data,"Health Check Passed")) // The constructor of ApiResponse take status, data and message and we've passed those from here.


})


export {healthCheck}