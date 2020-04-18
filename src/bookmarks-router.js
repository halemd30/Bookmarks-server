const express = require('express')
const uuid = require('uuid/v4')
const logger = require('./logger')
const { isWebUri } = require('valid-url')
const BookmarksService = require('./bookmarks-service')
const store = ('./store')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating)
})

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    const { title, url, rating, description } = req.body

    if (!title) {
      logger.error('Title is required!')
      return res
        .status(400)
        .send('Invalid title data')
    }

    if (!url) {
      logger.error('URL is required')
      return res
        .status(400)
        .send('Invalid URL data')
    }

    if (!rating) {
      logger.error('Rating is required')
      return res
        .status(400)
        .send('Invalid rating data')
    }

    if (!description) {
      logger.error('description is required')
      return res
        .status(400)
        .send('Invalid description data')
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid URL of '${url}'`)
      return res.status(400).send(`'url' must be valid URL`)
    }

    const id = uuid()

    const bookmark = {
      id, 
      title,
      url,
      description,
      rating
    }

    store.bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${bookmark.id} created`)
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
      .json(bookmark)
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const { id } = req.params
    BookmarksService.getById(req.app.get('db'), id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found`)
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          })
        }
        res.json(serializedBookmark(bookmark))
      })
      .catch(next)
  })

  .delete((req, res) => {
    const { id } = req.params
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id)

    if (bookmarkIndex == -1) {
      logger.error(`Bookmark with id ${id} not found`)
      return res
        .status(404)
        .send('Not found')
    }
    
    store.bookmarks.splice(bookmarkIndex, 1)

    logger.info(`Bookmark with id ${id} deleted`)
    res
      .status(204)
      .end()
  })

module.exports = bookmarksRouter

  