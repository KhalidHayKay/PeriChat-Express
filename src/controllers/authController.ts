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

  async register(req: Request, res: Response) {
    const name = req.body['name'];
    const email = req.body['email'];
    const password = req.body['password'];
    const password_confirmation = req.body['password_confirmation'];

    if (!name) {
      res.statusCode = 422;
      res.json({ message: 'name is required' });
      return;
    }

    res.json({ user_name: name });
  },
};

export default authController;
