/*
 * - It's possible for multiple transactions to have the same source, timestamp, description, and amount.
 * - A transaction always refers to exactly one well-formed dataset row.
 * - A well-formed dataset row is linked to exactly zero or one transaction.
 * - A dataset row might not be matched with a transaction if a previously-associated transaction was deleted by user for reasons such as:
 *   - being a duplicate
 *   - is not relevant/wanted
 *   - having since reversed
 */

CREATE TABLE eucalyptus (
    app TEXT NOT NULL PRIMARY KEY,
    version INTEGER NOT NULL
);

INSERT INTO eucalyptus (app, version) VALUES ('money', 1);

CREATE TABLE dataset_source (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    comment TEXT NOT NULL
);

CREATE TABLE dataset (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    source INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created DATETIME NOT NULL,
    FOREIGN KEY (source) REFERENCES dataset_source (id)
);

CREATE TABLE category (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    comment TEXT NOT NULL,
    set_start INTEGER NOT NULL,
    set_end INTEGER NOT NULL
);

CREATE TABLE tag (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    comment TEXT NOT NULL
);

CREATE TABLE txn (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    dataset INTEGER NOT NULL,
    raw TEXT NOT NULL,
    comment TEXT NOT NULL,
    malformed BOOLEAN NOT NULL,
    /* If timestamp cannot be extracted/parsed, use insertion time. */
    timestamp DATETIME NOT NULL,
    /* If description cannot be extracted/parsed, use empty string. */
    description TEXT NOT NULL,
    /* If amount cannot be extracted/parsed, use zero. */
    amount INTEGER NOT NULL,
    FOREIGN KEY (dataset) REFERENCES dataset (id)
);

CREATE TABLE txn_part (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    txn INTEGER NOT NULL,
    comment TEXT NOT NULL,
    /* Combined amount for all parts of a single transaction can be different from transaction amount. */
    amount INTEGER NOT NULL,
    category INTEGER,
    FOREIGN KEY (txn) REFERENCES txn (id),
    FOREIGN KEY (category) REFERENCES category (id) ON DELETE SET NULL
);

CREATE TABLE txn_part_tag (
    txn_part INTEGER NOT NULL,
    tag INTEGER NOT NULL,
    comment TEXT NOT NULL,
    PRIMARY KEY (txn_part, tag),
    FOREIGN KEY (txn_part) REFERENCES txn_part (id),
    FOREIGN KEY (tag) REFERENCES tag (id)
);
