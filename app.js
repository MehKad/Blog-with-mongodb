const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");

const User = require("./models/User");
const Article = require("./models/Article");

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

app.get("/", async (req, res) => {
  try {
    const articles = await Article.find();
    if (req.session.user) {
      res.render("welcome", { username: req.session.user.username, articles });
    } else {
      res.render("welcome", { articles });
    }
  } catch (err) {
    console.error(err);
    res.render("welcome", {
      error: "An error occurred while fetching articles",
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/addArticle", (req, res) => {
  res.render("addArticle", { username: req.session.user.username });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      req.session.user = user;
      res.redirect("/");
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

app.post("/addArticle", async (req, res) => {
  const { title, body } = req.body;
  const username = req.session.user.username;
  try {
    const newArticle = new Article({ title, body, username });
    await newArticle.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("addArticle", { error: "Error creating article" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/");
  });
});

app.get("/deleteArticle/:articleId", async (req, res) => {
  const articleId = req.params.articleId;
  try {
    const article = await Article.findById(articleId);
    if (article && article.username === req.session.user.username) {
      await Article.findByIdAndDelete(articleId);
    }
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("welcome", {
      error: "An error occurred while deleting the article",
    });
  }
});

app.get("/editArticle/:articleId", async (req, res) => {
  const articleId = req.params.articleId;
  try {
    const article = await Article.findById(articleId);
    if (article && article.username === req.session.user.username) {
      res.render("editArticle", { article });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.render("welcome", {
      error: "An error occurred while editing the article",
    });
  }
});

app.post("/updateArticle/:articleId", async (req, res) => {
  const articleId = req.params.articleId;
  const { title, body } = req.body;
  try {
    const article = await Article.findById(articleId);
    if (article && article.username === req.session.user.username) {
      article.title = title;
      article.body = body;
      await article.save();
    }
    res.redirect("/");
  } catch (err) {
    console.error(err);
    const article = await Article.findById(articleId);
    res.render("editArticle", {
      article,
      error: "An error occurred while updating the article",
    });
  }
});

mongoose
  .connect(
    "mongodb+srv://mehkadiri:mehkadiri@test.havg0ya.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connection to MongoDB successful");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB Atlas");
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
