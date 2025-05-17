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
import { Mongoose } from "mongoose"

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

  if (!validator.isEmail(email)) {
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

    throw new ApiError(
      500,
      "Something went wrong while creating the user. All the images were deleted!"
    )
  }
})

const getTokens = async (userId) => {
  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "User not found!")
    }

    const refresh_token = user.generateRefreshToken()
    const access_token = user.generateAccessToken()

    user.refreshToken = refresh_token
    await user.save({ validateBeforeSave: false }) // Saving the refreshToken into the database for the user.

    return { refresh_token, access_token }
  } catch (error) {
    throw new ApiError(500, "Error setting and getting the tokens!")
  }
}

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Here, at the very first, we need to get the refresh_token from the cookies to see if the user is still logged in or not.
  const { incomingRefreshToken } =
    req.cookies.refreshToken || req.body.refreshToken
  // Remember, the refreshToken has the _id of the current user.

  // We'll now need to make a check if the current user is logged in or not, by matching the incomingRefreshToken with the existing refreshToken in the db.
  if (!incomingRefreshToken) {
    throw new ApiError(
      400,
      "No refresh token found, user might have logged out!"
    )
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    if (!decodedToken) {
      throw new ApiError(400, "Not verified!")
    }
    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token!")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token!")
    }

    // Next up, we'll re-generate the access and refresh tokens and before that, we'll delete the existing refresh token from the db and cookies and then set-up the new ones.
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }

    const { access_token, refresh_token: newRefreshToken } = await getTokens(
      user._id
    )
    // Since, getTokens() method is saving the refreshToken in the db, so, we don't need to worry about that part of, if the refresh token is getting updated in the db or not, it is already being taken care of.

    return res
      .status(200)
      .cookie("accessToken", access_token, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { access_token, refresh_token: newRefreshToken },
          "Tokens refreshed!"
        )
      )
  } catch (error) {
    throw new ApiError(
      500,
      "Some error while refreshing the access token and the refresh token!"
    )
  }
})

// Method for logging in the user:-
const loginUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is empty!")
  }
  const { emailorusername, password } = req.body

  if (!emailorusername || !password) {
    throw new ApiError(400, "Either of email or password is missing!")
  }
  let isUser

  if (validator.isEmail(emailorusername)) {
    isUser = await User.findOne({ email: emailorusername })
  } else {
    isUser = await User.findOne({ username: emailorusername })
  }

  if (!isUser) {
    throw new ApiError(404, "User not found!")
  }

  // Checking for if the password matches or not:-
  const isPassmatching = await isUser.isPasswordCorrect(password)
  if (!isPassmatching) {
    throw new ApiError(400, "Incorrect Password !")
  }

  const { refresh_token, access_token } = await getTokens(isUser._id)

  const loggedInUser = await User.findById(isUser._id).select(
    "-password -refreshToken"
  )

  if (!loggedInUser) {
    throw new ApiError(404, "User not logged in!")
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
    .status(200)
    .cookie("accessToken", access_token, options)
    .cookie("refreshToken", refresh_token, options)
    .json(new ApiResponse(200, loggedInUser, "Logged in successfully!"))
  //  .json(new ApiResponse(200, {user:loggedInUser, cookie:{"refreshToken":refresh_token,"accessToken": access_token}}, "Logged In Successfully!"))
  // This line below will work well for the mobile ussers of our application, as, there's nothing like cookies in the mobile apps.
})

// Mehtod to logout:-
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id)

  /*
  // if(!user)
  // {
  //   throw new ApiError(401, "You need to be logged in first, in order to hit this logout route!")
  // }

  This part of code above which I have commented out is not needed because,verifyJWT in the auth.middlewares.js already takes care of that! 
  */

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1, // This removes the field from document. So, refreshToken column will be deleted for the time being from the database.
      },
    },
    {
      new: true,
    }
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggeed out successfully!"))
})

// method for changing the password:-
const changeLoginPassword = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(
      404,
      "Enter the old and new password for updating the password!"
    )
  }
  const { oldPasscode, newPasscode } = req.body

  if (!oldPasscode || !newPasscode) {
    throw new ApiError(404, "Enter both old and new password!")
  }

  if (String(oldPasscode) === String(newPasscode)) {
    throw new ApiError(
      409,
      "New Password must be different from the existing one!"
    )
  }

  const isUser = User.findById(req.user?._id)

  if (!isUser) {
    throw new ApiError(401, "User doesn't exist!")
  }

  // Checking if we've entered the correct password or not:-
  const isPasswordValid = await isPasswordCorrect(oldPasscode)

  if (!isPasswordValid) {
    throw new ApiError(401, "Old Password is invalid!")
  }

  isUser.password = newPasscode
  await isUser.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfully!"))
})

const getCurrentUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id
  // const isLoggedIn = await User.findById(userId)

  // if(!isLoggedIn)
  // {
  //   throw new ApiError(401, "Unauthorized access!")
  // }

  const userDetails = await User.findById(userId).select(
    "-password -refreshToken"
  )

  return res
    .status(200)
    .json(new ApiResponse(200, userDetails, "Here're the User's details!"))
})

const updateAccountDetail = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(
      404,
      "Please enter the new fullname and username for updating the details!"
    )
  }
  const { fullName, username } = req.body

  if (!fullName) {
    throw new ApiError(404, "Enter fullname to be updated!")
  }

  if (!username) {
    throw new ApiError(404, "Enter user name to be updated!")
  }

  const isUsernameTaken = await User.findOne({
    username: username,
    _id: { $ne: req.user._id }, // $ne means negation
  })

  if (isUsernameTaken) {
    throw new ApiError(409, "Username is already taken!")
  }

  const userforcheck = await User.findById(req.user._id)
  if (String(userforcheck.username) === String(username)) {
    throw new ApiError(
      "The new username must be different from the previous one!"
    )
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        fullName,
      },
    },
    { new: true }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated succesfully!"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar File not found!")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(
      404,
      "Something went wrong while uploading the avatar file!"
    )
  }
  // Let us first delete the existing avatar file from the cloudinary:-

  const userDets = await User.findById(req.user?._id)

  const getPublicIdFromUrl = (url) => {
    const parts = url.split("/")
    const fileWithExtension = parts[parts.length - 1]
    const [publicId] = fileWithExtension.split(".")
    return publicId
  }

  const publicId = getPublicIdFromUrl(userDets.avatar)

  await deleteFromCloudinary(publicId)

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken")

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User avatar updated successfully!"))
  } catch (error) {
    throw new ApiError(400, "Something went wrong while updating the avatar!")
  }
})

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(404, "File is required!")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  const userDets = await User.findById(req.user?._id)

  const getPublicIdFromUrl = (url) => {
    const parts = url.split("/")
    const fileWithExtension = parts[parts.length - 1]
    const [publicId] = fileWithExtension.split(".")
    return publicId
  }

  const publicId = getPublicIdFromUrl(userDets.coverImage)

  await deleteFromCloudinary(publicId)

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken")

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "User cover Image updated successfully!")
      )
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while updating the cover Image!"
    )
  }
})

// Let us write down a few aggregation pipelines for a particular user for example, getting the list of subscribers of a user, his all the comments, his videos(uploaded by him and watched by him).
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required!")
  }

  const channelInfo = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", // As the subscriptions table has channels column which gives the list of the channels who've subscribed to me.
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscribers",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                req.user?._id,
                {
                  $map: {
                    input: "$subscribers",
                    as: "s",
                    in: "$$s.subscriber",
                  },
                },
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Project only the necessary data:-
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ])

  if (!channelInfo?.length) {
    throw new ApiError(404, "Channel not found!")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelInfo[0],
        "Channel Profile Info Fetched Successfully!"
      )
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const userWatchInfo = await User.aggregate([
    {
      $match: {
        _id: new Mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // Here, we're creating a pipeline within the pipeline over here, for getting limited data, as, we want to get the owner's name of the videos that the current user has seen.

        pipeline: [
          {
            $lookup: {
              from: "users", // Note:- Here, we're able to give the from as users, because we're in the sub-pipeline, for which the output is a lookup where we've from as videos, so, for this one, that from of the above one becomes the table we're aggregating upon.
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                    // These, the username, avatar and the fullName are of the owner of the videos that we've wateched
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner:{
                $arrayElemAt: ["$owner", 0],
              }
            },
          },
        ],
      },
    },
  ])

  if(!userWatchInfo?.length)
  {
    throw new ApiError(404,"Not found anything!")
  }

  return res
         .status(200)
         .json(new ApiResponse(200, userWatchInfo[0]?.watchHistory, "Fetched User's watch history Data!"))
})

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  changeLoginPassword,
  logoutUser,
  getCurrentUserDetails,
  updateCoverImage,
  updateAccountDetail,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory
}
