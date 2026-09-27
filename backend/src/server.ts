import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/hello-world', (req, res) => {
    res.status(200).json({ status: 200, data: { message: "Hello world" } })
})

app.listen('3000', () => {
    console.log("Server listening on port 3000")
})