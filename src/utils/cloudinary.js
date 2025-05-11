// This code here is for uploading from our local system to the cloudinary, that is, the step after multer's setup for storing things in the local storage. 

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

// Configuring Cloudinary:-
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:"auto" // for automatically detecting the type of file it is.
            }
        )

        console.log(response.url)

        // Once the file is  uploaded, we'd like to delete it from our servers.
        fs.unlinkSync(localFilePath)

        return response
        
    } catch (error) {
        // for any error, we'll remove that file from oour localFilePath too.
        fs.unlinkSync(localFilePath) // Just unlinking using the fs will do.
        return null 
    }
}


// Method to delete the uploaded avatar and the coverImage from cloudinary, in case if the user doesn't get created successfully!
const deleteFromCloudinary = async function(publicId){
  try {
     const result = await cloudinary.uploader.destroy(publicId)
     console.log(`Deleted from cloudinary. Public Id: ${result}`);
     
  } catch (error) {
    console.log(`Error deleting from cloudinary: ${error}`);
    
  }
}
export {uploadOnCloudinary, deleteFromCloudinary}