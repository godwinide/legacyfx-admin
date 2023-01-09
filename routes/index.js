const router = require("express").Router();
const User = require("../model/User");
const Admin = require("../model/Admin");
const History = require("../model/History");
const { ensureAuthenticated } = require("../config/auth");
const bcrypt = require("bcryptjs");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const customers = await User.find({});
        const history = await History.find({});
        const total_bal = customers.reduce((prev, cur) => prev + Number(cur.balance), 0);
        return res.render("index", { pageTitle: "Welcome", customers, history, total_bal, req });
    }
    catch (err) {
        return res.redirect("/");
    }
});

router.get("/edit-user/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await User.findOne({ _id: id });
        return res.render("editUser", { pageTitle: "Welcome", customer, req });
    }
    catch (err) {
        return res.redirect("/");
    }
});

router.post("/edit-user/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { balance, investment_plans, debt, verify_status } = req.body;
        const customer = await User.findOne({ _id: id })
        if (!balance || !debt || !investment_plans || !verify_status) {
            req.flash("error_msg", "Please fill all fields");
            return res.render("editUser", { pageTitle: "Welcome", customer, req });
        }
        await User.updateOne({ _id: id }, {
            balance,
            debt,
            investment_plans,
            verify_status
        });
        req.flash("success_msg", "account updated");
        return res.redirect("/edit-user/" + id);
    }
    catch (err) {
        console.log(err);
        return res.redirect("/");
    }
});

router.get("/delete-account/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.redirect("/");
        }
        await User.deleteOne({ _id: id });
        return res.redirect("/");
    } catch (err) {
        return res.redirect("/")
    }
});

router.get("/pending_deposit", ensureAuthenticated, async (req, res) => {
    try {
        const history = await History.find({ type: "deposit", status: "pending" });
        return res.render("pendingDeposit", { pageTitle: "Pending Deposit", history, req });
    } catch (err) {
        return res.redirect("/")
    }
});

router.get("/pending_withdrawal", ensureAuthenticated, async (req, res) => {
    try {
        const history = await History.find({ type: "withdraw", status: "pending" });
        return res.render("pendingWithdrawal", { pageTitle: "Pending Withdrawal", history, req });
    } catch (err) {
        return res.redirect("/")
    }
});

router.get("/approve-deposit/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const history = await History.findById(id);
        if (!history) {
            return res.redirect("/pending_deposit");
        } else {
            await History.updateOne({ _id: id }, { status: "approved" });
        }
        return res.redirect("/pending_deposit");
    } catch (err) {
        return res.redirect("/")
    }
});

router.get("/deposit", ensureAuthenticated, async (req, res) => {
    try {
        const customers = await User.find({});
        return res.render("deposit", { pageTitle: "Deposit", customers, req });
    } catch (err) {
        return res.redirect("/")
    }
});

router.post("/deposit", ensureAuthenticated, async (req, res) => {
    try {
        const { amount, userID, debt } = req.body;
        if (!amount || !userID || !debt) {
            req.flash("error_msg", "Please provide all fields");
            return res.redirect("/deposit");
        }
        const customer = await User.findOne({ _id: userID });
        const newHistData = {
            type: "Credit",
            userID,
            amount,
            account: customer.email
        }
        const newHist = new History(newHistData);
        await newHist.save();

        await User.updateOne({ _id: userID }, {
            balance: Number(customer.balance) + Number(amount),
            active_deposit: amount,
            debt,
            total_deposit: Number(customer.total_deposit) + Number(amount)
        });

        req.flash("success_msg", "Deposit successful");
        return res.redirect("/deposit");

    } catch (err) {
        console.log(err);
        return res.redirect("/");
    }
});


router.get("/change-password", ensureAuthenticated, async (req, res) => {
    try {
        return res.render("changePassword", { pageTitle: "Change Password", req });
    } catch (err) {
        console.log(err);
        return res.redirect("/");
    }
})

router.post("/change-password", ensureAuthenticated, async (req, res) => {
    try {
        const { password, password2 } = req.body;
        console.log(req.body);
        if (!password || !password2) {
            req.flash("error_msg", "Please provide fill all fields");
            return res.redirect("/change-password");
        }
        else if (password !== password2) {
            req.flash("error_msg", "Both passwords must be same");
            return res.redirect("/change-password");
        }
        else if (password.length < 6) {
            req.flash("error_msg", "Password too short")
            return res.redirect("/change-password");
        } else {
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash(password2, salt);
            await Admin.updateOne({ _id: req.user.id }, {
                password: hash
            });
            req.flash("success_msg", "password updated successfully");
            return res.redirect("/change-password");
        }
    } catch (err) {
        console.log(err);
        return res.redirect("/");
    }
});

module.exports = router;