# CloudoubleElement
Simple framework to make custom HTML elements easier to manage, includes simple inheritance of elements from any other element.

## Installation
* include the script tag for the element.js file, it creates a window.Cloudouble.Element object
```
<script src="https://cdn.jsdelivr.net/gh/cloudouble/element@1.3.0/element.min.js"></script>
```
* the following is automatically injected into the HEAD of your page to stop undefined elements displaying while ```element.js``` is being loaded: 

```
:not(:defined) {
    display: none;
}
```

## Usage
* call ```window.Cloudouble.Element.load()``` - it returns a ```Promise``` that resolves once all custom elements are defined, they should become visible if not already
* the ```cloudouble/elements``` directory contains a set of simple example custom elements for your usage and edification

## Arguments for ```window.Cloudouble.Element.load(elements=null, root=null, prefix=null, namespace=null)```

**elements** => either an array of custom elements to load, or a string name of a ```.json``` file living in the same directory that your element definition ```.html``` files live, or null if you want to use the default ```index.json``` file in the elements definition directory as the list of available custom elements to build

**root** => a URL to the server where your definitions are stored, defaults to the directory of the current web page

**prefix** => the prefix to use in your HTML markup where you use your custom elements, defaults to the namespace with '/' replaced with '-'.

**namespace** => a directory path to look for the definitions under the root URL, defaults to ```'cloudouble/element'```


Example markup for the Button element:


```
<cloudouble-element-button></cloudouble-element-button>
```

set the prefix (or namespace) to  'test' and make it:

```
<test-button></test-button>
```

 
 ## Documentation for creating custom elements

* create a single HTML file named after the element (without any prefix) and put it in the ```${window.Cloudouble.Element.root}/${window.Cloudouble.Element.namespace}``` directory
* ensure that file has one each of ```style```, ```template``` and ```script``` tags
* the script has to be a clean class definition like (for an custom 'example' element)
* you can inherit from other Elements, simply use their class name instead of ```Base``` as below
* ancestor elements pass down their stylesheets to their children, with child stylesheets overriding their parents by being placed after
* child elements can optionally include their parent's HTML template by including ```<!-- ELEMENT BASE -->'``` code anywhere in the child's HTML definition. The parent classes
HTML will be injected at that point (can be done multiple times). Any unnamed ```slot``` elements in the parent HTML will have a ```name``` attribute set to the lowercase name of 
the base class.

```
class Example extends window.Cloudouble.Element.elements.Base {
    constructor() {
        //constructor is optional, if you have it make sure you include super() first
        super()
        //...
    }
    
    static get css() {
        // put the href URIs for any external stylesheets you need included into the head of the containing page here
        // stylesheets with the same URI will only be included once
        return (super.css || []).concat()
    }
    
    static get js() {
        // put the src URIs for any external scripts you need included at the bottom of body of the containing page here
        // scripts with the same URI will only be included and executed once
        return (super.js || []).concat()
    }
    
    static get observedAttributes() {
        // put any custom attributes that you want to react to markeup changes in the .concat part of this...
        return (super.observedAttributes || []).concat('name')
    }
    
    name($this, value) {
        //for each custom attribute you can optionally define complex behaviour or validation whenever to value updates
        //$this is the parent custom element itself
        //value is the raw string value of the updated attribute
        //return the value you want it to actually be set to, and also do anything else you want along the way
        //this below ensures that any "name" attributes are always lowercase letters, digits or -, defaults to innerText
        return (value ? value : $this.innerText).replace('[^a-zA-Z0-9\-]+', '-').toLowerCase()
    }
    
    dependentattribute($this, value) {
        // if setting this value will break unless another condition is already existing, you can add it to the QueuedAttributes list
        // once the test coding function returns true, the attribute will be set to the given value
        // $this.addQueuedAttribute(attributename, value-to-be-set-wnen-condition-satisfied, function returning true when condition met, callback to execute once the attribute value is set)
        var cb = function() { console.log('dependentattribute has been set to ', value) }
        $this.addQueuedAttribute('dependentattribute', value, function() { 
            try {
                return "if some environmental condition is satisfied" ? true : false
            } catch(e) {
                return false
            }
        }, cb)
        return value
    }

}
```

## Further Reading 

[Web Components at MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

[Building Components at Google Developers](https://developers.google.com/web/fundamentals/web-components)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
