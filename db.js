const mongoose = require("mongoose")
const creds = require("./cred.json") || {}
username = process.env.DBUSER || creds.user
host = process.env.DBHOST || creds.host
password = process.env.DBPASS || creds.pass
clientSecret = process.env.github || creds.github
mongoose.connect(`mongodb://${username}:${password}@${host}/csnotes`, {
  useNewUrlParser: true,
})
module.exports = {
  Post: mongoose.model("Post", {
    poster: String,
    date: Number,
    tags: Array,
    title: String,
    content: String,
    name: String
  }),
  User: mongoose.model("User", {
    username: String,
    gitHubToken: String,
    gitHubCode: String,
    localToken: String,
  }),
  mongoose,
  secret: {
      github: clientSecret
  }
}