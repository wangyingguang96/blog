const express = require('express')

const multer = require('multer')

const cookieParser = require('cookie-parser')

const fs = require('fs')

const bodyParser = require('body-parser')

const app = express()

//调用storage来配置数据存储的操作
const diskStorage =  multer.diskStorage({
	//filename设置文件保存的名称
	//参数1:请求对象
	//参数2:操作的文件
	//参数3:回调操作
	filename:function(req,file,callback){
		
		//获取用户名作为头像文件的名称
		//var username =  req.body.username
		
		//获取cookie的信息
		//req.cookies
		
		//获取用户名
		var username =  req.cookies.username
		console.log('>>>>>>>>>>>>>>>',username)
		console.log(file)
		
		//使用用户名对图片进行命名
		var type =  file.mimetype;
		
		var originalName = file.originalname;
		
		//image/jpeg  image/png  image/gif
		if(/image\/+/g.test(type)){
			
			/*
			type = type.substr(6)
			
			type =  type == 'jpeg' ? 'jpg' : type
			*/
			type = originalName.split('.')[1];
			
			callback(null,`${username}.${type}`)
		}
		
	},
	
	//destination设置文件保存路径
	destination:function(req,file,callback){
		
		callback(null,'static/uploads/')
	}
})

//使用multer模块并初始化存储设置选项
const upload = multer({storage:diskStorage})

app.use(express.static('static'))

app.use(cookieParser())

app.use(bodyParser.urlencoded({extended:true}))

/*
 * 用户注册
 */
app.post('/user/register',upload.single('avatar'),(req,res)=>{
	
	//req.body获取提交的文本数据
	var body = req.body;
	console.log(body)
	// req.file获取提交的单个文件数据,对应upload.single()
	// req.files获取提交的多个文件数据,对应upload.array()
	var aFile = req.file
	
	console.log(aFile)
	
	var type = aFile.originalname;
	
	type = type.split('.')[1];
	
	var data = {
		username:body.username,
		psw:body.psw[0],
		email:body.email,
		sex:body.sex,
		
		//记录注册日期
		registerDate:new Date().getTime(),
		
		//获取用户头像路径
		avatar:`uploads/${body.username}.${type}`	
		
	}
	
	fs.exists('users',(isExists)=>{
		if(!isExists){
			
			//fs.mkdirSync同步的创建文件夹的方法
			//Asynchronize 异步
			//Synchronize  同步
			fs.mkdirSync('users')
		}
	})
	
	var filePath = `users/${body.username}.txt`
	
	//fs.exists()是文件系统提供的用来判断某一个目录/路径是否存在。该方法是一个异步方法，所以结果会在=回调函数中返回。
	//参数1:路径
	//参数2:判断完成的回调函数，该函数有一个Boolean参数代表判断结果(true\false)
	
	//另外fs的很多函数都提供了Sync方法(同步方法)，这些方法的结果都是按照返回值的方式返回的。
	//var result =  fs.existsSync(filePath)
	
	//console.log('>>>>>' + result)
	
	fs.exists(filePath,(isExists)=>{
		
		//如果存在<username>.txt代表该用户已注册
		if(isExists){
			
			res.json({result:0,msg:"该用户已经注册!"})
		}
		else{
			
			//未注册
			//fs.appendFile()往某一个文件内追加数据。该文件假如不存在会创建该文件。
			//参数1:文件路径
			//参数2:要追加的数据(ps:需要是string类型的数据)
			//参数3:操作结果的回调函数。该函数有一个error参数代表出错信息，该参数没有值则代表操作成功。
			fs.appendFile(filePath,JSON.stringify(data),(err)=>{
				if(err){
					res.json({result:0,msg:"注册失败!"})
				}
				else{
					res.json({result:1,msg:"注册成功!"})
				}
			})
		}
		
	})
	 
})

/*
 * 用户登录
 */
