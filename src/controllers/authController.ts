import type { Request, Response } from 'express';

const authController = {
  async login(req: Request, res: Response) {
    console.log(req.body);

    const name = req.body['name'];

    if (!name) {
      res.statusCode = 422;
      res.json({ message: 'name is required' });
      return;
    }

    res.json({ user_name: name });
  },
};

export default authController;
