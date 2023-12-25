import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

mongoose
    .connect("mongodb://127.0.0.1:27017",
        {
            dbName: 'backend'
        }
    ).then(() => console.log("Database connected !!!")
    ).catch((err) => console.log("Error :", err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "sdfhsdhfkjsdhfkj");
        req.user = await User.findById(decoded._id);
        next();
    } else {
        res.render("login");
    }
};

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.redirect("/register");
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        return res.render("login", { email, message: "Incorrect Password." })
    }
    const token = jwt.sign({ _id: user._id }, "sdfhsdhfkjsdhfkj");
    res.cookie("token", token, "iamin", {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");

});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.redirect("/login");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name, email, password: hashedPassword
    });
    const token = jwt.sign({ _id: user._id }, "sdfhsdhfkjsdhfkj");
    res.cookie("token", token, "iamin", {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });
    res.redirect("/");
});

app.listen(5000, () => {
    console.log("Server is working");
});