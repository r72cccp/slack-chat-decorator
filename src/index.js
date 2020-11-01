const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), './config/.env') })

const { app } = require('./services/express-server')
const { installer } = require('./services/slack-oauth-install-provider')
const { ChatDecorator } = require('./lib/chat-decorator')
const { ChatUpdater } = require('./lib/chat-updater')

const chatDecorator = new ChatDecorator({
  '\\b(ASMS\\-\\d+)\\b': '[$1](https://jira.funbox.ru/browse/$1)',
})
const chatUpdater = new ChatUpdater({ token: process.env.API_TOKEN })

app.post('/message.event', (request, response) => {
  const { challenge, event: { channel, edited, ts, text, user } = {} } = request.body
  console.log('#16', { challenge, channel, ts, text, user, edited, request_body: request.body })
  if (edited || !text) {
    response.send({ challenge, flag: 'ignored' })
    return
  }

  const textDecorated = chatDecorator.decorate(text)
  chatUpdater.run({ channel, text: textDecorated, ts, user })
  response.send({ challenge, flag: 'updated' })
})

// app.get('/oauth.install', async (request, response, next) => {
//   const url = await installer.generateInstallUrl({
//     scopes: ['chat:write']
//   })
//   console.log('get/oauth.install#32', { url })

//   response.redirect(url)
// })

app.get('/oauth.redirect', async (request, response) => {
  const url = await installer.generateInstallUrl({
    scopes: ['chat:write']
  })
  console.log('get/oauth.redirect#40', { url })
  await installer.handleCallback(request, response)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`App listen on port ${PORT}`)
})
