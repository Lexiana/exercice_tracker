const express = require("express");
const app = express();
const cors = require("cors");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { type } = require("express/lib/response");
const req = require("express/lib/request");

require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));

// connect database
mongoose.conect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// create mongoose schema

const userSchema = new mongoose.Schema({
  usernamer: {
    type: String,
    required: true,
  },
});

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: { type: String, required: true },
  duration: Number,
  date: Date,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});


// create new user
app.post('/api/users', async(req, res)=>{
  const username = req.body.username;
  try{
    //check if username already exists
    let user = await User.findOne({username: username});
    // if not creat new user
    if(!user){
      user = new User({username: username});
      await user.save();
    }
    res.json({username: user.username, _id: user._id});
  } catch(err){
    res.json({error: err.message})
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
