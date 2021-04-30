import app from "../api/app";

const port = 9080;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
