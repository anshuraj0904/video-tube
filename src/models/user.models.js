/*
id pk string
  username string
  email string
  fullName string
  avatar string
  coverImage string
  watchHistory ObjectId[] videos
  password string
  refreshToken string
  createdAt Date
  updatedAt Date
*/

// We'll be defining the user table here:-
import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
    {
       username: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
       // index = true will make it easy for us to query based oon the index.
       // trim means it'll automatically trim all the extra spaces

       email: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },

      fullName: {
        type:String,
        required:true,
        trim:true},

      avatar:{
        type:String,  // Will be a cloudinary url
        required:true
      },
      coverImage:{
        type:String // Will be a cloudinary url
    },
      password:{
        type:String,
        required:[true,"Password is required"] // If someone will try to register without the password, he'll get this message being popped up.
    },
    watchHistory:[ // This is important, it'll be an array for sure.
       {
        type: Schema.Types.ObjectId,
        ref:"Video" // As, in the video.models.js, we'll have "Video" keyword used, and, we're refering to that here.
       }
    ],
    refreshToken:{  // This is an advance token
          type:String
    },
    
    },
    {timestamps:true} // This will automatically create two columns named createdAt and updatedAt in the schema, and, this is such a good thing on offer by mongoose.
    // Note:- This is after all the columns are defined and basically outside of that.
)


export const User = mongoose.model("User", userSchema)
// The part mongoose.model("user", userSchema) will create a table named User using the credentials passed in the userSchema by us. And, the export part is just for it to be used at different places.
// Note:- The standard practice is to pass the first letter as capital for the name of the schema, but, mongoose converts it to all small and pluralize it. So, it'll be stored as users in the database.