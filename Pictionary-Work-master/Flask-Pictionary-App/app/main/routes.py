from flask import session, redirect, url_for, render_template, request, send_file
from . import main
from .forms import LoginForm
import json
import random
import os
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
        shuffle(words)
        session['word'] = words[0]
        return redirect(url_for('.chat'))
    elif request.method == 'GET':
        pass
    return render_template('index.html', form=form)


@main.route('/chat')
def chat():
    """Chat room. The user's name and room must be stored in
    the session."""
    name = session.get('name', '')
    room = session.get('room', '')
    img  = session.get('avatar_id','')
    w = session.get('word','')
    if name == '' or room == '':
        return redirect(url_for('.index'))
    if room in d:
        if d[room]==name:
            return render_template('drawer.html', name=name, room=room, role="drawer",word=w)
        return render_template('viewer.html', name=name, room=room, role="viewer")
    else:
        d[room]=name
        d_url[room]=""
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
    data1 = str(request.args.get('pen'))
    data2 = str(request.args.get('eraser'))
    with open('pen_co_ordinates.csv',"w") as fd:
        fd.write(data1)
    with open('eraser_co_ordinates.csv',"w") as fd:
        fd.write(data2)
    return 'OK'

@main.route('/static/get_avatar', methods=['GET', 'POST'])
def get_avatar():
    img_name = random.choice(list(os.listdir('./app/static/images/avatar')))
    session['avatar_id'] = img_name
    return send_file('./static/images/avatar/'+img_name)

@main.route('/static/get_myavatar', methods=['GET', 'POST'])
def get_myavatar():
    img_name = session.get('avatar_id','')
    return send_file('./static/images/avatar/'+img_name)

@main.route('/static/get_backg', methods=['GET', 'POST'])
def get_backg():
    img_name = random.choice(list(os.listdir('./app/static/images/background')))
    return send_file('./static/images/background/'+img_name)
