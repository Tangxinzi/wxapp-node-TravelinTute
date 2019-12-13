const express = require('express')
const app = express()
const multer = require('multer')
const loki = require('lokijs')
const fs = require('fs')

const AipFaceClient = require("baidu-aip-sdk").face // 人脸
const AipOcrClient = require("baidu-aip-sdk").ocr  // 文本
const HttpClient = require("baidu-aip-sdk").HttpClient

// 人脸部分
HttpClient.setRequestOptions({
  timeout: 20000
})

HttpClient.setRequestInterceptor(function(requestOptions) {
  requestOptions.timeout = 20000
  return requestOptions
})

const loadCollection = (collectionName, db) => {
  return new Promise(resolve => {
    db.loadDatabase({}, () => {
      const collection = db.getCollection(collectionName) || db.addCollection(collectionName)
      resolve(collection)
    })
  })
}

const fileFilter = (request, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
    return callback(new Error('images only :)'), false)
  }
  callback(null, true)
}

const upload_face = multer({ dest: './uploads/face/', fileFilter })
const upload_orc = multer({ dest: './uploads/orc/', fileFilter })

app.use((error, request, response, next) => {
  response.status(500).send({
    message: error.message
  })
})

app.post('/wxapp-tute-ocr', upload_orc.single('wxapp-tute-ocr-image'), async (request, response, next) => {
  const APP_ID = "14913828"
  const API_KEY = "xh37h3jzSRZoPfSY7VmMyfS6"
  const SECRET_KEY = "5gIAZeprZG4yxjyeFY3EhKM8tDIGRMUs"
  const client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY)

  const db = new loki('./uploads/orc.json', { persistenceMethod: 'fs' })
  const collection = await loadCollection('uploads', db)
  const file_result = collection.insert(request.file)

  const image = fs.readFileSync(request.file.path).toString("base64")
  client.generalBasic(image).then((orc_result) => {
    db.saveDatabase()
    response.send({
      file_result,
      orc_result
    })
  }).catch(function(error) {
    response.status(500).send({
      message: error.message
    })
  })
})

app.post('/wxapp-tute-face', upload_face.single('wxapp-tute-face-image'), async (request, response, next) => {
  const APP_ID = "11702587"
  const API_KEY = "4h9q8HRARLEKNhPTN9tPvoho"
  const SECRET_KEY = "aVFcMcQIj7r8kewj7acQIMEyf1kkKf9N"
  const client = new AipFaceClient(APP_ID, API_KEY, SECRET_KEY)

  const db = new loki('./uploads/face.json', { persistenceMethod: 'fs' })
  const collection = await loadCollection('uploads', db)
  const file_result = collection.insert(request.file)

  // 人脸部分
  const imageBuf = fs.readFileSync(file_result.path);
  const image = imageBuf.toString("base64")
  const imageType = "BASE64"
  var options = {};
  options["face_field"] = "age,beauty,faceshape,gender,glasses,quality,facetype"
  options["max_face_num"] = "10"
  options["face_type"] = "LIVE"

  client.detect(image, imageType, options).then((face_result) => {
    db.saveDatabase()
    response.send({
      file_result,
      face_result
    })
  }).catch(function(error) {
    response.status(500).send({
      message: error.message
    })
  })
})

app.get('/wxapp-tute-ocr/:id', async (request, response) => {
  const db = new loki('./uploads/orc.json', { persistenceMethod: 'fs' })
  const collection = await loadCollection('uploads', db)
  const result = collection.get(request.params.id)
  response.setHeader('Content-Type', result.mimetype)
  fs.createReadStream(result.path).pipe(response)
})

app.get('/wxapp-tute-face/:id', async (request, response) => {
  const db = new loki('./uploads/face.json', { persistenceMethod: 'fs' })
  const collection = await loadCollection('uploads', db)
  const result = collection.get(request.params.id)
  response.setHeader('Content-Type', result.mimetype)
  fs.createReadStream(result.path).pipe(response)
})

app.get('/', (request, response) => {
  response.send(`
    <!DOCTYPE html>
    <html>
        <head>
            <title>hello</title>
            <link href='https://fonts.googleapis.com/css?family=Lato:100' rel='stylesheet'>
            <style>
                html, body {
                    height: 100%;
                }

                body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    display: table;
                    font-weight: 100;
                    font-family: 'Lato';
                }

                .container {
                    text-align: center;
                    display: table-cell;
                    vertical-align: middle;
                }

                .content {
                    text-align: center;
                    display: inline-block;
                }

                .title {
                    font-size: 96px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <div class="title">行在图特</div>
                </div>
            </div>
        </body>
    </html>
  `)
})

app.listen(8082, () => {
  console.log('localhost: 8082')
})
