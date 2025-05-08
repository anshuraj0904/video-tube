/*
id pk string
name string
description string
createdAt Date
updatedAt Date
videos ObjectId[] videos
owner ObjectId[] users
*/

import mongoose, {Schema} from "mongoose";


const playlistSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
            default:`Anonymous Playlist ${Date.now()}`
        },
        description:{
            type:String
        },
        videos:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    },
    {timestamps:true}
)


export const Playlist = mongoose.model("Playlist", playlistSchema)