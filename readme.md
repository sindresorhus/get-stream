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

Both methods returns a promise that is resolved when the `end` event fires on the stream, indicating that there is no more data to be read. The stream is switched to flowing mode.

### getStream(stream, [options])

Get the stream as a string.

#### options

##### encoding

Type: `string`<br>
Default: `utf8`

[Encoding](https://nodejs.org/api/buffer.html#buffer_buffer) of the incoming stream.

### getStream.buffer(stream)

Get the stream as a buffer.


## FAQ

### How is this different from [`concat-stream`](https://github.com/maxogden/concat-stream)?

This one accepts a stream instead of being one and returns a promise instead of using a callback. The API is simpler and it only supports returning a string or buffer. It doesn't have a fragile type inference. You explicitly choose what you want. And it doesn't depend on the huge `readable-stream` package.


## Related

- [get-stdin](https://github.com/sindresorhus/get-stdin) - Get stdin as a string or buffer


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
