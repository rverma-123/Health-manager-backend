const User = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');



exports.signup = async (req, res) => {
    
    try {
        
         const {name , email, password} = req.body;
         
         if(!name || !email || !password){
            return res.status(400).send({
                success:false,
                message: "All field require"
               });
           }
           
           // Check if user already exists
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "User already exists. Please sign in to continue.",
				});
			}

            const hashedPassword = password;

            const user = await User.create({
                name,
                email,
                password:hashedPassword,
            });

            return res.status(201).send({
                success:true,
                user,
                message:"User created successfully",
            })

    } catch (error) {
        console.error(error);
		return res.status(500).json({
			success: false,
			message: "User cannot be registered. Please try again.",
		});
    }

}


exports.login = async (req , res) =>{
    try {
        //for token
        let token;
        // Get email and password from request body
         const { email, password } = req.body;
 
         if (!email || !password) {
             return res.status(400).json({
                 success: false,
                 message: `Please Fill up All the Required Fields`,
             });
         }
 
         // Find user with provided email
         const user = await User.findOne({ email});
 
         
         // If user not found with provided email
         if (!user) {
             // Return 401 Unauthorized status code with error message
             return res.status(401).json({
                 success: false,
                 message: `User is not Registered with Us Please SignUp to Continue`,
             });
         }
 
         // if (await bcrypt.compare(password, user.password)){
         // 	return res.status(401).json({
         // 		success: true,
         // 		message: `login success ${password} `,
         // 	});
 
         // }
        //  if ((password === user.password)){
        //      return res.status(200).json({
        //          success: true,
        //          message: `login success `,
        //      });
        //  }
        if ((password === user.password)){
              
             //for generating jwt token simply we call a dunction i.e. generateAuhtToken() in userSachema:
              token = await user.generateAuhtToken();
              console.log(token);
              
            //   generating cookie with the help of token
            //the first field id the name of cookie i.e. "jwtoken"
            res.cookie("jwtoken",token,{
                expires: new Date(Date.now() + 60000),
                httpOnly: true,
                //secure: true,
            });


            return res.status(200).json({
                         success: true,
                         message: `login success `,
                     });  
        }
         else{
             return res.status(401).json({  
                 success: false,
                 message: `password not matching`,
             });
         }        
 
    } catch (error) {
     console.error(error);
     return res.status(500).json({
         success: false,
         message: "Login failed . Please try again.",
     });
    }
     
 }