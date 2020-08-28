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

// Get Theme
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

// Set Theme
app.post("/", async (req, res) => {
    const { theme } = req.body;
    if (typeof theme !== "string") return res.status(400).json({ err: "badRequest"});

    // Get user
    let id;
    try {
        id = (
            await axios.post(
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
            )
        ).data.user;
    } catch (err) {
        return res.status(401).json({ err: "badAuthorization" });
    }

    // Update user
    const u = await User.findOne({
        where: { id }
    });
    if (u) {
        await u.update({
            dark: theme === "dark"
        });
    } else {
        await User.create({
            id,
            dark: theme === "dark"
        });
    }

    // Response
    res.json({});
});

// 404
app.use((_req, res) => res.status(404).json({ err: "notFound" }));