import express from "express";

var app = express();

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get("/", (request, response) => {
    response.json(request.query);
});
