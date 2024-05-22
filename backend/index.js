import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const port = 8000;
const jwtSecret = "supersecretkey";
let counter = 0;

const middlewareLogger = (req, res, next) => {
    console.log("\x1b[32m", `[${req.method}]: ${req.hostname}${req.path}`, "\x1b[0m");
    next();
}

const authMiddelware = (req, res, next) => {
    const bearerToken = req.header("Authorization");
    if (!bearerToken) {
        res.status(401).json({
            message: "token di perlukan",
        });
        return;
    }

    const jwtToken = bearerToken.split(" ");
    if (jwtToken.length !== 2) {
        res.status(401).json({
            message: "Bearer token tidak valid",
        });
        return;
    }

    try {
        const payload = jwt.verify(jwtToken[1], jwtSecret);

        req.user = payload;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                message: `token expired`,
            });
        } else if (error.name == "JsonWebTokenError") {
            res.status(401).json({
                message: `token tidak valid`,
            });
        }
    }
}

const app = express();

app.use(cors());
app.use(middlewareLogger);
app.use(express.json());

const fakeUserData = [
    {
        username: "budi",
        password: "coba",
    },
    {
        username: "joko",
        password: "coba",
    },
];

app.get("/api/user/me", [authMiddelware,], (req, res, next) => {
    res.status(200).json({
        message: `Halo ${req.user.username}`,
    })
});

app.post("/api/auth/login", (req, res, next) => {

    const { username, password } = req.body;

    let userFound = false;
    fakeUserData.forEach((user) => {
        if (user.username === username && user.password === password) {
            userFound = true;
        }
    });

    if (!userFound) {
        res.status(401).json({
            message: "data user tidak di temukan",
        });
        return;
    }

    const payload = {
        username: username,
    };

    const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: '5s',
    });
    const refreshToken = jwt.sign(payload, jwtSecret, {
        expiresIn: '10s',
    });

    res.status(200).json({
        message: "halo anda berhasil login",
        username,
        accessToken,
        refreshToken,
    });
});


app.post("/api/auth/refresh", (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401).json({
            message: "memerlukan refreshToken",
        });
        return;
    }

    try {
        const payload = jwt.verify(refreshToken, jwtSecret);
        const newPayload = {
            username: payload.username,
        };

        const accessToken = jwt.sign(newPayload, jwtSecret, {
            expiresIn: '1m',
        });

        res.status(200).json({
            message: `ok`,
            accessToken,
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                message: `refreshToken expired`,
            });
            return;
        } else if (error.name == "JsonWebTokenError") {
            res.status(401).json({
                message: `refrehToken tidak valid`,
            });
            return;
        }

        res.status(501).json({
            message: `gagal`,
        });
    }
});

app.get("/api/counter", [authMiddelware], (req, res, next) => {
    res.status(200).json({
        counter: counter++,
    })
});


app.listen(port, () => {
    console.log(`server running at http://127.0.0.1:${port}`);
});
