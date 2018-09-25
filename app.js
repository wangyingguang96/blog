const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser')
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('static'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))

const diskStorage = multer.diskStorage({
    filename: function (req, file, callback) {
        var username = req.cookies.username;
        console.log(username);
        var stye = file.originalname.split('.')[1]
        callback(null, `${username}.${stye}`)

    },
    destination: function (req, file, callback) {
        callback(null, 'static/uploads')
    }
})
const upload = multer({ storage: diskStorage })

/*
 * 注册
 */
app.post('/user/register', upload.single('avatar'), (req, res) => {
    console.log(req.body, req.file);
    var type = req.file.originalname.split('.')[1];

    var data = {
        username: req.body.username,
        psw: req.body.psw[0],
        email: req.body.email,
        sex: req.body.sex,
        registerDate: new Date().getTime(),
        avatar: `uploads/${req.body.username}.${type}`
    }
    fs.exists(`users/${req.body.username}.txt`, (inExis) => {
        if (inExis) {
            res.json({ result: 0, msg: '用户名已经存在!!!!' })
        }
        else {
            fs.appendFile(`users/${req.body.username}.txt`, JSON.stringify(data), (err) => {
                if (err) {
                    res.json({ result: 0, msg: "注册失败" })
                }
                else {
                    res.json({ result: 1, msg: "注册成功" })
                }
            })
        }
    })
})

/*
  登陆 
 */
app.post('/user/login', (req, res) => {
    fs.exists(`users/${req.body.username}.txt`, (inExis) => {
        if (inExis) {

            var date = fs.readFileSync(`users/${req.body.username}.txt`);
            date = JSON.parse(date);
            if (req.body.psw === date.psw) {
                res.json({ result: 1, msg: '登陆成功' })
            }
            else {
                res.json({ result: 0, msg: '密码错误' })
            }
        }
        else {
            res.json({ result: 0, msg: "该用户还未注册" })
        }
    })
})

/*
    退出
*/
app.get('/user/logout', (req, res) => {
    if (req.cookies.username) {
        res.clearCookie('username');
    }
    res.json({ result: 1, msg: '退出成功' })
})

/*
    提问 
*/
app.post('/user/ask', (req, res) => {
    var da = fs.readFileSync(`users/${req.cookies.username}.txt`);
    if (da) {
        da = JSON.parse(da);
    }
    else {
        res.json({ result: 0, msg: '读取失败' })
        return;
    }
    var date = new Date().getTime();
    var data = {
        username: req.cookies.username,
        userAvatar: da.avatar,
        publishDate: date,
        ip: req.ip,
        content: req.body.question,
        reply: []
    }
    fs.appendFile(`static/allQuestions/${date}.txt`, JSON.stringify(data), (err) => {
        if (err) {
            res.json({ result: 0, msg: '提问失败' })
        }
        else {
            res.json({ result: 1, msg: '提问成功' })
        }
    })

})

/*
    获取所有问题
*/
app.get('/getAllQuestions', (req, res) => {
    fs.readdir('static/allQuestions/', (err, files) => {
        // console.log('ffffffffffffffffffffff')
        if (err) {
            res.json({ result: 0, msg: "获取信息失败" })
        }
        else {
            var arr = [];
            var ccc = 0;
            for (var i = 0; i < files.length; i++) {
                var index = i;
                var file = files[i];
                fs.readFile(`static/allQuestions/${file}`, (err, date) => {
                    if (err) {
                        // console.log('???????????????')
                        res.json({ result: 0, msg: "获取失败" });
                        files = [];
                    }
                    else {
                        // console.log('+++++++++++++++++++++++++')
                        ccc++;
                        date = JSON.parse(date);
                        arr.push(date);
                        arr.sort(function (x, y) {
                            if (x.askData < y.askData) {
                                return 1;
                            }
                        })
                        if (files.length == ccc) {
                            res.json({ result: 1, msg: '获取成功', data: { contents: arr } })
                        }
                    }
                })
            }
        }
    })
})

/*
    回复
 */
app.post('/reply', (req, res) => {
    console.log("111111111111111111111111111111")
    if (fs.readFileSync(`users/${req.cookies.username}.txt`)) {
        console.log("2222222222222222222222222222222")
        var date = JSON.parse(fs.readFileSync(`users/${req.cookies.username}.txt`))
    }
    else {
        res.json({ result: 0, msg: '回复失败' })
        return;
    }
    var da = {
        username: req.cookies.username,
        content: req.body.content,
        userAvatar: date.avatar,
        replyDate: new Date().getTime(),
        ip: req.ip
    }

    console.log("3333333333333333333333333333333")

    fs.readFile(`static/allQuestions/${req.body.askDate}.txt`, (err, data) => {
        if (err) {
            res.json({ result: 0, msg: '回复失败' });
            console.log("444444444444444444444444444444")
            return;
        }
        else {
            var data = JSON.parse(data);
            data.reply.push(da);
            console.log("55555555555555555555555")
            fs.writeFile(`static/allQuestions/${req.body.askDate}.txt`, JSON.stringify(data), (err) => {
                if (err) {
                    res.json({ result: 0, msg: '回复失败' });
                }
                else {
                    res.json({ result: 1, msg: '回复成功' });
                }
            })
        }
    });


})


app.listen(8888, function () {
    console.log('server running at 127.0.0.1:8888');
})