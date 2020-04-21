const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe('GET /api/bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with a 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          
          .get('/api/bookmarks')
          .expect(200, testBookmarks)
      })
    })

    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('GET /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })
    })

    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          })
      })
    })
  })

  describe('POST /api/bookmarks', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'bookmarks.com',
        description: 'Test new bookmark description',
        rating: '3'
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)  
        )
    })

    const requiredFields = ['title', 'url', 'description', 'rating']

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'test new bookmark',
        url: 'test new url',
        description: 'test new description',
        rating: '3'
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field]

        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `missing '${field}' in request body` }
          })
      })
    })
  })

  describe('DELETE /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
        const expectedBookmark = testBookmarks.filter(bookmark => bookmark !== idToRemove)

        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(() => 
            supertest(app)
            .get('/api/bookmarks')
            .expect(expectedBookmark)
          )
      })
    })
  })

})