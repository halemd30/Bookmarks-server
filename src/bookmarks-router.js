const express = require('express')
const uuid = require('uuid/v4')
const logger = require('./logger')
const isWebUrl = require('valid-url')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const bookmarks = []

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks)
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

    if (!isWebUrl(url)) {
      logger.error(`Invalid URL of '${url}'`)
      return res.status(400).send(`'url' must be valid URL`)
    }

    const id = uuid()

    const bookmark = {
      id, 
      title,
      url,
      rating,
      description
    }

    bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${id} created`)
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params
    const bookmark = bookmarks.find(b => b.id == id)

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`)
      return res
        .status(400)
        .send('Bookmark not found')
    }
    res.json(bookmark)
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
    
    bookmarks.splice(bookmarkIndex, 1)

    logger.info(`Bookmark with id ${id} deleted`)
    res
      .status(204)
      .end()
  })

module.exports = bookmarksRouter

  