var fs = require('fs');
var express = require('express');
var multer = require('multer')
var path = require('path')
const classModel = require('./collec.js')

var app = express();

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});
var upload = multer({ dest: 'upload/' });


function saveFile(uploadfiles) {
  let fileInfos = [];
  let files = uploadfiles;
  let file = files[0];

  console.log('文件类型：%s', file.mimetype, file.mimetype.split('/')[1]);
  console.log('原始文件名：%s', file.originalname);
  console.log('文件大小：%s', file.size);
  console.log('文件保存路径：%s', file.path);
  let fileInfo = {};
  fs.renameSync('./upload/' + file.filename, './upload/' + file.filename + '.' + file.mimetype.split('/')[1]);//这里修改文件名字，比较随意。
  // 获取文件信息
  fileInfo.mimetype = file.mimetype;
  fileInfo.originalname = file.originalname;
  fileInfo.size = file.size;
  fileInfo.path = file.path;
  fileInfos.push(fileInfo);

  return { name: file.originalname, url: file.filename + '.' + file.mimetype.split('/')[1] }
}
// 单图上传
app.post('/upload', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'mp4', maxCount: 1 }]), function (req, res, next) {
  console.log('1')
  console.log(req.body.type)
  if (req.files.logo.length != 1) {
    res.render("error", { message: "上传封面不能为空！" })
  }
  if (req.files.mp4.length != 1) {  //判断一下文件是否存在，也可以在前端代码中进行判断。
    res.render("error", { message: "上传文件不能为空！" });
    return
  } else {
    let logoU = saveFile(req.files.logo)
    console.info(logoU)
    let mp4U = saveFile(req.files.mp4)
    console.info(mp4U)
    //存入数据库
    let newStudent = [{
      name: mp4U.name,
      fileUrl: logoU.url,
      mp4Url: mp4U.url
    }]
    classModel.create(newStudent, (err) => {
      if (err) return console.log(err)
      else {
        console.log('添加成功')
      }
    })
    // 设置响应类型及编码
    res.set({
      'content-type': 'application/json; charset=utf-8'
    });

    res.end("上传成功！");
  }
})


app.get('/', async function (req, res, next) {
  debugger
  var next_url = ''
  var response = res
  await a(response)
  /**因为a函数是个promise,所以 a().then(res=>{这里面是成功的,resolve返回的}).catch(res=>{这里面是失败的,就是reject返回的}) */
  console.log('dizhi :' + next_url)
})


function a(response) {
  return new Promise((resolve, reject) => {
    debugger
    classModel.find({}, (err, result, res) => {
      if (err) {
        console.log('查询错误:' + err)
        response.send('查询错误:' + err)
      }
      else {
        console.log('jieguo :' + result)
        response.send(result)
      }
      resolve()  //resove(可以给参数 也可以不给) 代表成功的意思   reject代表失败的意思
    })
  })
}

app.get('/img/:id', function (req, res) {
  console.log(req.params)
  fs.readFile("./upload/" + req.params.id, "binary", function (err, data) {
    if (err) {
      console.log(err)
    } else {
      res.write(data, "binary")
      res.end()
    }
  })
})

app.get('/down/:id', function (req, res, next) {
  console.info('已返回视频')
  res.sendFile(path.join(__dirname, 'upload/18571caf18c3564cf61a0b102ad1b25e.mp4'));
})
app.get('/video/:id', function (req, res) {
  var time = new Date();
  var videoName = req.params.id;
  console.info(videoName)
  console.log("-------点击查询下载" + time.getFullYear() + "/" + time.getMonth() + "/" + time.getDate() + "/" + time.getHours() + "/" + time.getMinutes() + "/" + time.getSeconds() + "-------");
  res.writeHead(200, { 'Content-Type': 'video/mp4' });
  var rs = fs.createReadStream('upload/' + req.params.id);
  rs.pipe(res);

  rs.on('end', function () {
    res.end();
    console.log('end call');
  });
});

app.get('/video2', function (req, res) {
  const path = './upload/0f04396075b6a60e441c16478eb9afe3.mp4'
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  console.info('range:'+range)
  if (range) {
    console.info('进入range')
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1

    const chunksize = (end - start) + 1
    const file = fs.createReadStream(path, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }

    res.writeHead(206, head)
    file.pipe(res)
  } else {
    console.info('播放')
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
})

app.listen(3000);