const express = require('express')
const csurf = require('csurf')

const router = express.Router()

// ルーティングのログ出力など共通処理
router.all('/*', (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// CSRF 対策のミドルウェア設定
router.use(
  csurf({
    cookie: false,
  })
)

// csrfToken を格納
router.use((req, res, next) => {
  // CSRF 対策トークンを入れる
  const locals = res.locals
  locals.csrfToken = req.csrfToken()
  return next()
})

// ～～～ ↓ 認証チェックが不要なルーティング設定 ↓ ～～～
// csrfToken 単体で取得
router.get('/csrf-token', (req, res) => {
  res.json({ token: res.locals.csrfToken })
})

// 静的ファイルのルーティング
router.use(express.static('public'))

// ログイン
router.use('/login', (req, res, next) => {
  // ログインページを返す
  res.render('login')
})

// ログアウト
router.get('/logout', (req, res, next) => {
  // 未ログインの場合は何もせずに /login へリダイレクト
  if (!req.session.user) {
    res.redirect('/login')
    return
  }
  req.session.destroy((err) => {
    if (err) {
      next(err)
      return
    }
    res.redirect('/login)')
  })
})

// ログインページに飛ばすURLの正規表現
// ログイン後のページではルーティングせずに、ログインページだけでルーティングするURLがあればここに追加する
// /login/* 以下と、/logout はログインページでルーティングする
const urlsRoutedLoginPage = /^\/(login(\/.*)?|logout)$/

// ログイン前にアクセス可能なAPI
// パスワードリセットAPIへのアクセスなど、login前でも使用するAPIがあればここに追加する
const apisAccessibleWithoutLogin = /^\/api\/login$/

// ログイン画面
router.get(urlsRoutedLoginPage, (req, res) => {
  res.render('login')
})

// ～～～ ↑ 認証チェックが不要なルーティング設定 ↑ ～～～

// 認証チェック
router.use((req, res, next) => {
  if (apisAccessibleWithoutLogin.test(req.url)) {
    // ログイン不要でアクセスできるAPIへのアクセスは認証チェックしない
    next()
    return
  }
  // ログイン済みかどうかチェック
  const { session } = req
  const authenticated = session && session.authenticated
  if (authenticated) {
    // ログイン済みならOK
    next()
    return
  }
  // ～～～ 以下未ログインの場合の処理 ～～～
  // GET以外のアクセス及びAPIアクセスの禁止
  if (req.method !== 'GET' || /\/api\/.*/.test(req.url)) {
    // 401 を返して終了
    // ui/index.js　のエラーハンドリングで処理される
    next({ status: 401 })
    return
  }
  // APIアクセスでないGETアクセスは、全てログインページを返す
  res.redirect('/login')
})

// ～～～ 認証チェックが必要なルーティング設定 ～～～

// 静的ファイルのルーティング
router.use(express.static('public_authenticated'))

// API のルーティング
router.use('/api', require('./api'))

// ログイン後のページルーティング
router.get('/*', (req, res) => {
  res.header('Content-type', 'text/html')
  res.render('app')
})

module.exports = router
