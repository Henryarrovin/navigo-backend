import type { Request, Response } from 'express';

export const hello = async (req: Request, res: Response) => {
    res.send("Hello!");
}