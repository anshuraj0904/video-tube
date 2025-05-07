// As, this is inside the utils file, so, it is for sure that we'll be creating some utilities(functions) here to be used again and again, and, here in this file, we'll be creating a function to handle async errors.

const asyncHandler = (requestHandler)=>{
   return (req, res, next)=>{     // Note:- next is a middleware
          Promise.resolve(requestHandler(req,res,next))
          .catch((err)=> next(err))
   }
}
// This one above is a HOF, that takes a function named requestHandler and returns a function which when resolved, return the request, the response and the middleware, but, when there's an error, it returns the error via the middle ware.
// PS:- It helps our time, as, now we'll not have to write the api endpoints in the try-catch block. 


export {asyncHandler}