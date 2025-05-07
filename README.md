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
│   └── .env
└── package.json
```


# Steps to start:-
``` bash
     npm init
     npm install express cors dotenv mongoose
     npm install nodemon --save-dev
```