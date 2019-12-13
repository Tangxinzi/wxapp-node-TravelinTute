const express = require('express')
const app = express()
const multer = require('multer')
const loki = require('lokijs')
const fs = require('fs')

const loadCollection = (collectionName, db) => {
  return new Promise(resolve => {
    db.loadDatabase({}, () => {
      const collection = db.getCollection(collectionName) || db.addCollection(collectionName)
      resolve(collection)
    })
  })
}

const fileFilter = (request, file, callback) => {
  if (!file.originalname.match(/\.(AVI|mov|rmvb|rm|FLV|mp4|3GP)$/)) {
    return callback(new Error('video only :)'), false)
  }
  callback(null, true)
}

const upload_video = multer({ dest: './uploads/video/', fileFilter })

app.use((error, request, response, next) => {
  response.status(500).send({
    message: error.message
  })
})

app.post('/uploads-video', upload_video.single('video'), async (request, response, next) => {
  const db = new loki('./uploads/video.json', { persistenceMethod: 'fs' })
  const collection = await loadCollection('uploads', db)
  const result = collection.insert(request.file)
  db.saveDatabase()

  response.send({ result })
})

app.get('/uploads-video/:id', async (request, response) => {
  const db = new loki('./uploads/video.json', { persistenceMethod: 'fs' })
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
