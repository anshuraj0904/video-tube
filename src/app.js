import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

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
app.use(cookieParser) // for reading the cookies.

// Bringing/importing the routes:-
import healthCheckRouter from "./routes/healthCheck.routes.js"
import userRouter from "./routes/user.routes.js" 


app.use("/api/v1/healthcheck", healthCheckRouter) 
// This line above means, if someone will hit the /api/v1/healthcheck route, then, healthCheckRouter will be served.
// Now, if we track back to the ./routes/healthCheck.routes.js, it is simply calling the healthCheck controller, which will eventually get served here.
app.use("/api/v1/users", userRouter) // This will be used by giving /api/v1/users/register, as we;ve given /register in the user.routes.js

export {app}