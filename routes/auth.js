const router = require("express").Router();
const User = require("../model/Admin");
const passport = require("passport");
const bcrypt = require("bcryptjs");

router.get("/signin", (req,res) => {
    try{
        return res.render("signin", {pageTitle: "Login"});
    }catch(err){
        return res.redirect("/");
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/signin');
});


router.get('/signout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/signin');
});


router.get("/signup", (req,res) => {
    try{
        return res.render("signup", {pageTitle: "Signup"});
    }catch(err){
        return res.redirect("/");
    }
});


router.post('/signup', async (req,res) => {
    try{
        const {username, password, password2} = req.body;
        const user = await User.findOne({username});;
        if(user){
            return res.render("signup", {...req.body,error_msg:"A User with that email or username already exists", pageTitle: "Signup"});
        } else{
            if(!username || !password || !password2){
                return res.render("signup", {...req.body,error_msg:"Please fill all fields", pageTitle: "Signup"});
            }else{
                if(password !== password2){
                    return res.render("signup", {...req.body,error_msg:"Both passwords are not thesame", pageTitle: "Signup"});
                }
                if(password2.length < 6 ){
                    return res.render("signup", {...req.body,error_msg:"Password length should be min of 6 chars", pageTitle: "Signup"});
                }
                
                const newUser = {
                    username,
                    password
                };
                const salt = await bcrypt.genSalt();
                const hash = await bcrypt.hash(password2, salt);
                newUser.password = hash;
                const _newUser = new User(newUser);
                await _newUser.save();
                req.flash("success_msg", "Register success, you can now login");
                return res.redirect("/signin");
            }
        }
    }catch(err){
        console.log(err)
    }
})



module.exports = router;