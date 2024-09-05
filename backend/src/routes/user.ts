import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from "hono/jwt";

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET: string
    }
  }>()

  userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const body = await c.req.json();
  
    try {
  
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password
        }
      })
  
      const token = await sign({ email: user.email }, c.env.JWT_SECRET)
      return c.json({
        token: token,
        msg: "User Created"
      })
  
    } catch (error) {
      console.log(error)
      return c.json({
        Error: error
      })
    }
  })
  
  userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const body = await c.req.json();
  
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: body.email,
          password: body.password
        }
      });
  
      if (!user) {
        c.status(403)
        return c.json({
          error: "User doesnt exists"
        })
      }
      const token = await sign({ email: user.email }, c.env.JWT_SECRET);
      return c.json({
        token: token
      })
      
    } catch (error) {
      c.status(403)
      console.log(error);
      return c.json({
        error: "Authentication Failed"
      })
    }
  
  })
