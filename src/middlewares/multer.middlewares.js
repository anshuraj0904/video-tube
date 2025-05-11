// Here, we'll be writing a middleware to save the images in the disk storage.
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 1e9)
    cb(null, file.mimetype + '-' + uniqueSuffix)
  }
})

export const upload = multer({
    storage
})