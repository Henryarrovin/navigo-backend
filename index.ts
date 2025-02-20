import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const port = 8080;

app.get('/hello', (req: Request, res: Response) => {
  res.send("hello!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
