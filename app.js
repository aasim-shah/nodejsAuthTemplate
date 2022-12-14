const express = require('express')
const app = express()
var bodyParser = require('body-parser')
const mongoose = require('mongoose')
const  userModel = require('./models/userModel')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const passportLocal = require('passport-local').Strategy
const session = require('express-session')
const port = process.env.PORT || 5000;
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + "-" +  file.originalname )
  }
})

const upload = multer({ storage: storage })



mongoose.connect("mongodb://localhost:27017/testing").then(res=>console.log('db connected')).catch(err => console.log(err))




const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/login")
}



//midlewares 
// parse application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set("view engine" , "ejs")



app.use(session({
  secret : "mySuperSecret",
  resave: true,
  saveUninitialized : false,
}))
app.use(flash())


app.use(passport.initialize())
app.use(passport.session())




passport.use(new passportLocal({usernameField : "email"},
  function(username, password, done) {
    userModel.findOne({ email : username }, async function   (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false , "No user Found !"); }
      if (! await bcrypt.compare(password ,user.password)) { return done(null, false , "Wrong credentials !"); }
      return done(null, user);
    });
  }
));

passport.serializeUser( (user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async(userId, done) => {
  const userObj = await userModel.findById(userId)
  done(null, userObj)
})


app.get("/"  ,  async(req ,res) =>{

res.render('homepage' ,{user : req.user})
})



app.get("/login"  ,  async(req ,res) =>{
 res.render('login')
})

app.get("/register"  ,  async(req ,res) =>{
  res.render('signup')
 })
 



app.post("/register" , upload.single('image'), async(req ,res) =>{
  const {firstName , lastName , email , password} = req.body
  const hashPassword = await bcrypt.hash(password , 10)
  const data  = new userModel({
    firstName ,
    lastName ,
    email ,
    profilePic : req.file?.filename,
    password : hashPassword
  })

  if(firstName === "" || lastName === "" || email === "" ){
    req.flash('error' , "Fill All Fields Properly !")
    return res.redirect('/register')
  }
  try {
    const findUser = await userModel.findOne({email : email})
    if(findUser){
      req.flash('error'  , 'user alraedy')
     res.redirect('/register')
    }
    const newUser =  await data.save()
    res.redirect("/login")
  } catch (error) {
    console.log(error)
    res.send({error})
  }

})


app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' , failureFlash : true}),
  function(req, res) {
    req.flash('info', 'Flash Message Added');
    res.redirect('/');
  });

app.listen(port , ()=>{
    console.log(`server is running on port ${port} , http://localhost:${port}`)
})
