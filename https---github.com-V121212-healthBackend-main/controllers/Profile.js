const User = require('../models/User')


function profile(para){
     const id = para;
}

exports.profile = (req , res) =>{
   try {
      


   }
   catch (error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Error fetching profile data",
    });
}
  

}