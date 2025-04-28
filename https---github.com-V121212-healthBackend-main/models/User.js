const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const graphValueSchema = new mongoose.Schema({
    date: { type: String, required: true },
    values: { type: [Number], required: true }
  });


const userSchema = new mongoose.Schema(
    {
            name:{
                type:String,
                required:true,
                trim:true
            },
            email:{
                type:String,
                required:true,
                trim:true
            },
            password:{
                type:String,
                required:true,
            },
            weight:{
               type:String,
               trim:true,
            },
            height:{
               type:String,
               trim:true,
            },
            bmi:{
               type:String,
               trim:true,
            },
            gender:{
              type:String,
            },
            visitors:{
                type:Number,
            },
            // for storing graphs value
            // graph_values:[{
            //    type:Number,
            // // type: [Number], // Array containing two numbers
            // // default: [0, 0] // Default value if not specified
            // }],
            graph_values: { type: [graphValueSchema], default: [] },
            
            // for storing token we also have to implement it on userSchema
            tokens:[
                {
                    token:{
                        type:String,
                        required:true,
                    }
                }
            ],
            image:{
                type:String,
            }


    },
);

//   jwt generation token function
// this._id refers to login wali id

 userSchema.methods.generateAuhtToken = async function(){
      try{
        let token = jwt.sign({_id:this._id}, process.env.JWT_SECRET);  

        //first thi.token refers the schema one token
        //than concat than inside tokens->token and than stors
        this.tokens = this.tokens.concat({token:token});
        //for save the token 
        await this.save();
        return token;
      }catch(err){
         console.log(err);
      }  
 }

module.exports = mongoose.model("user", userSchema);