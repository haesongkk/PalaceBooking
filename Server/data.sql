-- DROP SCHEMA public CASCADE;
--CREATE SCHEMA public;

CREATE TABLE IF NOT EXISTS rooms (
    id           SERIAL PRIMARY KEY,
    name         TEXT,
    images       INTEGER[],
    description  TEXT
);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS imgpath TEXT[];

CREATE TABLE IF NOT EXISTS image (
    id    SERIAL PRIMARY KEY,
    data  BYTEA NOT NULL,
    mime  TEXT  NOT NULL,
    size  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS setting (
    roomid      INTEGER,
    bovernight  INTEGER NOT NULL CHECK (bovernight IN (0,1)),
    status      TEXT NOT NULL,
    price       TEXT NOT NULL,
    openclose   TEXT NOT NULL,
    usagetime   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily (
    roomid     INTEGER,
    bovernight INTEGER NOT NULL,
    year       INTEGER NOT NULL,
    month      INTEGER NOT NULL,
    day        INTEGER NOT NULL,
    status     INTEGER NOT NULL,
    price      INTEGER NOT NULL,
    open       INTEGER NOT NULL,
    close      INTEGER NOT NULL,
    usagetime  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
    id           SERIAL PRIMARY KEY,
    customerid   BIGINT  NOT NULL,
    roomid       INTEGER NOT NULL,
    checkindate  TEXT    NOT NULL,
    checkoutdate TEXT    NOT NULL,
    price        INTEGER NOT NULL,
    status       INTEGER NOT NULL -- 대기, 확정, 고객 취소, 관리자 취소 등

    --checkin      DATE,
    --checkout     DATE,
);

CREATE TABLE IF NOT EXISTS discount (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    firstvisitdiscount  INTEGER NOT NULL,
    recentvisitdiscount INTEGER NOT NULL
);
INSERT INTO discount (id, firstvisitdiscount, recentvisitdiscount)
VALUES (1, 5000, 5000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS customers (
    id    BIGINT PRIMARY KEY,   
    name  TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    memo  TEXT
);






CREATE TABLE IF NOT EXISTS logs (
    id          SERIAL PRIMARY KEY,
    message     TEXT NOT NULL,
    timestamp   TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
    id          SERIAL PRIMARY KEY,
    chatbotid   INTEGER,
    isbot       BOOLEAN NOT NULL,
    timestamp   TIMESTAMP NOT NULL,
    message     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    roomid      INTEGER REFERENCES rooms(id) NOT NULL,
    isovernight BOOLEAN NOT NULL,

    dow         INTEGER,
    date        DATE,

    onsale      BOOLEAN NOT NULL,
    price       INTEGER NOT NULL,

    opentime    INTEGER CHECK (opentime BETWEEN 0 AND 23),
    closetime   INTEGER CHECK (closetime BETWEEN 0 AND 23),
    usagetime   INTEGER CHECK (usagetime BETWEEN 0 AND 12),

    CONSTRAINT uq_settings 
    UNIQUE (roomid, isovernight, dow, date) 
);


CREATE TABLE IF NOT EXISTS variables (
    firstvisitdiscount  INTEGER DEFAULT 0,
    recentvisitdiscount INTEGER DEFAULT 0
);

