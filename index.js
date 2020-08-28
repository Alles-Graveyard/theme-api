require("dotenv").config();
const axios = require("axios");
const User = require("./db");

// Express
const express = require("express");
const app = express();
app.use(require("cors")());
app.use(require("body-parser").json());
app.use((_err, _req, res, _next) => res.status(500).json({ err: "internalError" }));
app.listen(8080, () => console.log("Express is listening"));

// Auth
const auth = (req, res, next) => {
    axios.post(
        `${process.env.NEXUS_URI}/sessions/token`,
        {
            token: req.headers.authorization
        },
        {
            auth: {
                username: process.env.NEXUS_ID,
                password: process.env.NEXUS_SECRET
            }
        }
    ).then(({ data }) => {
        req.user = data.user;
        next();
    }).catch(() => next());
};

// Get Theme with user id
app.get("/:id", async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.params.id
        }
    });
    res.json({
        theme: user && user.dark ? "dark" : "light"
    });
});

// Get Theme with session token
app.get("/", auth, async (req, res) => {
    const user = await User.findOne({
        where: {
            id: req.user
        }
    });
    res.json({
        theme: user && user.dark ? "dark" : "light"
    });
});

// Set Theme
app.post("/", auth, async (req, res) => {
    const { theme } = req.body;
    if (typeof theme !== "string") return res.status(400).json({ err: "badRequest"});

    // Update user
    const u = await User.findOne({
        where: {
            id: req.user
        }
    });
    if (u) {
        await u.update({
            dark: theme === "dark"
        });
    } else {
        await User.create({
            id: req.user,
            dark: theme === "dark"
        });
    }

    // Response
    res.json({});
});

// 404
app.use((_req, res) => res.status(404).json({ err: "notFound" }));