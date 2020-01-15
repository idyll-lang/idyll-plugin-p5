# Idyll P5JS Plugin

This plugin enables you to embed P5 sketches in Idyll documents.

## Installation

```
$ npm install --save-dev idyll-plugin-p5
```

Add it to your idyll configuration in package.json:

```json
"idyll": {
  "compiler": {
    "postProcessors": ["idyll-plugin-p5"]
  }
}
```

## Example

````javascript
[var name:"myVar" value:10 /]
[var name:"myVar2" value:60 /]

[Range value:myVar min:0 max:100 /]
[Range value:myVar2 min:0 max:100 /]

```exec:p5
function setup() {
}
function draw() {
  p.clear()
  p.background(100);  
  p.ellipse(p.width/2, p.height/2, _myVar2_, _myVar_);
}
```
````

This is how the output would look: