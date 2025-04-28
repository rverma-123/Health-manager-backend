require('dotenv').config()

//for sending message
const twilio = require('twilio');

//for sending the mail
const nodemailer = require('nodemailer');
const express = require('express')
//connection with db
const mongoose = require('mongoose')

//this is for clearing my graph data after a specific time
const cron = require('node-cron');

// for hash the password

//for uploading file in backend uses "multer library"
// const multer = require('multer');

var cors = require('cors')
//generate token
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

// importing user schema only for reset password
const User = require('./models/User');

//For uploading in cloudinary
const fileUpload = require('express-fileupload') 
const cloudinary = require('cloudinary').v2


// for payment integration
// use secret key not public key 
const stripe = require('stripe')('sk_test_51PazMXIv4x5YXzS3ERQS2Co6KABxOFE7fmWpq7zwfSPAGmwEzETwlCiNmSFKxjJ5puokdPeClewG4IHHb4eGKDGQ00Ph1A1Fh6');

//this is very impo for poasting the data
var bodyParser = require('body-parser');



const router = require('./routes/User');


// express app
const app = express()

// middleware
app.use(express.json())

//usign body parser
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors())


// app.use((req, res, next) => {
//   console.log(req.path, req.method)
//   next()
// })

//routes
app.use('/api/v1/auth' , router);



// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('connected to db1 & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  })


// this is for cloudinary--
app.use(fileUpload({
  useTempFiles: true,
}))
app.use(express.urlencoded({ extended: true }));



// another file for owner/admin
// mongoose.connect(process.env.MONGO_URI1)
//   .then(() => {
//     // listen for requests
//     app.listen(5000, () => {
//       console.log('connected to 2db & listening on port', 5000)
//     })
//   })
//   .catch((error) => {
//     console.log(error)
//   })




///////--------------------------------------------------------------------------------------------
//this code for email sending to user------------
  app.post('/reset_password', (req, res) => {
  
    console.log("Ayyaaaa");
      const {email} = req.body;
      User.findOne({email: email})
      .then(user => {
        if(!user){
          return res.send({Status : "user not existed"})
        }
        
        //generating token 
        const token = jwt.sign({_id:user._id}, process.env.JWT_SECRET, {expiresIn:"1d"})
        
        //// full code for sending the mail
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'v.verma7271@gmail.com',
              pass: 'ombz kybe vtuc smrm'
            }
          });
          console.log("Ayaa1");
          var mailOptions = {
            from: 'v.verma7271@gmail.com',
            to: `${email}`,
            subject: 'Reset your password',
            text: `http://localhost:3000/reset_password/${user._id}/${token}`
          };
          console.log("Ayaa2");
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              return res.send({Status : "Email sent successfully"})
            }
          });

      })
  })

  //this code for reseting the password ----------------------------------------------------------------------------------------------------------
app.post('/reset_password/:id/:token', async (req, res) => {
  const {id, token} = req.params;
  const {password} = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(id, { password: password });
      res.json({ Status: "Success" });
  } catch (err) {
      res.json({ Status: "Error", Message: err.message });
  }
});



//for update user profile-------------------------------------------------------------------------------------------------------
app.post('/profile_update_form' , async (req , res) =>{

  const { email,name, weight, height, bmi , gender } = req.body;

  try {
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          return res.status(404).json({ status: "user not existed" });
        }
        
        User.findByIdAndUpdate(user._id, {name, weight, height, bmi , gender }, { new: true })
          .then(updatedUser => {
            if (!updatedUser) {
              return res.status(404).json({ status: "user not found" });
            }
            return res.status(200).json({ status: true, message: `updated successfully ${email} ${name} ${weight} ${height} ${bmi}` });
          })
          .catch(err => {
            res.status(500).json({ status: "error", message: "error updating user" });
          });
      })
      .catch(err => {
        res.status(500).json({ status: "error", message: "error finding user" });
      });
  } catch (err) {
    res.status(500).json({ status: "Error", Message: "error while taking data for update yyy" });
  }
})


  //for showing the updates data on profile-------------------------------------------------------------------------------------------------
  app.get('/show_profile', async (req, res) => {
    // const { email } = req.body; //  passed as a query parameter
     const { email } = req.query;
    //  const email = "v.verma7271@gmail.com"
    if (!email) {
        return res.status(400).json({ Status: "error", message: `Email is required ${email} `});
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(404).json({ Status: "error", message: "User not found" });
            }
            return res.json({
                email: user.email,
                name: user.name,
                weight: user.weight,
                height: user.height,
                bmi: user.bmi,
                gender:user.gender,
                image : user.image,
                Status: "Printing success",
                message: `Printing success ${email}`
            });
        })
        .catch(err => {
            return res.status(500).json({ Status: "error", message: "Error while showing profile" });
        });
});


