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
    await user.save({validateBeforeSave : false})
  
      
    return {refresh_token, access_token}
  } catch (error) {
    throw new ApiError(500, "Error setting and getting the tokens!")
  }
}


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
})

export { registerUser, loginUser }