const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");

const User = require("./models/User");

const app = express();
const PORT = 3000;

app.use(
  session({
    secret: "hello_world",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "pug");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      req.session.user = user;
      res.redirect("/welcome");
    } else {
      res.render("login", { error: "Invalid username or password" });
    }
  } catch (err) {
    console.error(err);
    res.render("login", { error: "An error occurred. Please try again." });
  }
});

app.post("/register", async (req, res) => {
  const { username, password, repassword } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.render("register", { error: "Username already exists" });
    } else {
      if (password === repassword) {
        const newUser = new User({ username, password });
        await newUser.save();
        res.redirect("/login");
      } else {
        res.render("register", { error: "Passwords do not match" });
      }
    }
  } catch (err) {
    console.error(err);
    res.render("register", { error: "An error occurred. Please try again." });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/login");
  });
});

app.get("/welcome", (req, res) => {
  if (req.session.user) {
    res.render("welcome", { username: req.session.user.username });
  } else {
    res.redirect("/login");
  }
});

mongoose
  .connect(
    "mongodb+srv://mehkadiri:mehkadiri@test.havg0ya.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connection success");
  })
  .catch((err) => {
    console.log("error mate, " + err);
  });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB Atlas");
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
