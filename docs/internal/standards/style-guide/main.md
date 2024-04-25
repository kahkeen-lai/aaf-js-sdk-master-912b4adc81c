# XAAF TypeScript Style Guide ,preview

> **Note**: this guide extending the [Airbnb style guide](https://github.com/airbnb/javascript) that was originally written for JavaScript, and requires that you be familiar with it.

For clean code reference, you can look [here](https://github.com/labs42io/clean-code-typescript).

## Table of Contents

  1. [Types](#types)
  1. [References](#references)
  1. [Objects](#objects)
  1. [Arrays](#arrays)
  1. [Destructuring](#destructuring)
  1. [Strings](#strings)
  1. [Functions](#functions)
  1. [Optionals](#optionals)
  1. [Async](#async)
  

## Types

  <a name="types"></a><a name="1.1"></a>
 - [1.1](#types) Every object should be typed with interface, type or a class.

    ```ts
    // bad
    function getConfig(): object {
        const config = {};
        config['foo'] = "123";
        config['bar'] = "456";

        return config;
    }

    // good
    interface Config {
        foo: string;
        bar: string;
    }

    function getConfig(): Config {
        const config: Config = {
            foo: "123",
            bar: "456"
        };

        return config;
    }
    ```
  
<a name="types--inline"></a><a name="1.2"></a>
  - [1.2](#types--inline) **inline types**: always prefer explicit type

    ```ts
    // bad
    function addPerson(person: {name: string, lastName: string}): void {
        // do something with person here
    }

    // good
    interface Person {
        name: string;
        lastName: string;
    }

    function addPerson(person: Person): void {
        // do something with person here
    }
    ```

<a name="types--any"></a><a name="1.3"></a>
  - [1.3](#types--any)  **any**: every object or variable should have a concrete type. The type can be a primitive type or custom type.

    ```ts
    // bad implicit any
    function addPerson(person): void {
        // do something with person here
    }

    // bad explicit any
    function addPerson(person: any): void {
        // do something with person here
    }

    // good
    interface Person {
        name: string;
        lastName: string;
        email: string
    }

    function addPerson(person: Person): void {
        // do something with person here
    }
    ```

<a name="types--prefer"></a><a name="1.4"></a>
  - [1.4](#types--prefer)  **Interfaces**: consider interfaces your best friend. Always prefer to use interfaces where possible.
  DTO's should be typed via interfaces.
  
    > Why? interfaces don't transpile to anything at runtime making your bundle smaller while giving you the same functionality you need in compile time.

    ```ts
    // bad 
    class Person {
        name: string;
        lastName: string;
    }

    // good
    interface Person {
        name: string;
        lastName: string;
    }
    ```

<a name="types--type"></a><a name="1.4"></a>
  - [1.4](#types--aliases)  **Type Aliases**: consider using type aliases instead of creating a new type.
  
    > Why? Aliasing can be used as a form of documentation.

    ```ts
    // good 
    const timeInSeconds: number = 10;

    // better
    type Second = number;
    
    const time: Second = 10;
    ```
**[⬆ back to top](#table-of-contents)**

## References

  <a name="references--prefer-const"></a><a name="2.1"></a>
  - [2.1](#references--prefer-const) Use `const` for all of your references; avoid using `var`. eslint: [`prefer-const`](https://eslint.org/docs/rules/prefer-const.html), [`no-const-assign`](https://eslint.org/docs/rules/no-const-assign.html)

    > Why? This ensures that you can’t reassign your references, which can lead to bugs and difficult to comprehend code.

    ```ts
    // bad
    var a = 1;
    var b = 2;

    // good
    const a = 1;
    const b = 2;
    ```

  <a name="references--disallow-var"></a><a name="2.2"></a>
  - [2.2](#references--disallow-var) If you must reassign references, use `let` instead of `var`. eslint: [`no-var`](https://eslint.org/docs/rules/no-var.html)

    > Why? `let` is block-scoped rather than function-scoped like `var`.

    ```ts
    // bad
    var count = 1;
    if (true) {
      count += 1;
    }

    // good, use the let.
    let count = 1;
    if (true) {
      count += 1;
    }
    ```

  <a name="references--block-scope"></a><a name="2.3"></a>
  - [2.3](#references--block-scope) Note that both `let` and `const` are block-scoped.

    ```ts
    // const and let only exist in the blocks they are defined in.
    {
      let a = 1;
      const b = 1;
    }
    console.log(a); // ReferenceError
    console.log(b); // ReferenceError
    ```

**[⬆ back to top](#table-of-contents)**

## Objects

<a name="es6-object-concise"></a><a name="3.1"></a>
  - [3.1](#es6-object-concise) Use property value shorthand. eslint: [`object-shorthand`](https://eslint.org/docs/rules/object-shorthand.html)

    > Why? It is shorter and descriptive.

    ```ts
    interface Person {
        fullName: string;
    }

    // bad
    function createPerson(fullName: string): Person {
        const person: Person = {
            fullName: fullName
        };

        return person;
    }

    //  good
    function createPerson(fullName: string): Person {
        const person: Person = {
            fullName
        };

        return person;
    }
    ```
  
  <a name="objects--rest-spread"></a><a name="3.2"></a>
  - [3.2](#objects--rest-spread) Prefer the object spread operator over [`Object.assign`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) to shallow-copy objects. Use the object rest operator to get a new object with certain properties omitted.

    ```ts
    interface Person {
        name: string;
        lastName: string;
        email?: string;
    }

    const originalPerson: Person = { 
        name: 'jane',
        lastName: 'doe'
    };

    // very bad, this mutates `original` ಠ_ಠ
    const copyPerson: Person = Object.assign<Person, Partial<Person>>(originalPerson, { email: 'example@test.com' });
    delete copyPerson.name; // so does this

    // bad
    const copyPerson = Object.assign<{}, Person, Partial<Person>>({}, originalPerson, { email: 'example@test.com' });

    // good
    const copy = { 
        ...originalPerson, 
        email: 'example@test.com' 
    }; 
    ```

    <a name="objects--mutation"></a><a name="3.3"></a>
  - [3.3](#objects--mutation) Use spread operator to avoid object mutation.

    ```ts
    interface MenuConfig {
        title?: string,
        body: string;
        buttonText: string;
        cancellable: true
    }
    
    // bad
    function createMenu(config: MenuConfig): void {
        config.title = config.title || "Foo";
        config.body = config.body || "Bar";
        config.buttonText = config.buttonText || "Baz";
        config.cancellable = config.cancellable !== undefined ? config.cancellable : true;

        // do something with config
    }
    
    // good
    function createMenu(config: MenuConfig): void {
        const defaultConfig = {
            title: "Foo",
            body: "Bar",
            buttonText: "Baz",
            cancellable: true,
        };

        const menuConig = {
            ...defaultConfig,
            ...config
        }

        // do something with menuConig
    }
    ```

**[⬆ back to top](#table-of-contents)**

## Arrays

  <a name="arrays--literals"></a><a name="4.1"></a>
  - [4.1](#arrays--literals) Use the literal syntax for array creation. eslint: [`no-array-constructor`](https://eslint.org/docs/rules/no-array-constructor.html)

    ```ts
    // bad
    const items = new Array<string>();

    // good
    const items: string[] = [];
    ```

  <a name="arrays--push"></a><a name="4.2"></a>
  - [4.2](#arrays--push) Use [Array#push](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/push) instead of direct assignment to add items to an array.

    ```ts
    const someStack: string[] = [];

    // bad
    someStack[someStack.length] = 'abracadabra';

    // good
    someStack.push('abracadabra');
    ```

  <a name="es6-array-spreads"></a><a name="4.3"></a>
  - [4.3](#es6-array-spreads) Use array spreads `...` to copy arrays.

    ```ts
    const items: string[] = ['banana', 'apple'];

    // bad
    const len = items.length;
    const itemsCopy: string[] = [];
    let i;

    for (i = 0; i < len; i += 1) {
      itemsCopy[i] = items[i];
    }

    // good
    const itemsCopy = [...items];
    ```

  <a name="arrays--from"></a>
  <a name="arrays--from-iterable"></a><a name="4.4"></a>
  - [4.4](#arrays--from-iterable) To convert an iterable object to an array, use spreads `...` instead of [`Array.from`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/from).

    ```ts
    const foo = document.querySelectorAll('.foo');

    // good
    const nodes = Array.from(foo);

    // best
    const nodes = [...foo];
    ```

  <a name="arrays--bracket-newline"></a><a name="4.6"></a>
  - [4.6](#arrays--bracket-newline) Use line breaks after open and before close array brackets if an array has multiple lines

    ```ts
    interface Person {
        id: string;
    }

    // bad
    const persons: Person[] = [{
      id: 1,
    }, {
      id: 2,
    }];

    // bad
    const numbers: number[] = [
      1, 2,
    ];

    // good
    const numbers: number[] = [1, 2, 3, 4];

    // good
    const persons: Person[] = [
      {
        id: 1,
      },
      {
        id: 2,
      }
    ];
    ```

**[⬆ back to top](#table-of-contents)**

## Destructuring

  <a name="destructuring--object"></a><a name="5.1"></a>
  - [5.1](#destructuring--object) Use object destructuring when accessing and using multiple properties of an object. eslint: [`prefer-destructuring`](https://eslint.org/docs/rules/prefer-destructuring)

    > Why? Destructuring saves you from creating temporary references for those properties.

    ```ts
    interface User {
        firstName: string;
        lastName: string;
    }

    // bad
    function getFullName(user: User): string {
      const firstName = user.firstName;
      const lastName = user.lastName;

      return `${firstName} ${lastName}`;
    }

    // good
    function getFullName(user: User): string {
      const { firstName, lastName } = user;
      return `${firstName} ${lastName}`;
    }
    
    // also good
    function getFullName({ firstName, lastName }: User): string {
      return `${firstName} ${lastName}`;
    }
    ```

  <a name="destructuring--array"></a><a name="5.2"></a>
  - [5.2](#destructuring--array) Use array destructuring. eslint: [`prefer-destructuring`](https://eslint.org/docs/rules/prefer-destructuring)

    ```ts
    const arr: number[] = [1, 2, 3, 4];

    // bad
    const first = arr[0];
    const second = arr[1];

    // good
    const [first, second] = arr;
    ```

**[⬆ back to top](#table-of-contents)**

## Strings

  <a name="strings--quotes"></a><a name="6.1"></a>
  - [6.1](#strings--quotes) Use single quotes `''` for strings. eslint: [`quotes`](https://eslint.org/docs/rules/quotes.html)

    ```ts
    // bad
    const name = "Capt. Janeway";

    // bad - template literals should contain interpolation or newlines
    const name = `Capt. Janeway`;

    // good
    const name = 'Capt. Janeway';
    ```

  <a name="strings--line-length"></a><a name="6.2"></a>
  - [6.2](#strings--line-length) Strings that cause the line to go over 100 characters should not be written across multiple lines using string concatenation.

    > Why? Broken strings are painful to work with and make code less searchable.

    ```javascript
    // bad
    const errorMessage = 'This is a super long error that was thrown because \
    of Batman. When you stop to think about how Batman had anything to do \
    with this, you would get nowhere \
    fast.';

    // bad
    const errorMessage = 'This is a super long error that was thrown because ' +
      'of Batman. When you stop to think about how Batman had anything to do ' +
      'with this, you would get nowhere fast.';

    // good
    const errorMessage = 'This is a super long error that was thrown because of Batman. When you stop to think about how Batman had anything to do with this, you would get nowhere fast.';
    
    // also good
    const errorMessage = `This is a super long error that was thrown because
      of Batman. When you stop to think about how Batman had anything to do
      with this, you would get nowhere fast.`;
    ```

  <a name="es6-template-literals"></a><a name="6.4"></a>
  - [6.3](#es6-template-literals) When programmatically building up strings, use template strings instead of concatenation. eslint: [`prefer-template`](https://eslint.org/docs/rules/prefer-template.html) [`template-curly-spacing`](https://eslint.org/docs/rules/template-curly-spacing)

    > Why? Template strings give you a readable, concise syntax with proper newlines and string interpolation features.

    ```ts
    // bad
    function sayHi(name: string): string {
      return 'How are you, ' + name + '?';
    }

    // bad
    function sayHi(name: string): string {
      return ['How are you, ', name, '?'].join();
    }

    // bad
    function sayHi(name: string): string {
      return `How are you, ${ name }?`;
    }

    // good
    function sayHi(name: string): string {
      return `How are you, ${name}?`;
    }
    ```

  <a name="strings--eval"></a><a name="6.5"></a>
  - [6.4](#strings--eval) Never use `eval()` on a string, it opens too many vulnerabilities. eslint: [`no-eval`](https://eslint.org/docs/rules/no-eval)

  <a name="strings--escaping"></a>
  - [6.5](#strings--escaping) Do not unnecessarily escape characters in strings. eslint: [`no-useless-escape`](https://eslint.org/docs/rules/no-useless-escape)

    > Why? Backslashes harm readability, thus they should only be present when necessary.

    ```ts
    // bad
    const foo = '\'this\' \i\s \"quoted\"';

    // good
    const foo = '\'this\' is "quoted"';
    const foo = `my name is '${name}'`;
    ```

**[⬆ back to top](#table-of-contents)**

## Functions

  <a name="functions--in-classes"></a><a name="7.1"></a>
  - [7.1](#functions--in-classes) For utilities / services functions, prefer to use classes with methods instead of standalone functions.

    > This is not because we prefer [OOP]("https://en.wikipedia.org/wiki/Object-oriented_programming") over [functional programming]("https://en.wikipedia.org/wiki/Functional_programming")
 But because we prefer functions inside their own well-named contexts, which can be better tested with mocks, spies, and stubs.
    
    ```ts
    // bad
    function foo(): void {
      // ...
    }

    // good
    class FooService {
        foo(): void {

        }
    }
    ```
 
   <a name="functions--arrow"></a><a name="7.2"></a>
   - [7.2](#functions--arrow) Use arrow functions instead of binds.
 
     > This makes intention clearer and less confusing
 
     ```ts
     // bad
     setTimeout(clearCache.bind(this), 5000);
 
     // good
     setTimeout(() => clearCache(), 5000);
     ```

   - With arrow functions, parameters can be passed directly in setTimeout.

     ```ts
     // bad
     setTimeout((width, height) => updateSize(width, height), 5000, width, height);
 
     // good
     setTimeout(() => updateSize(width, height), 5000);
     ```

 **[⬆ back to top](#table-of-contents)**

## Optionals

  <a name="optional--chaining"></a><a name="8.1"></a>
  - [8.1](#optional--chaining) Prefer optional chaining over repetitive nullish checks.
  
     > This avoids repeating ourselves and/or assigning intermediate results in temporary variables.

    ```ts
    // bad
    if (foo && foo.bar && foo.bar.baz) {
      // ...
    }

    // good
    if (foo?.bar?.baz) {
      // ...
    }
    ```

  <a name="optional--nullish-coalescing"></a><a name="8.2"></a>
  - [8.2](#optional--nullish-coalescing) Use the ?? operator to “fall back” to a default value when dealing with null or undefined.
  
    ```ts
    // bad
    const x = foo !== null && foo !== undefined ? foo : bar();

    // good
    const x = foo ?? bar();
    ```
    
  <a name="optional--defaults"></a><a name="8.3"></a>
  - [8.3](#optional--defaults) Prefer the ?? operator over the logical || to set fallback values.
  
     > This avoids common bugs, since || fails over "falsy" values such as zero or the empty string.

    ```ts
    // bad
    const volume = localStorage.volume || 0.5;
    // bug: if localStorage.volume is 0, it would fallback to 0.5

    // good
    const volume = localStorage.volume ?? 0.5;
    ```

**[⬆ back to top](#table-of-contents)**

## Async

  <a name="async--functions"></a><a name="9.1"></a>
  - [9.1](#async--functions) Prefer the async functions over promise chains.
  
     > async and await keywords enable asynchronous, promise-based behavior to be written in a cleaner style.

    ```ts
    // bad
    function foo() {
       return Promise.resolve(1).then(() => undefined)
    }

    // good
    async function foo() {
       await 1
    }
    ```
    
  <a name="async--no-callback"></a><a name="9.2"></a>
  - [9.2](#async--no-callbacks) Prefer async functions over Callbacks.
  
     > Promises save us from "callback hell in chaining".

    ```ts
    // bad
    function fetchData(url: string, callback): void { 
      makeNetworkCall(url, (response) => {
        if (response.success) {
          callback(response.data, null);
        } else {
          callback(null, response.error);
        }
      });
    }

    // good
    async function fetchData(url: string): Promise<Data> {
      const { success, data, error } = await makeNetworkCall(url);
      if (success) {
        resolve(data);
      } else {
        reject(error);
      }
    }
    ```
    
  <a name="async--implicit-wrap"></a><a name="9.3"></a>
  - [9.3](#async--implicit-wrap) Prefer implicit Promise wrap over creating new Promise object.
  
    ```ts
    // bad
    async function fetchData(url: string): Promise<Data> {
      return new Promise<Data>(async (resolve) => {
          generateData(url).then((data: Data) => {
            resolve(data);
          });
      });
    }
    
    // good
    async function fetchData(url: string): Promise<Data> {
      const data: Data = await generateData(url);
      // do something with data
      return data;
    }
    
    // in case we don't need an intermediate value, we can just return the unresolved Promise
    async function fetchData(url: string): Promise<Data> {
      return generateData(url);
    }
    ```

**[⬆ back to top](#table-of-contents)**