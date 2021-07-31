const http = require('http')
const express = require('express')
const expressSession = require('express-session')
const bodyParser = require('body-parser')

const app = express()

// X-Powered-By ヘッダの無効化
app.disable('x-powered-by')

// サーバーの起動
const server = http.Server(app)
// 通常、環境変数でポートを設定などする（今回は省略して、固定値）
const port = 3000
server.listen(port)

// セッションの設定
const sessionStore = new expressSession.MemoryStore()

// cookie, session の設定
const session = expressSession({
  store: sessionStore,
  secret: 'catIsKawaii',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: false,
  cookie: {
    secure: false,
    httpOnly: true,
    rolling: true,
    maxAge: 3600000,
  },
})

app.use(session)

// テンプレートエンジンの設定（ejs を使う）
app.set('views', 'views/pages')
app.set('view engine', 'ejs')

// bodyParser の設定
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '10mb',
  })
)

// ルーティング
app.use('/', require('./router'))

// ルーティングマッチエラー
app.use((req, res) => {
  res.status(404)
  res.render('error', {
    param: {
      status: 404,
      url: req.url,
      message: 'not found',
    },
  })
})

// エラーハンドリング
app.use((err, req, res, next) => {
  if (err.code == 'EBADCSRFTOKEN') {
    // CSRFToken のエラー
    res.status(403)
    res.json(err)
    return
  }
  if (req.method !== 'GET' || /\/api\/.*/.test(req.url)) {
    // GET 以外のエラー、または、'/api/*' へのアクセスならエラーオブジェクトを返す
    res.status(500 || err.status)
    res.json(err)
    return
  }
  res.render('error')
})

module.exports = app