app.post('/user/login',(req,res)=>{
	
	var body = req.body;
	var filePath = `users/${body.username}.txt`
	
	//fs.readFile()读取文件的方法
	//参数1:文件路径
	//参数2:回调。该回调中有一个data参数是读取到的数据，还有一个error参数是出错信息。
	fs.readFile(filePath,(err,data)=>{
		console.log(data)
		console.log(err)
		if(err){
			//读取失败
			res.json({result:0,msg:"该用户不存在!"})
		}
		else{
			//读取成功
			console.log(JSON.parse(data))
			var userInfo = JSON.parse(data)
			
			if(userInfo.username == body.username){
				
				if(userInfo.psw == body.psw){
					
					res.json({result:1,msg:"登录成功!"})
				}
				else{
					
					res.json({result:0,msg:"密码错误!"})
				}
			}
			else{
				
				res.json({result:0,msg:"该用户不存在!"})
			}
			
		}
	})
})

/*
 * 用户退出登录
 */
app.get('/user/logout',(req,res)=>{
	
	if(req.cookies.username){
		
		//清除cookie
		res.clearCookie('username')
		
	}
	
	res.json({result:1,msg:"退出成功!"})
})

/*
 * 用户提问
 */
app.post('/user/ask',(req,res)=>{
	
	var body = req.body;
	
	var d =  fs.readFileSync(`users/${req.cookies.username}.txt`)
	
	if(d){
		
		d = JSON.parse(d)
	}
	else{
		res.json({result:0,msg:"提问失败!"})
		return;
	}
	
	var data = {
		content:body.question,
		username:req.cookies.username,
		userAvatar:d.avatar,
		publishDate:new Date().getTime(),
		//获取发起请求的设备的ip
		ip:req.ip,
		reply:[]
	}
	
	var filePath = 'static/allQuestions'
	fs.exists(filePath,(isExists)=>{
		
		if(!isExists){
			
			fs.mkdirSync(filePath)
		}
		
		fs.appendFile(`${filePath}/${data.publishDate}.txt`,JSON.stringify(data),(err)=>{
			if(err){
				
				res.json({result:0,msg:"提问失败!"})
			}
			else{
				
				res.json({result:1,msg:"提问成功!"})
			}
		})
	})
	
	
})

/*
 * 获取所有问题
 */
app.get('/getAllQuestions',(req,res)=>{
	
	var path = 'static/allQuestions'
	
	//fs.readdir读取文件夹
	fs.readdir(path,(err,files)=>{
		console.log(err)
		console.log(files)
		if(err){
			
			res.json({result:0,msg:"获取失败"})
		}
		else{
			var result = [];
			var count = 0;
			files.forEach(function(item,index){
			
				fs.readFile(`${path}/${item}`,(err,data)=>{
					
					if(err){
						console.log(err)
						res.json({result:0,msg:"获取失败"})
						return;
					}
					
					data = JSON.parse(data)
	
					result.push(data)
					
					count++;
					
					if(count == files.length){
						res.json({result:1,msg:"获取成功",data:{contents:result}})
					}
				})
				
			})
			
			
		}
	})
})

/*
 * 回复问题
 */
app.post('/reply',(req,res)=>{
	
	var body = req.body;
	var askDate = body.askDate;
	var d =  fs.readFileSync(`users/${req.cookies.username}.txt`)
	
	if(d){
		d = JSON.parse(d)
	}
	else{
		res.json({result:0,msg:"回复失败!"})
		return;
	}
	
	var replyData = {
		content:body.content,
		username:req.cookies.username,
		userAvatar:d.avatar,
		replyDate:new Date().getTime(),
		ip:req.ip	
	}
	var filePath = `static/allQuestions/${askDate}.txt`
	
	console.log(filePath)
	
	fs.readFile(filePath,(err,data)=>{
		
		if(err){
			console.log('........')
			res.json({result:0,msg:"回复失败!!!"})
		}
		else
		{
			data = JSON.parse(data)
						
			data.reply.push(replyData)
			
			//fs.writeFile()往文件中重新写入数据，会覆盖原来的数据
			fs.writeFile(filePath,JSON.stringify(data),(err)=>{
				
				if(err){
					console.log('=======')
					res.json({result:0,msg:"回复失败"})
				}
				else{
					
					res.json({result:1,msg:"回复成功"})
				}
			})
			
		}
	})
	
})
app.listen(8888,()=>{
	
	console.log('server running at 127.0.0.1:8888')
})
