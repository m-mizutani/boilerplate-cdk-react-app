import * as express from "express";

const app = express();

app.get("/api/v1/message", (req: express.Request, res: express.Response) => {
  res.send({ message: "Hello, Hello, Hello" });
});
app.use(express.static("assets"));

export default app;