//for sending a text message --------------------------------------------------
//just i twilio and use it
const accountSid = 'AC0df2fb6b947ec62cf601b20762b7e652';
const authToken = '42c2cd4407ba83b1e40dae0d6a529cf7';
function sendSms(text , number){
        const client = twilio(accountSid , authToken)
        return client.messages
        .create({body :text , from : '+12513136345' , to:number})
         .then(message => console.log(message))
         .catch(err => console.log(err))
}

app.post('/send_message', async (req, res) => {
  const text = " your message sends hi I am vishal";
  const number = '+917803087585';
  try {
      await sendSms( text , number );
      res.status(200).json({
          message: "Message sent successfully"
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: "Error while sending message"
      });
  }
});


// for findind males and females number in database -------------------------------------------------
//  gender counts
app.get('/gender-counts', async (req, res) => {
  try {
    const totalEmails = await User.countDocuments({ email: { $ne: null } });
    const maleCount = await User.countDocuments({ gender: 'male' });
    const femaleCount = await User.countDocuments({ gender: 'female' });
    res.json({email:totalEmails, male: maleCount, female: femaleCount , message:"Fetched success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//for counting the total visitors in our website------------------------------------------------------
//for update the visitor in database:---
let visitCount = 0;
app.get('/visit', async (req, res) => {
  const email = "v.verma7271@gmail.com";
  visitCount++;
  console.log(`New visit! Total visits: ${visitCount}`);

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ status: "user not existed" });
    }
    user.visitors = (user.visitors || 0) + 1;  // Ensure visitors is initialized
    await user.save();

    return res.status(200).json({ totalVisitors: user.visitors  ,status: true, message: `Visitor updated successfully` });
  } catch (err) {
    console.error(err); 
    return res.status(500).json({ status: "error", message: "Error updating visitor" });
  }
});


// for getting/sending the total visitors from database
app.get('/visitor-count' , async (req,res) => {
  const email = "v.verma7271@gmail.com";
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ status: "user not existed" });
    }
    
    return res.status(200).json({ totalVisitors: user.visitors  ,status: true, message: `Visitor sent successfully` });
  } catch (err) {
    console.error(err); 
    return res.status(500).json({ status: "error", message: "Error while sending visitor" });
  }
} )


// set up cloudinaryy for images -------------------
cloudinary.config({
  cloud_name: 'dpxkuy4nn',
  api_key : '935536973299165',
  api_secret: 'HmRF4w9eNgsD_-YA42_k-lNmiCM'
});


//this is for Profile image upload -----------------------------------------------------------------------------
// for unorthorised upload to cloudinary so there we no need of secrets and all this only upload from frontend by api-----------
app.post('/profileImgUpload'  , async(req,res) => {

  const { imgUrl , emaill } = req.body; 
  // const email = 'v.verma7271@gmail.com'
  try {
    User.findOne({ email: emaill })
      .then(user => {
        if (!user) {
          return res.status(404).json({ status: "user not existed for image upload & it is not possible" });
        }
        
        User.findByIdAndUpdate(user._id, {image : imgUrl}, { new: true })
          .then(updatedUser => {
            if (!updatedUser) {
              return res.status(404).json({ status: "user not found for uplod img" });
            }
            return res.status(200).json({ status: true, message: `updated successfully  for uplod img` });
          })
          .catch(err => {
            res.status(500).json({ status: "error", message: "error updating  for uplod img" });
          });
      })
      .catch(err => {
        res.status(500).json({ status: "error", message: "error finding user for uplod img" });
      });
  } catch (err) {
    res.status(500).json({ status: "Error", Message: "error while taking data for uplod img" });
  }

})


//for sending email and id of user from backend---------------------------------------------
// app.get('/recieve_email' , async (req,res) =>{
//   const {email} = req.body
//   User.findOne({ email: email })
//   .then(user => {
//       if (!user) {
//           return res.status(404).json({ Status: "error", message: "User not found" });
//       }
//       return res.json({
//           id : user.id,
//           email: user.email,
//           Status: "Email comes",
//           message: `Printing email ${email} , ${user.id} `
//       });
//   })
//   .catch(err => {
//       return res.status(500).json({ Status: "error", message: "Error while fetching email" });
//   });
   
// })



//for graph data --------------------------------------------------------------------------------

app.post('/graph', async (req, res) => {
  const { email, graph_values } = req.body;
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ status: "user not existed" });
    }

    // Ensure graph_values is an array
    if (!Array.isArray(graph_values)) {
      return res.status(400).json({ status: "error", message: "graph_values should be an array" });
    }

    // Initialize graph_values array if it doesn't exist
    if (!user.graph_values) {
      user.graph_values = [];
    }

    // Check if there is an entry for today
    let todayEntry = user.graph_values.find(entry => entry.date === today);

    if (todayEntry) {
      // Append new values to today's entry
      todayEntry.values.push(...graph_values);
      console.log('Updated today\'s entry:', todayEntry);
    } else {
      // Add new entry for today with date and values
      user.graph_values.push({ date: today, values: graph_values });
      console.log('Added new entry for today:', { date: today, values: graph_values });
    }

    // Log the graph values before saving for debugging
    console.log('Graph values before saving:', user.graph_values);

    // Save the user with updated graph values
    await user.save();

    // Return the cumulative values of the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const last7DaysValues = user.graph_values
      .filter(entry => new Date(entry.date) >= oneWeekAgo)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ status: true, message: "Graph values updated successfully", data: last7DaysValues });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Error updating graph values" });
  }
});



// for payment integration------------------------------------------------------------------------------------------------------------------------------
// we used stripe
app.post('/payment', async (req, res) => {
  try {
    const product = await stripe.products.create({
      name: "Tishirt"
    });

    if (product) {
      // Set a fixed unit amount that is safely above the minimum required (e.g., 100 INR)
      const unitAmountInPaise = 10000; // 10000 paise = 100 INR

      var price = await stripe.prices.create({
        product: product.id,
        currency: 'inr',
        unit_amount: unitAmountInPaise, // Ensures it meets the minimum requirement
      });
    }

    if (price && price.id) {
      var session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        customer_email: 'demo@gmail.com'
      });

      return res.json(session);
    }

    res.status(400).json({ error: 'Price creation failed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});












// app.post('/graph', async (req, res) => {
//   // const { email, graph_values } = req.body;
//   const email = "v.verma7271@gmail.com";
// const graph_value1 = 100;
// const graph_value2 = 200;

// try {
//   const user = await User.findOne({ email: email });
//   if (!user) {
//     return res.status(404).json({ status: "user not existed" });
//   }
  
//   // First update operation for inserting graph_value1
//   await User.findOneAndUpdate(
//     { email: email },
//     { $push: { graph_values: graph_value1 } },
//     { new: true }
//   );

//   // Second update operation for inserting graph_value2
//   const updatedUser = await User.findOneAndUpdate(
//     { email: email },
//     { $push: { graph_values: graph_value2 } },
//     { new: true }
//   );

//   if (!updatedUser) {
//     return res.status(404).json({ status: "user not found" });
//   }

//   return res.status(200).json({ status: true, message: "Graph values updated successfully" });
// } catch (err) {
//   console.error(err);
//   return res.status(500).json({ status: "error", message: "Error updating graph values" });
// }

// });



// Schedule the job to clear graph data every minute--

// cron.schedule('* * * * *', async () => {
//   try {
//     console.log("Cron job started.");

//     // Calculate the date one minute ago
//     const oneMinuteAgo = new Date();
//     oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

//     console.log("Removing graph data older than one minute...");

//     // Remove documents where the entire graph_values array matches [graph_value1, graph_value2]
//     const result = await User.deleteOne(
//       { graph_values }
//     );

//     console.log(`${result.deletedCount} document(s) deleted.`);

//     console.log("Graph data older than one minute removed successfully");
//   } catch (error) {
//     console.error("Error removing graph data:", error);
//   }
// });






















































  
  // app.get('/show_profile' , (req, res) => {
  //   const {email} = req.body;
  //   try{
  //       User.findOne({email: email})
  //      .then(user => {
  //         if(!user){
  //           return res.send({Status : "user not existed"});
  //         }
  //          res.json({
  //           email: user.email,
  //           name: user.name,
  //           weight: user.weight,
  //           height: user.height,
  //           bmi: user.bmi
  //          })
  //          return res.send({Status : "Printing success" , message:" printing sucess" })
  //       })
  //      .catch(err => {
  //         res.json({Status : "error", message:" showing profile wala error"})
  //       })
  //   }
  //   catch(err){
  //     res.json({ status: "Error", Message:"Error while priting data"});
  //   }
  // })




  // const {email} = req.body;
  // const {weight , height, bmi} = req.body;
  
  // try{
  //   User.findOne({email: email})
  //   .than(user => {
  //      if(!user){
  //       return res.send({Status : "user not existed"});
  //      }
       
  //      user.findByIdAndUpdate({_id: user._id} ,{ weight:weight}, {height: height} ,{bmi: bmi})
  //      res.status(200).json({status:true , message:"updated successfully"});
  //   })
  //   .catch(err => {
  //      res.json({Status : "error", message:"user ke niche wala error"})
  //   })
 
  // }catch (err) {
  //     res.json({ Status: "Error", Message: "error while taking data for update" });
  // }

