2048-as-a-service
=================

Build powerful 2048 gameplay apps with our simple 2048-as-a-service API.
Integrate 2048-functionality into your bash scripts, SoLoMo (social-local-mobile) apps and
internet-of-things devices!

# Test it out
This API is currently running live on http://2048.semantics3.com/

Type this command on the command line [full example](#full-example-gameplay)

    curl  -L 2048.semantics3.com/hi/start

or this to start a full fledged text-based 2048 game session - (a sexy perl one-liner):

    perl -e 'my $host = "http://2048.semantics3.com/hi/";my $cmd = "curl --silent -L $host"."start";my $output = `$cmd`;my $session_id = $output;$session_id=~s/.*?ID:\s(\w+).*/$1/si;my %keyMap = ( 'w' => 0, 'd' => 1, 's' => 2, 'a' => 3);print STDERR $output,"\n";while(1) { print STDERR "Input (w - up, a - left, d - right, s - down):\n"; my $userInput = <STDIN>; chomp ($userInput); if(defined($keyMap{$userInput})) { $userInput = $keyMap{$userInput}; } else { print STDERR "Invalid move.. w - up, a - left, d - right, s - down\n"; next; } my $cmd = "curl --silent $host"."state/$session_id/move/$userInput"; my $output = `$cmd`; print STDERR "\n$output\n"; if($output=~/Message:/si) { exit(0); }}'

# The API

For the below examples to work in your system replace `api.semantics3.com` with a suitable `<host>:<port>`

####API Modes
2048-as-a-services supports two modes:

`json` mode

All responses in this mode will be valid JSON strings. 
You should use this mode if you are bulding programmatic interfaces.
To enable this mode add a `/json` suffix to all query strings.

`game` mode (default)

This mode is for playing the game on an text console.

####ZEST Principles
This API follows ZEST principles.

All requests must begin with a `/hi`.

Failure to do so will result in a **800** 'Please say hi...' error.


####Session Duration

All game sessions will be terminated if there is more than `5 minutes` of inactivity.

# API Reference (JSON mode)

## GET /hi/start/json

Start a new game session and will redirect to `/hi/state/session_id` with a `302` status.

It will start with the standard **2048** game parameters of `size` set to 4, `tiles` set to 2, `victory` set to 11 (2^11=2048) and `rand` set to `2` (2^1=2 and 2^2=4).

## GET /hi/start/size/:size/tiles/:tiles/victory/:victory/rand/:rand/json

Start a customized version of **2048**.

####Parameters



`size` - grid size of the game

Allowed value is an **integer** between **4** and **16**

Responds with a **503** if invalid `size` is sent.

---

`tiles` - number of tiles at game start

Allowed value is an **integer** between **1** and **[0.5 * ** `size`^**2]**

Responds with a **503** if invalid `tiles` is sent.

---

`victory` - victory tile number. 

This number will be the power used to raise the number 2, to determine the winning tile number. eg: To set 2048 as the winning tile, `victory` should be set to 11 - because 2^**11** = 2048

Allowed value is an **integer** between **10** and **31**

Responds with a **503** if invalid `victory` is sent.

---

`rand` - The range of tile number powers, that will be used to determine the number to populate the grid after each move.

eg: if `rand` is set as 4, the following numbers will appear randomly - **2^1 = 2**, **2^2 = 4**, **2^3 = 8** and **2^4 = 16**.
For the default game setting `rand` is set as 2 - and thus **2^1 = 2** and **2^2 = 4** will only appear.

Allowed value is an **integer** between **1** and **(`victory` - 1)**

Responds with a **503** if invalid `size` is sent.


#### example request (for standard 2048 game)

    $ curl -i -L 2048.semantics3.com/hi/start/json
    
    
#### example request (for customized game)

    $ curl -i -L 2048.semantics3.com/hi/start/size/8/tiles/4/victory/13/rand/4/json

#### example output
A succesful request will redirect to *2048.semantics3.com/hi/state/session_id/json*

    HTTP/1.1 302 Moved Temporarily
    Location: /hi/state/650ab3b0eaea9b18c4ee7d837d454b9a70477ba5/json
    Date: Tue, 01 Apr 2014 01:23:26 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked
    
    HTTP/1.1 200 OK
    Content-Type: application/json
    Content-Length: 264
    Date: Tue, 01 Apr 2014 01:23:26 GMT
    Connection: keep-alive

with the following *JSON* output:

    {
       "grid":[[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[4,0,0,0,0,0,2,0],[0,0,2,2,0,0,0,0],[0,0,0,0,0,0,0,0]],
       "moved" : false,
       "over" : false,
       "zen" : "Discontent is the want of self-reliance: it is infirmity of will.",
       "score" : 0,
       "session_id" : "650ab3b0eaea9b18c4ee7d837d454b9a70477ba5",
       "won" : false,
       "points" : 0
    }


## GET /hi/state/:session_id/json

Get the current game state for the specified `session_id`.

#### example request

    $ curl 2048.semantics3.com/hi/state/306a9d37bef18f33ca9cee4e71803070a799c6f9/json

Responds with **404** if `:session_id` is invalid or does not exist

#### example output

    {
      "grid":[[0,0,0,0],[0,2,0,0],[0,0,0,0],[0,2,0,0]],
       "moved" : false,
       "over" : false,
       "zen" : "We are afraid of truth, afraid of fortune, afraid of death, and afraid of each other.",
       "score" : 0,
       "session_id" : "306a9d37bef18f33ca9cee4e71803070a799c6f9",
       "won" : false,
       "points" : 0
    }

## GET /hi/state/:session_id/move/:move/json

The actual gameplay functionality.
`:session_id` is the session id of the game that you got when you started the game.
`:move` is the next move entered by the user.

There are 4 possible values for `:move` -

`0` for UP

`1` for RIGHT

`2` for DOWN

`3` for LEFT


#### example request

    $ curl 2048.semantics3.com/hi/state/8237f82c13ff24d2b361f717bde6130c5c50f0d5/move/0/json

Responds with **404** if `session_id` does not exist
Responds with **503** if invalid `:move` specified

Game session will terminate with either a 'You Won!' or a 'Game Over! You Lost!' message.

#### example output

    {
       "grid":[[2,0,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
       "score" : 0,
       "won" : false,
       "points" : 0,
       "over" : false,
       "moved" : false,
       "session_id" : "8237f82c13ff24d2b361f717bde6130c5c50f0d5",
       "zen" : "How easily we capitulate to badges and names, to large societies and dead institutions."
    }

#### explanation of attributes

`moved` - **boolean** - move status (*true* means a move was made)

`over` - **boolean** - game status (*true* means the gave is over)

`won` - **boolean** - game status (*true* means you won the game. *false* doesn't mean you lost the game - infer that from `over`)

`zen` - **string** - zen inspiring message (eg: "May the Force be with you")

`score` - **integer** - overall score of the game

`points` - **integer** - points that were scored by move that was performed

`session_id` - **string** - session id of the game

`grid` - **2d array** - 2d array representating the game board (null/empty values are represented with a 0)

`message` - **string** - If this appears that means the game has ended. Two possible strings will be emitted - 'You Won!' or a 'Game Over! You Lost!' message. You can treat the existence of the `message` attribute that the game has ended it's equivalent to `won||over`.


# API Reference (Game mode)

Pretty self explanatory.

####Supported methods:

### GET /hi/start
### GET /hi/start/size/:size/tiles/:tiles/victory/:victory/rand/:rand
### GET /hi/state/:session_id
### GET /hi/state/:session_id/move/:move

---
####full example gameplay
    
    **To start a game session:**
    
    ➜  client git:(master) ✗ curl  -L 2048.semantics3.com/hi/start                                           
    Session ID: 190d2bcb3e09c89771e6f252c03425cfa0a3a4a0
    Overall Score: 0
    
    Grid:
    +---+---+---+---+
    | 0 │ 2 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 2 |
    +---+---+---+---+
    
    Zen:
    We are afraid of truth, afraid of fortune, afraid of death, and afraid of each other.
    ==
    
    **To view game state**
    
    ➜  client git:(master) ✗ curl  -L 2048.semantics3.com/hi/state/190d2bcb3e09c89771e6f252c03425cfa0a3a4a0     
    
    Session ID: 190d2bcb3e09c89771e6f252c03425cfa0a3a4a0
    Overall Score: 0
    
    Grid:
    +---+---+---+---+
    | 0 │ 2 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 2 |
    +---+---+---+---+
    
    Zen:
    You were the chosen one! It was said that you would destroy the Sith, not join them.
    ==

    **To move up**
    
    ➜  client git:(master) ✗ curl  -L 2048.semantics3.com/hi/state/190d2bcb3e09c89771e6f252c03425cfa0a3a4a0/move/0
    
    Session ID: 190d2bcb3e09c89771e6f252c03425cfa0a3a4a0
    Overall Score: 0
    
    Grid:
    +---+---+---+---+
    | 0 │ 2 │ 0 │ 2 |
    |---+---+---+---+
    | 0 │ 4 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    +---+---+---+---+
    
    Zen:
    Wait. I know that laugh...
    ==
    
    **To move down**
    
    ➜  client git:(master) ✗ curl  -L 2048.semantics3.com/hi/state/190d2bcb3e09c89771e6f252c03425cfa0a3a4a0/move/2
    
    Session ID: 190d2bcb3e09c89771e6f252c03425cfa0a3a4a0
    Overall Score: 0
    
    Grid:
    +---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 0 │ 0 │ 0 |
    |---+---+---+---+
    | 0 │ 2 │ 0 │ 2 |
    |---+---+---+---+
    | 0 │ 4 │ 0 │ 2 |
    +---+---+---+---+
    
    Zen:
    To be great is to be misunderstood.


#Authors

By [Sivamani Varun](http://www.netvarun.com/).


#Credits

2048 was created by [Gabriele Cirulli](http://gabrielecirulli.com). Based on [1024 by Veewo Studio](https://itunes.apple.com/us/app/1024!/id823499224) and conceptually similar to [Threes by Asher Vollmer](http://asherv.com/threes/).

The heart of this project is the 2048 game engine, which was extracted from the original 2048 with some modifications.

#License
MIT

