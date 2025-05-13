import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js"
import { warn } from "console"

import validator from "validator"
import jwt from "jsonwebtoken"
import { use } from "react"

const registerUser = asyncHandler(async (req, res) => {
  // Let us now write the business logic here:-

  if (!req.body) {
    throw new ApiError(400, "Request Body is Missing!")
  }
  const { fullName, email, username, password } = req.body

  if (!fullName || !email || !password || !username) {
    throw new ApiError(404, "Not all fields are present!")
  }

  // Validation: Here, we've used normal validations:-
  if (
    [fullName, email, username, password].some(
      (field) => String(field).trim() === ""
    )
  ) {
    throw new ApiError(400, "Some of the fields are empty!")
  }

  if(!validator.isEmail(email))
  {
    throw new ApiError(400, "Please provide a valid email !")
  }

  const isUserExisting = await User.findOne({
    $or: [{ username, email }],
    // This is like searching on the basis of or that is, if either of username or email is existing in the db, it'll return something.
  })

  if (isUserExisting) {
    throw new ApiError(409, "User with this email or username already exists!")
  }

  console.warn(req.files)
  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar file is missing!")
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath)
  // let coverImage = ""
  // if(coverImageLocalPath)
  // {
  //     coverImage = await uploadOnCloudinary(coverImageLocalPath)
  // }

  let avatar
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("Uploaded Avatar: ", avatar)
  } catch (error) {
    console.log("Error uploading the avatar: ", error)
    throw new ApiError(500, "Failed to upload the avatar!")
  }

  let coverImage
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("Uploaded Avatar: ", coverImage)
  } catch (error) {
    console.log("Error uploading the Cover Image: ", error)
    throw new ApiError(500, "Failed to upload the cover Image!")
  }

  try {
    const newUser = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username,
      username: username.toLowerCase(),
    })

    // This one below is just and extra step to ensure that the user was created successfully.
    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken -accesstoken "
    ) // This line here, seems like we're selecting certain fields, but, in reality, we're deselecting these fields by putting the '-' sign at the front.    )

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong with the creation of user!")
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "New User created successfully!")) // Because the ApiResponse method designed by us takes in three params(status code, data, message)
  } catch (error) {
    console.log("User creation failed!")

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id)
    }

    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id)
    }

    throw new ApiError(500, "Something went wrong while creating the user. All the images were deleted!")
  }
})



const getTokens = async (userId)=>{
  try {
    const user = await User.findById(userId)
    
    if(!user)
    {
      throw new ApiError(404, "User not found!")
    }
    
    const refresh_token = user.generateRefreshToken()
    const access_token = user.generateAccessToken() 
  
    user.refreshToken = refresh_token
    await user.save({validateBeforeSave : false})  // Saving the refreshToken into the database for the user.
  
      
    return {refresh_token, access_token}
  } catch (error) {
    throw new ApiError(500, "Error setting and getting the tokens!")
  }
}


const refreshAccessToken = asyncHandler(async(req, res)=>
{
  // Here, at the very first, we need to get the refresh_token from the cookies to see if the user is still logged in or not.
  const { incomingRefreshToken } = req.cookies.refreshToken || req.body.refreshToken
  // Remember, the refreshToken has the _id of the current user.
  
  // We'll now need to make a check if the current user is logged in or not, by matching the incomingRefreshToken with the existing refreshToken in the db.
  if(!incomingRefreshToken)
  {
    throw new ApiError(400, "No refresh token found, user might have logged out!")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
    ) 
   if(!decodedToken)
   {
    throw new ApiError(400, "Not verified!")
   }
    const user = await User.findById(decodedToken?._id)

  if(!user)
    {
      throw new ApiError(401, "Invalid Refresh Token!")
    } 
    
  if(incomingRefreshToken !== user?.refreshToken)
    {
      throw new ApiError(401,"Invalid Refresh Token!")
    }  

   // Next up, we'll re-generate the access and refresh tokens and before that, we'll delete the existing refresh token from the db and cookies and then set-up the new ones.
  const options = {
    httpOnly:true,
    secure: process.env.NODE_ENV === "production"
  }

  const {access_token, refresh_token:newRefreshToken}  =await getTokens(user._id)
  // Since, getTokens() method is saving the refreshToken in the db, so, we don't need to worry about that part of, if the refresh token is getting updated in the db or not, it is already being taken care of. 

  return res.status(200)
            .cookie("accessToken", access_token, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, 
              {access_token,
               refresh_token: newRefreshToken}, 
              "Tokens refreshed!")) 

  } catch (error) {
    throw new ApiError(500, "Some error while refreshing the access token and the refresh token!")
  }

})

const loginUser = asyncHandler(async(req,res)=>{
  if(!req.body)
  {
    throw new ApiError(400, "Request body is empty!")
  }
  const {emailorusername, password} =req.body

  if(!emailorusername || !password)
  {
    throw new ApiError(400, "Either of email or password is missing!")
  }
  let isUser

  if(validator.isEmail(emailorusername))
  {
     isUser = await User.findOne({email:emailorusername})
  }
  else{
    isUser = await User.findOne({username:emailorusername})
  }
    

  if(!isUser)
  {
    throw new ApiError(404, "User not found!")
  }

  // Checking for if the password mateches or not:-
  const isPassmatching = await isUser.isPasswordCorrect(password)
  if(!isPassmatching)
  {
    throw new ApiError(400,"Incorrect Password !")
  }
  
  const {refresh_token, access_token} = await getTokens(isUser._id)
  
  const loggedInUser = await User.findById(isUser._id)
                       .select("-password -refreshToken")


  if(!loggedInUser)
    {
      throw new ApiError(404, "User not logged in!") 
    }   
  
    const options = {
      httpOnly : true,
      secure : process.env.NODE_ENV === "production"
    }

  return res
         .status(200)
         .cookie("accessToken", access_token, options)
         .cookie("refreshToken", refresh_token, options)
         .json(new ApiResponse(200, loggedInUser, "Logged in successfully!"))
        //  .json(new ApiResponse(200, {user:loggedInUser, cookie:{"refreshToken":refresh_token,"accessToken": access_token}}, "Logged In Successfully!"))
         // This line below will work well for the mobile ussers of our application, as, there's nothing like cookies in the mobile apps. 
})

export { registerUser, loginUser, refreshAccessToken }