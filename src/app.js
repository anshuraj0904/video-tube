import express from "express"
import cors from "cors"


const app = express()


// cors stands for cross-origin resource sharing, and, using this we can define which request to listen to, ignore the others.

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)


// Common Middle Wares:-
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

export {app}