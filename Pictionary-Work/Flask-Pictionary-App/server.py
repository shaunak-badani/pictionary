#!/bin/env python
from app import create_app, socketio
from flask_cors import CORS
app = create_app(debug=True)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

if __name__ == '__main__':
    socketio.run(app)
