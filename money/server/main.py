from os.path import dirname, realpath, join, abspath

from flask import Flask, g, send_file

from server.api._common import DATABASE
from server.api.category import category_api
from server.api.dataset import dataset_api
from server.api.dataset_source import dataset_source_api
from server.api.transaction import transaction_api
from server.api.transaction_part import transaction_part_api
from server.db import prepare_database

PROJ_DIR = realpath(join(dirname(abspath(__file__)), '..'))
DATABASE_SCHEMAS_DIR = join(PROJ_DIR, 'db')
CLIENT_BUILD_DIR = join(PROJ_DIR, 'client', 'build')
CLIENT_BUILD_PAGE = join(CLIENT_BUILD_DIR, 'index.html')

prepare_database(DATABASE, 'money', DATABASE_SCHEMAS_DIR)

server = Flask(
    __name__,
    static_url_path='',
    static_folder=CLIENT_BUILD_DIR,
)


@server.teardown_request
def commit_transaction(exception):
    # TODO Unlock tables
    db = getattr(g, '_database', None)
    if db is not None and not exception:
        db.commit()


@server.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
    if exception is not None:
        raise exception


@server.route('/', methods=['GET'])
def root():
    return send_file(CLIENT_BUILD_PAGE, cache_timeout=0)


server.register_blueprint(category_api)
server.register_blueprint(dataset_api)
server.register_blueprint(dataset_source_api)
server.register_blueprint(transaction_api)
server.register_blueprint(transaction_part_api)
