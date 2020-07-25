import express from "express";
import Boards from "./boards/boards.js";
import { validate_request } from "./validator.js";

let app = express();
let boards = new Boards();

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get("/", async (request, response) => {

    const validationResult = validate_request(request.query);

    if (!validationResult.valid) {
        response.status(400).json({ error: validationResult.description });
    }

    const result = await boards.generateResponse(validationResult.requestInfo);
    response.status(result.status).json(result.body);
});
