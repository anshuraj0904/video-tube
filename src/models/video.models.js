/*
id pk string
  videoFile string
  thumbnail string
  title string
  description string
  Owner ObjectId[] users
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date
  */

import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
       videoFile:{
        type:String,  // cloudinary url
        required:true
       },

       thumbnail:{
        type: String, // cloudinary url
        required:true
       },
       title:{
        type:String,
        required:true
       },
       description:{
        type:String,
        required:true
       },       
       duration:{
        type:Number,
        required:true
       },
       view:{
        type:Number,
        default:0
       },
       isPublished:{
        type:Boolean,
        default:true
       },
       owner:
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        },
    },
    {timestamps:true}
)

videoSchema.plugin(mongooseAggregatePaginate) // Will help us write complex queries easily.
export const Video = mongoose.model("Video", videoSchema)