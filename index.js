const express = require("express")
const db = require("./db.js")
const bodyParser = require("body-parser")

const PORT = process.env.PORT || 3021

const log = require("node-pretty-log")

const github = require("octonode")

const app = express()

app.use(bodyParser())

app.use(async function(req, res, next) {
  req.auth = false
  if (req.body && req.body.token) {
    let resu = await db.User.findOne({
      localToken: req.body.token,
    })
    if (!resu) {
      return next()
    }
    req.auth = true
    req.user = resu
  } else return next()
})

app.get("/", (req, res) => res.json({ success: false }))

app.get("/posts", async (req, res) => {
  let limit = 15
  let search = req.query.search || ""
  let name = req.query.name || ""
  let resu = await db.Post.find({
    title: new RegExp(search, "i"),
    name: new RegExp(name, "i"),
  })
  return res.json({
    success: true,
    res: resu,
  })
})

app.post("/post", async (req, res) => {
  if (!req.auth) {
    return res.json({
      success: false,
      res: "Not Authorized",
    })
  }

  const { username } = req.user

  const {
    date = Date.now,
    poster = username,
    tags = [],
    title,
    content,
  } = req.body

  const name =
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15)

  const post = new db.Post({
    date,
    poster,
    tags,
    title,
    content,
    name,
  })

  await post.save()
  res.redirect(`https://csnotes.app/article/${poster}/${name}`)
})

app.post("/auth", async (req, res) => {
  try {
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=Iv1.80e31fbb31433ef9&state=${req.body.token}`
    )
  } catch (e) {}
})

let states = {}

app.get("/auth/token/:token", async (req, res) => {
    try {
      res.redirect(
        `https://github.com/login/oauth/authorize?client_id=Iv1.80e31fbb31433ef9&state=${req.params.token || req.query.token}`
      )
    } catch (e) {}
  })

app.get("/auth/success", async (req, res) => {
    const github = require("octonode")
    
  try {
    const { code, state } = req.query
    // const token = state
    github.auth.config({
        id: 'Iv1.80e31fbb31433ef9',
        secret: db.secret.github
    })
    .login(code, function (err, token, headers) {
        // get the username
        const client = github.client(token)
        client.get('/user', {}, async function (err, status, body, headers) {
            
            const username = body.login
            db.User.deleteMany({ username } )
            const us2 = new db.User({
                username,
                gitHubToken: token,
                gitHubCode: code,
                localToken: state
            })
            await us2.save()
            res.redirect(req.query.redir || 'https://csnotes.app/post')
          });

      });
    // return res.send('')
  } catch (e) {console.log(e); res.json({e})}
})

app.get('/login')

// general catch-all case, for if the route does not exist.
app.all("*", (req, res) => res.json({ success: false }))

app.listen(PORT, () => log("success", `HTTP server listening.`, { port: PORT }))
