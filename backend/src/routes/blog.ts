import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"
import { Hono } from "hono"
import { verify } from "hono/jwt"

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  },

  Variables: {
    userEmail : string
    userId : string
  }
}>()

blogRouter.use('/*', async (c , next) => {
  const header = c.req.header("authorization") || ""
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try {
    const user = await verify(header , c.env.JWT_SECRET)
    if(!user) {
      return c.json({
        msg: "Cant find user"
      })
    }
    c.set("userEmail" , user.email as string) //type assertion 
    
    const loggedIn_user_id = await prisma.user.findUnique({
      where: {
        email: user.email as string
      }
    })
    
    if(!loggedIn_user_id) {
      return c.json({
        msg: "User with this mail doesnt exists"
      })
    }
    
    c.set('userId' , loggedIn_user_id.id)
    await next()

  } catch (error) {
    console.log(error);
    c.json({
      msg: "User authentication failed",
      Error : error
    })
    
  }
})


blogRouter.post('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const body = await c.req.json()
  const userMailId = c.get('userEmail');


  try {
    const user = await prisma.user.findUnique({
      where : {
        email : userMailId
      }
    })

    if(!user) {
      return c.json({
        msg: "Cant create post , User with the given mail doesnt exists"
      })
    }

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: user.id 
      }
    })

    return c.json({
      msg : "Post created successfully",
      id : blog.id
    })
  } catch (error) {
    console.log(error);
    return c.json({
      Error: error
    })
  }
})


blogRouter.put('/update-blog/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const blogId = c.req.param("id")
  const body = await c.req.json()
  try {

      const blog = await prisma.blog.findUnique({
        where: {
          id: blogId
        },
        select: {
          authorId : true
        }
      })

      if(!blog) {
        return c.json({
          error: "The specified blog doesnt exists"
        })
      }
      let temp = c.get("userId")
      if(blog.authorId != temp) {
        return c.json({ msg: "Unauthorized" }, 403);
      }

      await prisma.blog.update({
      where: {
        id: blogId
      },

      data: {
        title: body.title,
        content: body.content,
      }
    })

    return c.json({
      msg: "Post updated successfully",
      BlogId: blogId
    })
  } catch (error) {
    console.log(error);
    c.json({
      Error: error
    })
  }
})


blogRouter.get('/view-blog/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const blogId = c.req.param("id")
  try {
    const blog = await prisma.blog.findUnique({
      where: {
        id: blogId
      }
    })

    return c.json({
      msg: "Post found",
      blog
    })
  } catch (error) {
    console.log(error);
    c.json({
      Error: error
    })
  }
})

blogRouter.get('/all-blogs', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  try {

    const allBlogs = await prisma.blog.findMany();

    return c.json({
      allBlogs
    })

  } catch (error) {
    console.log(error);
    return c.json({
      Error: error
    })
  }
})