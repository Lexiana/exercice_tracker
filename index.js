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
mongoose.connect(process.env.MONGO_URI);

// create mongoose schema

const userSchema = new mongoose.Schema({
  username: {
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
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  // check if username is empty
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    //check if username already exists
    let user = await User.findOne({ username: username });
    // if not create new user
    if (!user) {
      user = new User({ username: username });
      await user.save();
    }
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "Server error" });
  }
});

// add new exercise for user
app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  // validate input
  if (!description || !duration) {
    return res.status(400).json({ error: "Description and duration are required" });
  }

  // check if duration is a number
  const parsedDuration = parseInt(duration);
  if (isNaN(parsedDuration)) {
    return res.status(400).json({ error: "Duration must be a number" });
  }

  // check if date is a valid date
  let parsedDate;
  if (date) {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }
  } else {
    parsedDate = new Date();
  }

  try {
    // check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // create new exercise
    const exercise = new Exercise({
      username: user.username,
      description: description,
      duration: parsedDuration,
      date: parsedDate,
    });

    // save exercise
    await exercise.save();

    // return exercise
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }

})

// get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
  res.status(500).json({ error: "Server error" });
  }
});

// get all exercises for user
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  try {
    // find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // build query
    const query = { username: user.username };
    if (from) {
      query.date = { ...query.date, $gte: new Date(from) };
    }
    if (to) {
      query.date = { ...query.date, $lte: new Date(to) };
    }
    

    // execute query
    const exercises = await Exercise.find(query).limit( parseInt(limit) || 0 );

    // format response
    const log = exercises.map(exercise =>({
      
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      }));

    // return response
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: log
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
