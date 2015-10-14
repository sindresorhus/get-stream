# get-stream [![Build Status](https://travis-ci.org/sindresorhus/get-stream.svg?branch=master)](https://travis-ci.org/sindresorhus/get-stream)

> Get a stream as a string or buffer


## Install

```
$ npm install --save get-stream
```


## Usage

```js
const fs = require('fs');
const getStream = require('get-stream');
const stream = fs.createReadStream('unicorn.txt');

getStream(stream).then(str => {
	console.log(str);
	/*
	              ,,))))))));,
	           __)))))))))))))),
	\|/       -\(((((''''((((((((.
	-*-==//////((''  .     `)))))),
	/|\      ))| o    ;-.    '(((((                                  ,(,
	         ( `|    /  )    ;))))'                               ,_))^;(~
	            |   |   |   ,))((((_     _____------~~~-.        %,;(;(>';'~
	            o_);   ;    )))(((` ~---~  `::           \      %%~~)(v;(`('~
	                  ;    ''''````         `:       `:::|\,__,%%    );`'; ~
	                 |   _                )     /      `:|`----'     `-'
	           ______/\/~    |                 /        /
	         /~;;.____/;;'  /          ___--,-(   `;;;/
	        / //  _;______;'------~~~~~    /;;/\    /
	       //  | |                        / ;   \;;,\
	      (<_  | ;                      /',/-----'  _>
	       \_| ||_                     //~;~~~~~~~~~
	           `\_|                   (,~~
	                                   \~\
	                                    ~~
	*/
});
```


## API

Both methods returns a promise that is resolved when the `end` event fires on the stream, indicating that there is no more data to be read.

### getStream(stream)

Get the stream as a string.

### getStream.buffer(stream)

Get the stream as a buffer.


## Related

- [get-stdin](https://github.com/sindresorhus/get-stdin) - Get stdin as a string or buffer


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
