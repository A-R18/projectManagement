import app from "./app.js"
import dotenv from "dotenv";
import connectMongoDB from "./config/dbConfig.js";
dotenv.config({
    path: "./.env"
});
const port = process.env.PORT || 8000;

connectMongoDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`server is listening on port http://localhost:${port}`);
        });

    })
    .catch((error) => {
        console.log(error);
    });
