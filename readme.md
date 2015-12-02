#CES Twitter Billboard 2015
This repository contains 3 separate applictaions. Each station will run all three applications, and each application should be configurable for each station. Applications reside in the following directories

## init

    $ brew install node.js
    $ sudo gem install sass
    $ npm install

## build full project

    $ gulp

## start watcher to build individual projects upon save

    $ gulp watch

The site is built into a directory structure that mirrors the src structure, with built and optimized files, continuously.

## Languages

* JADE
* SASS
* ES6

## Frameworks

* underscore
* socket.io
* express.js
* jquery
* backbone.js

## src /
### billboard/ 
Web page that drives the large screen display, and accepts commands from the server through websocket connection

### controller/
Web app that drives the iPad control surface. Accepts state commands from server. Issues state commands to server through websocket connection. 

### server/ 
Node Js app running on a local server that sends and receives state commands from controller, sends commands to billboard.


## Events

* Init connections, usually folloed by reset

name: INIT

* Resets the application to a certain state 

Name: RESET
Payload: {state to reset to}

* triggers a video to start playing

Name: PLAY_VIDEO
Payload: {ID}

* when a video ends

Name: VIDEO_ENDED

* when new tweets are scraped, triggers billboard to refresh tweets

Name: NEW_CONTENT
Payload: [ Array of content Objects ]

## Scraping content

The Server's main responsibility here is to pull content from the twitter api, and sanitize it.

The server will have 3 modes, controlled via command line switch.

The modes will switch out which keywords/hashtags/@handles are being scraped on that instance of the server.

The server will sanitize new content against a dirty word filter (replace the dirty word with something funny)?

The server will cache each return from the server.

The server will attempt to scrape periodically, and on return will send a NEW_CONTENT message

If a scrape fails, the server will send a NEW_CONTENT message containing the previous set of valid tweets


# billboard

The billboard plays videos and shows tweets with 2 modes, either video player or tweet board, controlled by messages from server

on a PLAY_VIDEO message, the billboard plays the video in the ID

when the video ends, the billboard sends a VIDEO_ENDED message and transitions to a tweet board containing the previous set of tweets

when a NEW_CONTENT message is received, the billboard model will add the new content. Then the view will animate each piecce of content sequentially on to stage

on a RESET message, the billboard changes to the init state and waits for a NEW_CONTENT messate


# control

the controller is the main ui for the application with 3 modes, controlled by messages from server

when a button is pressed on the controller, the buttons animate out and a PLAY_VIDEO message is sent

when a VIDEO_ENDED message is received the controller animates the buttons back on

tapping 8x on the controller without hitting a button sends a RESET message

on RESET message controller goes to VIDEO_ENDED state with buttons up


# timers

the server will scrape periodically