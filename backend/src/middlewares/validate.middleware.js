const validate=(schema)=>async(req,res,next)=>{
    try{
        req.body=await schema.parseAsync(req.body);
        next();
    }catch(error){
        return res.status(400).json({
            success:false,
            message: "Validation failed",
            errors:error.issues || error.errors,
        });
    }
};

export default validate;
