from flask import session, redirect, url_for, render_template, request
from . import main
from .forms import LoginForm
import json
d={}
d_url={}

words=[]
from random import shuffle
import csv
 
with open('./words.csv') as csvDataFile:
    csvReader = csv.reader(csvDataFile)
    for row in csvReader:
        words.append(row[0])

@main.route('/', methods=['GET', 'POST'])
def index():
    """Login form to enter a room."""
    form = LoginForm()
    if form.validate_on_submit():
        session['name'] = form.name.data
        session['room'] = form.room.data
        return redirect(url_for('.chat'))
    elif request.method == 'GET':
        form.name.data = session.get('name', '')
        form.room.data = session.get('room', '')
    return render_template('index.html', form=form)


@main.route('/chat')
def chat():
    """Chat room. The user's name and room must be stored in
    the session."""
    name = session.get('name', '')
    room = session.get('room', '')
    if name == '' or room == '':
        return redirect(url_for('.index'))
    if room in d:
        if d[room]==name:
            return render_template('drawer.html', name=name, room=room, role="drawer")
        return render_template('viewer.html', name=name, room=room, role="viewer")
    else:
        d[room]=name
        d_url[room]=""
        shuffle(words)
        w=words[0]
        return render_template('drawer.html', name=name, room=room, role="drawer", word=w)

@main.route('/updateImg',methods=["GET"])
def upd():
    url=request.args.get("vy")
    room = session.get('room', '')
    d_url[room]=url
    return 'OK'

@main.route('/getImg',methods=["GET"])
def get():
    room = session.get('room', '')
    return d_url[room]

@main.route('/savecoord',methods=["GET"])
def savecoord():
    data = str(request.args.get('point'))
    with open('co_ordinates.csv',"w") as fd:
        fd.write(data)
    return 'OK'
