import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from '../utils/ApiError.js'
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const registerUser = asyncHandler(async (req,res)=>{
// Let us now write the business logic here:-
  const {fullName, email,username, password} = req.body
  
  // Validation: Here, we've used normal validations:-
  if(
    [fullName, email,username,password].some((field) => field.trim() === ""))
    {
        throw new ApiError(400, "Some of the fields are empty!")
    }

    const isUserExisting = await User.findOne({
        $or:[{username, email}]
        // This is like searching on the basis of or that is, if either of username or email is existing in the db, it'll return something. 
    })

    if(isUserExisting)
    {
        throw new ApiError(409,"User with this email or username already exists!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path 
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(404, "Avatar file is missing!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = ""
    if(coverImageLocalPath)
    {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username,
        username:username.toLowerCase() 
    })

    // This one below is just and extra step to ensure that the user was created successfully.
    const createdUser = User.findById(newUser._id).select(
        "-password -refreshToken -accesstoken ")  // This line here, seems like we're selecting certain fields, but, in reality, we're deselecting these fields by putting the '-' sign at the front.    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong with the creation of user!")         
    }

    return res
           .status(201)
           .json(new ApiResponse(201,createdUser,"New User created successfully!")) // Because the ApiResponse method designed by us takes in three params(status code, data, message)
})



export {registerUser}