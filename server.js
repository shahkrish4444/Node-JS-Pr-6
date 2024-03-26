    const express = require('express')
    const app = express()
    const fs = require('fs')

    // Mongoose
    const mongoose = require("mongoose")
    mongoose.connect('mongodb://127.0.0.1:27017/BlogKrish')

    // Body Parser
    const bodyParser = require('body-parser')
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())

    // View
    app.set('view engine', 'ejs')

    // Public
    app.use(express.static('Public'))

    // Cookie-Parser
    const cookieParser = require('cookie-parser')
    app.use(cookieParser())

    // Protetected Route
    const auth = (req, res, next) => {
        if (!req.cookies.user) {
            res.redirect('/login')
        } else {
            next()
        }
    }

    // Multer
    const multer = require('multer')
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            return cb(null, './upload')
        },
        filename: (req, file, cb) => {
            return cb(null, Date.now() + file.originalname)
        }
    })

    var upload = multer({ storage: storage }).single('blogImage')
    app.use(express.static('upload'))


    const { userModel } = require('./UserSchema.js')
    const { blogModel } = require('./BlogSchema.js')

    // Router
    app.get('/', function (req, res) {
        if (req.cookies.user) {
            return res.redirect("/blog")
        }
        res.render('Pages/SignUp')
    })
    app.post("/", async function (req, res) {
        const blogData = await userModel(req.body)
        const result = await blogData.save()
        if (result) {
            res.redirect('/login')
        }
    })
    app.get('/login', function (req, res) {
        if (req.cookies.user) {
            return res.redirect('/blog')
        }
        res.render('Pages/Login')
    })
    app.post('/login', async function (req, res) {
        const { username, email, password } = req.body
        const user = await userModel.findOne({ email: email })
        if (user) {
            if (user.password === password) {
                let minute = 60 * 10000
                res.cookie('user', user, { maxAge: minute })
                res.redirect('/blog')
            } else {
                res.send('<h3>Password is incorrect!</h3><a href="/login">Back to login page</a>')
            }
        } else {
            res.send('<h3>User not found!</h3><a href="/login">Back to login page</a>')
        }
    })
    app.post('/add', async function (req, res) {
        upload(req, res, async function () {
            if (req.file) {
                var details = {
                    title: req.body.title,
                    blogImage: req.file.filename,
                    description: req.body.description
                }
                const blog = await blogModel(details)
                const result = await blog.save()
                res.redirect("/blog");
            } else {
                console.log('Error')
            }
        })
    })
    app.get('/blog', auth, async function (req, res) {
        const blog = await blogModel.find({})
        const username = req.cookies.user.username
        res.render('Pages/Blog', { blog: blog, username: username })
    })
    app.get('/addblog', auth, function (req, res) {
        res.render('Pages/AddBlog')
    })
    app.get('/logout', auth, (req, res) => {
        if (req.cookies.user) {
            res.clearCookie('user')
            res.redirect('/login')
        }
    })
    app.listen('8000', () => console.log("Server is running on port 8000"))