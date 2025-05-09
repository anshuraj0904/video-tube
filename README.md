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
```     


# Next up, we'll be writing middllewares for the database, for example, for encrypting the password. And, for this, we'll be using bcrypt or bcryptjs.
# Note- We have hooks in mongoose too, and, middleware is a sub-part of mongoose hooks. We've pre-hook and post-hook in mongoose hooks. 
# Imp:- we'll use 10 rounds for encrypting the password, though the standard number is 12. 