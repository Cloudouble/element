window.LiveElement = window.LiveElement || {}
window.LiveElement.Element = window.LiveElement.Element || Object.defineProperties({}, {
    version: {configurable: false, enumerable: true, writable: false, value: '1.4.0'}, 
    root: {configurable: false, enumerable: true, writable: true, value: null}, 
    prefix: {configurable: false, enumerable: true, writable: true, value: null}, 
    tags: {configurable: false, enumerable: true, writable: true, value: {}}, 
    elements: {configurable: false, enumerable: true, writable: true, value: {}}, 
    files: {configurable: false, enumerable: true, writable: true, value: {}}, 
    styles: {configurable: false, enumerable: true, writable: true, value: {}}, 
    templates: {configurable: false, enumerable: true, writable: true, value: {}}, 
    definitions: {configurable: false, enumerable: true, writable: true, value: {}}, 
    loadJSON: {configurable: false, enumerable: false, writable: false, value: function(url) {
        url = url.indexOf('https://') === 0 ? url : `${window.LiveElement.Element.root}/${url}`
        url = (url.lastIndexOf('.json') == (url.length - '.json'.length)) ? url : `${url}.json`
        return window.fetch(url).then(r => r.json())
    }}, 
    loadHTML: {configurable: false, enumerable: false, writable: false, value: function(url) {
        url = url.indexOf('https://') === 0 ? url : `${window.LiveElement.Element.root}/${url}`
        url = (url.lastIndexOf('.html') == (url.length - '.html'.length)) ? url : `${url}.html`
        return window.fetch(url).then(r => r.text())
    }}, 
    defineCustomElement: {configurable: false, enumerable: false, writable: false, value: function(tagName) {
        window.customElements.define(tagName, window.LiveElement.Element.definitions[tagName])
    }}, 
    registerCustomElement: {configurable: false, enumerable: false, writable: false, value: function(componentName, scriptText, tagName, styleDefinition, templateDefinition, baseClassName) {
        window.LiveElement.Element.elements[componentName] = Function('return ' + scriptText)()
        window.LiveElement.Element.tags[componentName] = tagName
        if (window.LiveElement.Element.templates[baseClassName]) {
            let componentNameTemplate = document.createElement('template')
            componentNameTemplate.innerHTML = templateDefinition
            componentNameTemplate.content.querySelectorAll('template').forEach(t => {
                var tName = t.getAttribute('name')
                if (tName) {
                    var tNameTemplate = window.LiveElement.Element.templates[tName]
                    if (tNameTemplate) {
                        let tNameNode = document.createElement('template')
                        tNameNode.innerHTML = tNameTemplate
                        tNameNode.content.querySelectorAll('slot:not([name])').forEach(unnamedSlot => {
                            unnamedSlot.setAttribute('name', tName)
                        })
                        t.replaceWith(tNameNode.content.cloneNode(true))
                    }
                }
            })
            if (componentNameTemplate.content.children && componentNameTemplate.content.children.length == 1) {
                var qsChild = Array.from(componentNameTemplate.content.children).filter(c => c.hasAttribute('container'))
                if (qsChild.length === 1) {
                    var qs = qsChild[0].getAttribute('container')
                    qsChild[0].removeAttribute('container')
                    if (qs) {
                        var baseTemplateNode = document.createElement('template') 
                        baseTemplateNode.innerHTML = window.LiveElement.Element.templates[baseClassName]
                        var baseContainer = baseTemplateNode.content.querySelector(qs)
                        if (baseContainer) {
                            baseContainer.innerHTML = ''
                            baseContainer.append(componentNameTemplate.content.cloneNode(true))
                            componentNameTemplate.innerHTML = baseTemplateNode.innerHTML
                        }
                    }
                }
            } 
            templateDefinition = componentNameTemplate.innerHTML
        }
        window.LiveElement.Element.templates[componentName] = templateDefinition

        var inheritedStyleList = []
        if (window.LiveElement.Element.styles[baseClassName]) {
            inheritedStyleList.push(window.LiveElement.Element.styles[baseClassName])
        }
        inheritedStyleList.push(`/** ${tagName} styles */\n\n` + styleDefinition)
        var stackedStyles = inheritedStyleList.join("\n\n\n")
        window.LiveElement.Element.styles[componentName] = stackedStyles
        window.LiveElement.Element.definitions[tagName] = class extends window.LiveElement.Element.elements[componentName] {
            constructor() {
                super()
                let shadowRoot = this.shadowRoot || this.attachShadow({mode: 'open'})
                shadowRoot.innerHTML = ''
                let styleNode = document.createElement('style')
                styleNode.innerHTML = window.LiveElement.Element.styles[componentName]
                shadowRoot.appendChild(styleNode)
                let templateNode = document.createElement('template')
                templateNode.innerHTML = window.LiveElement.Element.templates[componentName]
                shadowRoot.appendChild(templateNode.content.cloneNode(true))
            }
        }
        window.LiveElement.Element.defineCustomElement(tagName)
    }}, 
    activate: {configurable: false, enumerable: false, writable: false, value: function(prefix=null, namespace=null) {
        namespace = namespace || 'elements'
        window.LiveElement.Element.root = (window.LiveElement.Element.root || `${window.location.origin}${window.location.pathname}`.split('/').slice(0,-1).join('/') + '/' + namespace)
        window.LiveElement.Element.prefix = prefix ? prefix : (namespace=='elements'?'element':namespace.replace(/\//g, '-'))
        Reflect.ownKeys(window).filter(k => k.startsWith('HTML') && k.endsWith('Element') ).forEach(nativeClassName => {
            if (!window.LiveElement.Element.elements[nativeClassName]) {
                window.LiveElement.Element.elements[nativeClassName] = window.LiveElement.Element.base(window[nativeClassName])
            }
        })
    }}, 
    load: {configurable: false, enumerable: false, writable: false, value: function(elements=null, root=null, prefix=null, namespace=null) {
        window.LiveElement.Element.activate(prefix, namespace)
        return ((elements && typeof elements == 'object' && elements.constructor.name == 'Array') ? Promise.resolve(elements) : window.LiveElement.Element.loadJSON(elements ? String(elements) : 'index')).then(elements => {
            if (elements && typeof elements === 'object' && elements.constructor.name === 'Array') {
                var dependingClasses = {}
                var promises = []
                elements.forEach(componentName => {
                    promises.push(window.LiveElement.Element.loadHTML(componentName.toLowerCase()).then(definitionText => {
                        if (window.LiveElement.Element.prefix !== 'element') {
                            definitionText = definitionText.replace(/element-/g, `${window.LiveElement.Element.prefix}-`)
                        }
                        window.LiveElement.Element.files[componentName] = definitionText
                        var tagName = `${window.LiveElement.Element.prefix}-${componentName.toLowerCase()}`
                        var templateDefinition = definitionText.slice(definitionText.indexOf('<template>')+10, definitionText.lastIndexOf('</template>')).trim()
                        var styleDefinition = definitionText.slice(definitionText.indexOf('<style>')+7, definitionText.lastIndexOf('</style>')).trim()
                        var scriptText = definitionText.slice(definitionText.indexOf('<script>')+8, definitionText.lastIndexOf('</script>'))
                        scriptText = scriptText.replace(/\/\/.*[\n\r]+/, '').replace(/\/\*.*\*\//, '').trim().replace(/class .* extends/, 'class extends')
                        var baseClassRegExp = new RegExp(`class\\s+extends\\s+window\\.LiveElement\\.Element\\.elements\\.(?<baseclass>[A-Z][A-Za-z0-9]+)\\s+\\{`)
                        var baseclassMatches = scriptText.match(baseClassRegExp)
                        if (baseclassMatches && baseclassMatches.groups && baseclassMatches.groups.baseclass) {
                            if (window.LiveElement.Element.elements[baseclassMatches.groups.baseclass]) {
                                window.LiveElement.Element.registerCustomElement(componentName, scriptText, tagName, styleDefinition, templateDefinition, baseclassMatches.groups.baseclass)
                            } else {
                                dependingClasses[baseclassMatches.groups.baseclass] = dependingClasses[baseclassMatches.groups.baseclass] || []
                                dependingClasses[baseclassMatches.groups.baseclass].push([componentName, scriptText, tagName, styleDefinition, templateDefinition, baseclassMatches.groups.baseclass])
                            }
                        }
                    }))
                })
                return Promise.all(promises).then(() => {
                    var counter = 1000
                    while(counter && Object.keys(dependingClasses).length) {
                        Object.keys(dependingClasses).forEach(baseClassName => {
                            if (window.LiveElement.Element.elements[baseClassName]) {
                                dependingClasses[baseClassName].forEach(argsArray => {
                                    window.LiveElement.Element.registerCustomElement(...argsArray)
                                })
                                delete dependingClasses[baseClassName]
                            }
                        })
                        counter = counter - 1
                    }
                })
            } else {
                return Promise.resolve(null)
            }
        }).catch(err => {
            console.log(err)
        })
    }}, 
    base: {configurable: false, enumerable: false, writable: false, value: function(baseClass=undefined) {
        baseClass = baseClass || window.HTMLElement
        return class extends baseClass {
            constructor() {
                super()
                var $this = this
                ;($this.constructor.observedAttributes || []).forEach(attrName => {
                    var setterFunc = (typeof $this[attrName] === 'function') ? $this[attrName] : undefined
                    delete $this[attrName]
                    Object.defineProperty($this, attrName, {configurable: false, enumerable: true, set: (value) => {
                        if (setterFunc) {
                            value = setterFunc($this, value)
                        }
                        if (value !== undefined) {
                            if ($this.getAttribute(attrName) !== value) {
                                $this.setAttribute(attrName, value)
                            }
                        } else {
                            $this.removeAttribute(attrName)
                        }
                    }, get: () => $this.hasAttribute(attrName) ? $this.getAttribute(attrName) : undefined })
                })
                ;($this.constructor.js || []).forEach(src => {
                    var tag = document.querySelector(`script[src="${src}"]`)
                    if (!tag) {
                        tag = document.createElement('script')
                        tag.setAttribute('src', src)
                        document.body.append(tag)
                    }
                })
                ;($this.constructor.css || []).forEach(href => {
                    var tag = document.querySelector(`link[rel="stylesheet"][href="${href}"]`)
                    if (!tag) {
                        tag = document.createElement('link')
                        tag.setAttribute('rel', 'stylesheet')
                        tag.setAttribute('href', href)
                        document.head.append(tag)
                    }
                })
                $this.QueuedAttributes = {}
            }
            processQueuedAttributes() {
                var $this = this
                Object.keys($this.QueuedAttributes).filter(k => {
                    if ($this.QueuedAttributes[k].requires && typeof $this.QueuedAttributes[k].requires == 'function') {
                        return $this.QueuedAttributes[k].requires()
                    } else {
                        return true
                    }
                }).forEach(k => {
                    if ($this.QueuedAttributes[k].attribute && $this.QueuedAttributes[k].value) {
                        $this.setAttribute($this.QueuedAttributes[k].attribute, $this.QueuedAttributes[k].value)
                        if (typeof $this.QueuedAttributes[k].callback == 'function') {
                            $this.QueuedAttributes[k].callback()
                        }
                    }
                    delete $this.QueuedAttributes[k]
                })
                if (!Object.keys($this.QueuedAttributes).length) {
                    window.clearInterval($this.queuedAttributeInterval)
                }
            }
            addQueuedAttribute(attribute, value, requires, callback) {
                var $this = this
                $this.QueuedAttributes[`${Date.now()}-${parseInt(Math.random() * 1000000)}`] = {attribute: attribute, value: value, requires: requires, callback: callback}
                $this.queuedAttributeInterval = $this.queuedAttributeInterval || window.setInterval(function() {
                    $this.processQueuedAttributes()
                }, 1000)
            }
            static get observedAttributes() {
                return []
            }
            attributeChangedCallback(attrName, oldVal, newVal) {
                this[attrName] = newVal
            }
        }
    }} 
})
var undefinedElementHideStyleElement = document.createElement('style')
undefinedElementHideStyleElement.innerHTML = ':not(:defined) {display: none;}'
document.head.prepend(undefinedElementHideStyleElement)