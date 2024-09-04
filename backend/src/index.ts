
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt';
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>()

app.use('/api/v1/blog/*', async (c , next) => {
  const header = c.req.header("authorization") || ""; // this is fallback , which means if authorization header doesnt exists then set the header to be an empty string , by this we header will always be a string and never null even if there is no authorization header
  const response = await verify(header, c.env.JWT_SECRET);

  if (response.email) {
    next()
  }

  else {
    c.status(403)
    return c.json({
      error: "Authentication Failed"
    })
  }
})

app.route('/api/v1/user' , userRouter)
app.route('/api/v1/blog' , blogRouter)

app.get('/', (c) => {
  return c.text('Hello Hono! This is / route');
})

app.post('/api/v1/blog', (c) => {
  return c.text('This is blog');
})

app.put('/api/v1/blog', (c) => {
  return c.text('This is blog');
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('This is blog');
})

export default app