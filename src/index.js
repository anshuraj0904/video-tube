import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8001

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is listening on ${PORT}`);
        
    })
})
.catch((err)=>{
    console.log(`MongoDB connection error!`)
})