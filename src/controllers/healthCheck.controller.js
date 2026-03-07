import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";

/* 
const checkSystemHealth = (req, res) => {
    try {
        return res.status(200).json(
            new ApiResponse(200, { message: "system works fine!" })
        );
    } catch (error) {
        return res.json({ message: error, stackTrace: error.stack });
    }

};

 */

 const healthCheck = asyncHandlerFunction(async (req, res)=>{
        res.status(200).json(new ApiResponse(200, {message: "system works fine!"}));
    });


export default  healthCheck ;