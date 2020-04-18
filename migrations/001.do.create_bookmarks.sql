CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title TEXT NOT NULL,
  url VARCHAR(255) NOT NULL,
  description TEXT,
  rating decimal(2,1) CONSTRAINT CHECK (rating >= 0 AND rating <= 5)
)