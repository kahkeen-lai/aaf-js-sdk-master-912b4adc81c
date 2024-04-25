Run `yarn repl` or `node repl/index.js`

Set Command
> {"$set": { "name": "@hi", "value": "hello" }}

Get Command
> {"$get": { "name": "@hi" }}

Print Command
> {"$print": { "value": "hello world" }}

Nested Command: Print + Get Command
> {"$print": { "value": { "$get": { "name": "@hi" } } }}

Replace
> {"$replace": { "from": "http://apirest/get-something?param=foo", "replace": "foo", "value": "bar" }}

