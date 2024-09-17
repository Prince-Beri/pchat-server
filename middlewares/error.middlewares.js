import { envMode } from "../app.js";

const errorMiddleware = (err, req, res, next) => {
    err.message ||= 'Invaild Server Error.';
    err.statusCode ||= 500;

    if(err.code === 11000){
        const error = Object.keys(err.keyPattern).join(',');
        err.message = `Duplicate field - ${error}`;
        err.statusCode = 400;
    }

    if(err.name === 'CastError'){
        const pathError = err.path;
        err.message = `Invalid Format of ${pathError}`;
        err.statusCode = 400;
    }

    const response = {
        success: true,
        message: err.message,
    };

    if(envMode === 'DEVLOPMENT'){
        response.error = err;
    }
    
    return res.status(err.statusCode).json(response);
}
const TryCatch = (passedFunction) => async (req, res, next) => {
    try{
        await passedFunction(req, res, next);
    }catch(error){
        next(error);
    }
};


export { errorMiddleware, TryCatch };