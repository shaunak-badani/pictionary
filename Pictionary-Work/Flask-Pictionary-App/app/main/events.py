from flask import session
from flask_socketio import emit, join_room, leave_room
from .. import socketio
from .routes import d
import json
log = []
def write_to(log):
    filename = "output_log.json"
    with (open(filename,'w')) as fd:
        fd.write(json.dumps(log))
    return
@socketio.on('joined', namespace='/chat')
def joined(message):
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    room = session.get('room')
    join_room(room)
    to_display_message = session.get('name') + ' has entered the room.'
    emit('status', {'msg': to_display_message}, room=room)
    temp_session = session
    temp_session['message'] = to_display_message
    log.append(dict(temp_session))
    write_to(log)
    print("\n\n\n\n",dict(temp_session),"\n\n\n\n")

@socketio.on('text', namespace='/chat')
def text(message):
    """Sent by a client when the user entered a new message.
    The message is sent to all people in the room."""
    room = session.get('room')
    to_display_message = session.get('name') + ':' + message['msg']
    emit('message', {'msg': to_display_message}, room=room)
    temp_session = session
    temp_session['message'] = to_display_message
    log.append(dict(temp_session))
    write_to(log)
    # print("\n\n\n\n",temp_session,"\n\n\n\n")

@socketio.on('left', namespace='/chat')
def left(message):
    """Sent by clients when they leave a room.
    A status message is broadcast to all people in the room."""
    room = session.get('room')
    name=session.get('name')
    if d[room]==name:
        d.pop(room)
    leave_room(room)
    to_display_message = session.get('name') + ' has left the room.'
    emit('message', {'msg': to_display_message}, room=room)
    temp_session = session
    temp_session['message'] = to_display_message
    log.append(dict(temp_session))
    write_to(log)
    # print("\n\n\n\n",temp_session,"\n\n\n\n")