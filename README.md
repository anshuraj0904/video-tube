# Things to remember while making a professional MERN stack application:-

1. A proper folder structure should be made, which will help in easy maintenance of the code, and, it will also help in easy debugging of the code.
2. Connection of the Database, Creation of Database and its configuration must be done properly and using the .env file.
3. A proper middleware should be made, which will help in easy maintenance of the code, and, it will also help in easy debugging of the code.
4. Creating proper utils for reusability of the code, mainly for async handling(as, using the Express, we'll be creating API endpoints using async functions).
5. Creating proper error handling, which will help in easy maintenance of the code, and, it will also help in easy debugging of the code.
6. In the models folder, for each table of the database, a model should be created, which will help in easy maintenance of the code, and, it will also help in easy debugging of the code. Note:- We've used .models.js for creating models.
7. Each model will have a controller and each controller will have a route handler.
``` flow
          model -> controller -> route -> app(gets called here)
```          


# Our folder Structure:-
```
.
├── .env
├── README.md
├── src
│   ├── controllers
│   ├── models
│   ├── middlewares
│   ├── db
│   ├── routes
│   ├── utils
│   ├── app.js
│   ├── index.js
│   ├── constants.js
│   
└── package.json

Note:- This is a standard folder structure for any good full fledged MERN stack application(backend). 
```


# Steps to start:-
``` bash
     npm init
     npm install express cors dotenv mongoose
     npm install nodemon --save-dev
     ```

# Things to be installed as we move forward:-
``` bash
     npm i mongoose-aggregate-paginate-v2 # This will help in easy pagination of the results but, more than that, it'll help us in mongoose aggregate pipeline. 
     npm i bcrypt # This will be used for encrypting the password, which will also be a part of the mongoose middleware.
     npm i cookie-parser # This will be used for parsing the cookies.
     npm i jsonwebtoken # This will be used for authentication.
     npm i multer # This will be used for uploading files using multipart/form-data(mainly for images/urls/avatars).
     npm i cloudinary # This will be used for uploading files to cloudinary.
     npm i validator # This will be used for validating the data, right now, we've used it just for the email validation.
```     


# Next up, we'll be writing middllewares for the database, for example, for encrypting the password. And, for this, we'll be using bcrypt or bcryptjs.
# Note- We have hooks in mongoose too, and, middleware is a sub-part of mongoose hooks. We've pre-hook and post-hook in mongoose hooks. 
# Imp:- we'll use 10 rounds for encrypting the password, though the standard number is 12. 


# Note:- We'll have a route for every controller. 
# Imp:- Whole mechanism of user talking to the database happens only and only through the access token.
# Suppose, if the time for access_token is 15 minutes only, that means the user will have to re-login after every 15 minutes and that'll be pretty annoying, so, we'll have too write a route, which will regenerate the access and refresh token for the user, when triggered with a special code. And, this will be done by matching the existing refresh_token in the db with the one in cookies.