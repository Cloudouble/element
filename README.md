# CloudoubleElement
Simple framework to make custom HTML elements easier to manage, includes simple inheritance of elements from any other element.

## Installation
* include the script tag for the element.js file, it creates a window.CloudoubleElement object
```
<script src="https://cdn.jsdelivr.net/gh/cloudouble/element@1.1.3/element.min.js"></script>
```
* to stop undefined elements displaying while ```element.js``` is being loaded, include the following anywhere in your stylesheet: 

```
:not(:defined) {
    display: none;
}
```

## Usage
* call ```window.Cloudouble.Element.load()``` - it returns a ```Promise``` that resolves once all custom elements are defined, they should become visible if not already
* the ```cloudouble/elements``` directory contains a set of simple example custom elements for your usage and edification

## Arguments for ```window.Cloudouble.Element.load(elements=null, root=null, namespace=null, prefix=null)```

**elements** => either an array of custom elements to load, or a string name of a ```.json``` file living in the same directory that your element definition ```.html``` files live, or null if you want to use the default ```index.json``` file in the elements definition directory as the list of available custom elements to build

**root** => a URL to the server where your definitions are stored, defaults to the directory of the current web page

**namespace** => a directory path to look for the definitions under the root URL, defaults to ```'cloudouble/element'```

**prefix** => the prefix to use in your HTML markup where you use your custom elements, defaults to the namespace with '/' replaced with '-'.  For example the default markup for the Button element is 

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

```
class Example extends window.CloudoubleElement.elements.Base {
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

}
```

## Further Reading 

[Web Components at MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

[Building Components at Google Developers](https://developers.google.com/web/fundamentals/web-components)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
