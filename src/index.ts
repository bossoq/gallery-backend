import { app } from './apiServer'

const host = process.env.HOST ?? '127.0.0.1'
const port = parseInt(process.env.PORT ?? '1080')

app.listen(port, host, () => {
  console.log(`Server listening at http://${host}:${port}`)
})
