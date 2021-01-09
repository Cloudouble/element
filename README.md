# Element
Use, extend, inherit and author custom HTML components with simple definition files. Part of 
the [live-element](https://live-element.net) framework.

## Installation
* include the script tag for the element.js file, it creates a window.Element object
```
<script src="https://cdn.jsdelivr.net/gh/cloudouble/element@1.6.0/element.min.js"></script>
```
* the following is automatically prepended to the HEAD of your page to stop undefined elements displaying while ```element.js``` is being loaded: 

```
:not(:defined) {
    display: none;
}
```

* If you wish to show undefined elements, place the following anywhere in your stylesheets:
```
:not(:defined) {
    display: unset;
}
```


## Usage
* call ```window.LiveElement.Element.load()``` - it returns a ```Promise``` that resolves once all custom elements are defined, they should become visible if not already
* the ```elements``` directory contains a set of simple example custom elements for your usage and edification

## Arguments for ```window.LiveElement.Element.load(elements=null, root=null, prefix=null, namespace=null)```

**elements** => either an array of custom elements to load, or a string name of a ```.json``` file living in the same 
directory that your element definition ```.html``` files live, or null if you want to use the 
default ```index.json``` file in the elements definition directory as the list of available custom elements to build. 
The JSON file may be a build file produced by the ```window.LiveElement.Element.build()``` method - this is the recommended 
practice for production applications to reduce network calls and speed up the initial load.

**root** => a URL to the server where your definitions are stored, defaults to the directory of the current web page

**prefix** => the prefix to use in your HTML markup where you use your custom elements, defaults to the namespace with '/' replaced with '-'.

**namespace** => a directory path to look for the definitions under the root URL, defaults to ```'element'```


Example markup for the Button element:


```
<element-button icon="home"></element-button>
```

set the prefix (or namespace) to  'test' and make it:

```
<test-button></test-button>
```


## Properties of ```window.LiveElement.Element```
* ```classes``` => a map of loaded tag names to their class names
* ```definitions``` => a map of tag names to their actual live definition classes as used by ```window.customElements.define```, these
definition classes are a wrapper over the classes as mapped in the ```classes``` property
* ```elements``` => a map of all class names with their live classes
* ```files``` => a maps of class names to the text content of their source definition files
* ```prefix``` => the last used prefix loaded elements were defined with
* ```root``` => the last used root path elements were loaded from
* ```scripts``` => a map of class names to the text content of the script part of their source definition
* ```styles``` => a map of class names to the compiled text content of their style part of their source definition
* ```tags``` => a map of definition class names to their tag name
* ```templates``` => a map of class names to the compiled text content of the HTML part of the source definition
* ```version``` => the current Element version


## Methods of ```window.LiveElement.Element```
* ```activate``` => called automatically as part of the ```load``` process to set the ```root``` and ```prefix``` properties and also 
generate all wrapper classes on native element types ready for extending by custom elements
* ```base``` => used during the ```load``` process and returns a wrapper class of the given base class name
* ```build``` => call manually to generate in the browser console a JSON-encoded string that you can save into a pre-built load file. See 
below for details on how to use Element in develop vs production.
* ```defineCustomElement``` => used as part of the ```load``` process and activates the given tag name by calling ```window.customElements.define``` with the already-existing wrapper
class. 
* ```getInheritance``` => pass it a Element class and get an array of it's inheritance chain, ordered from the current class back to 'Schema'
* ```load``` => the only method you really need to know about for basic use. See the usage section above to learn about it.
* ```loadHTML``` => takes a URL and returns a ```Promise``` which resolves to the text content of that URL
* ```loadJSON``` => takes a URL and returns a ```Promise``` which resolves to the live object content of that URL if it is a valid JSON file
* ```registerCustomElement``` => used as part of the ```load``` process to build the various parts that go into the custom element definition
* ```wake``` => automatically called by the ```load``` process if a build object is detected as the input. It takes a build object and 
registers all the pre-defined elements there ready for use. You would only call it directly is you had a customized build object to load and 
wanted to override the default loading process.

 
 ## Documentation for creating custom elements

* create a single HTML file named after the element (without any prefix) and put it in the ```${window.LiveElement.Element.root}/${window.LiveElement.Element.namespace}``` directory
* ensure that file has one each of ```style```, ```template``` and ```script``` tags
* the script has to be a clean class definition like (for an custom 'example' element)
* you can inherit from other Elements, simply use their class name instead of ```HTMLElement``` as below
* you can specify which native element to ultimately extend from by using it's class name instead of ```HTMLElement``` as below  
* ancestor elements pass down their stylesheets to their children, with child stylesheets overriding their parents by being placed after
* child elements can optionally include their parent's HTML template by including ```<template name="Parent"></template>``` code anywhere in the child's HTML definition. 
The HTML template of the parent class named in the ```name``` attribute will be injected at that point (can be done multiple times). 
Any unnamed ```slot``` elements in the parent HTML will have a ```name``` attribute set to the name of the parent class.
* child elements can optionally place themselves within any arbitary point within their parent classes HTML template by: ensuring 
the child template has one root node directly under the ```template``` node, and give that root node a ```template``` attribute with a 
value being a querySelector pointing to a spot within the parent class' HTML. The content of the child template will be inserted as the 
innerHTML of that node within the parent template.

Examples: 

The following will replace the ```template[name=Link]``` node with the content of the ```Link``` parent class template.

```
<template>
    <label><template name="Link"></template><slot></slot></label>
</template>
```

The following will place the child template code as the innerHTML of the first ```a``` tag in the parent class' template.

```
<template>
    <label template="a"><slot></slot></label>
</template>
```


```
class Example extends window.LiveElement.Element.elements.HTMLElement {
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


## Development lifecycle usage
* create a directory called ```elements``` and put any custom element definition files in there
* create a ```index.json``` file containing only an array of their custom element class names. See the example ```index.json``` for a guide.
* in your application script after ```element.js``` is loaded, call ```window.LiveElement.Element.load()``` to load with default arguments, 
which will read the list of elements to load from your ```index.json``` file
* develop your app until you are happy with all of your custom elements
* **optional, and only useful for larger apps with dozens of custom elements**: (once) open the browser console and 
call ```window.LiveElement.Element.build()```. Copy the output and paste into your ```index.json```, completely overwriting it. Future app
loads will only make one netwwork call to load all custom elements from the ```index.json``` file and will ignore the individual definition files. No change to your 
application code is necessary to switch back and forth between development mode and production mode, just switch out your ```index.json``` file.
 

## Further Reading 

[live-element framework](https://live-element.net)

[Web Components at MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

[Building Components at Google Developers](https://developers.google.com/web/fundamentals/web-components)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
