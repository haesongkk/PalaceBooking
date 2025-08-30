CREATE TABLE IF NOT EXISTS room (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    image        TEXT NOT NULL,
    description  TEXT NOT NULL
);

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
    status       INTEGER NOT NULL
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
    id    BIGINT PRIMARY KEY,    -- Date.now() 사용
    name  TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    memo  TEXT
);
