window.LiveElement = window.LiveElement || {}
window.LiveElement.Element = window.LiveElement.Element || Object.defineProperties({}, {
    version: {configurable: false, enumerable: true, writable: false, value: '1.7.6'}, 
    root: {configurable: false, enumerable: true, writable: true, value: null}, 
    prefix: {configurable: false, enumerable: true, writable: true, value: null}, 
    tags: {configurable: false, enumerable: true, writable: true, value: {}}, 
    elements: {configurable: false, enumerable: true, writable: true, value: {}}, 
    files: {configurable: false, enumerable: true, writable: true, value: {}}, 
    styles: {configurable: false, enumerable: true, writable: true, value: {}}, 
    templates: {configurable: false, enumerable: true, writable: true, value: {}}, 
    scripts: {configurable: false, enumerable: true, writable: true, value: {}}, 
    classes: {configurable: false, enumerable: true, writable: true, value: {}}, 
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
    getInheritance: {configurable: false, enumerable: false, writable: false, value: function(currentType) {
        var inheritance = []
        if (currentType) {
            inheritance.push(currentType._rdfs_label)
            var count = 1000
            while (count && currentType && currentType.__extends) { 
                inheritance.push(currentType.__extends)
                currentType = window.LiveElement.Element.elements[currentType.__extends] 
                count = count - 1
            }
        }
        return inheritance
    }}, 
    getTypeSpecificity: {configurable: false, enumerable: false, writable: false, value: function(typeList) {
        return typeList.filter(t => window.LiveElement.Element.elements[t]).sort((a, b) => {
            var bChain = window.LiveElement.Element.getInheritance(window.LiveElement.Element.elements[b])
            if (window.LiveElement.Element.elements[a].__extends == b) {
                return -1
            } else if (window.LiveElement.Element.elements[b].__extends == a) {
                return 1
            } else if ( [].concat(window.LiveElement.Element.elements[a].__type).includes('schema:Class') && [].concat(window.LiveElement.Element.elements[b].__type).includes('schema:DataType')  ) {
                return -1
            } else if ( [].concat(window.LiveElement.Element.elements[b].__type).includes('schema:Class') && [].concat(window.LiveElement.Element.elements[a].__type).includes('schema:DataType')  ) {
                return 1
            } else {
                return bChain.indexOf(a)
            }
        })
    }}, 
    defineCustomElement: {configurable: false, enumerable: false, writable: false, value: function(tagName) {
        if (window.LiveElement.Element.definitions[tagName].__extendsTag) {
            window.customElements.define(tagName, window.LiveElement.Element.definitions[tagName], {extends: window.LiveElement.Element.definitions[tagName].__extendsTag})
        } else {
            window.customElements.define(tagName, window.LiveElement.Element.definitions[tagName])
        }
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
        window.LiveElement.Element.scripts[componentName] = scriptText
        window.LiveElement.Element.templates[componentName] = templateDefinition
        var inheritedStyleList = []
        if (window.LiveElement.Element.styles[baseClassName]) {
            inheritedStyleList.push(window.LiveElement.Element.styles[baseClassName])
        }
        inheritedStyleList.push(`/** ${tagName} styles */\n\n` + styleDefinition)
        var stackedStyles = inheritedStyleList.join("\n\n\n")
        window.LiveElement.Element.styles[componentName] = stackedStyles
        window.LiveElement.Element.classes[tagName] = componentName
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
    build: {configurable: false, enumerable: false, writable: false, value: function() {
        var buildObject = {
            definitions: Object.assign({}, ...Object.entries(window.LiveElement.Element.definitions).map(entry => ({[entry[0]]: entry[1].toString()}))), 
            files: window.LiveElement.Element.files, 
            styles: window.LiveElement.Element.styles, 
            classes: window.LiveElement.Element.classes, 
            scripts: window.LiveElement.Element.scripts, 
            tags: window.LiveElement.Element.tags, 
            templates: window.LiveElement.Element.templates
        }
        return JSON.stringify(buildObject)
    }}, 
    wake: {configurable: false, enumerable: false, writable: false, value: function(buildObject) {
        if (buildObject && typeof buildObject === 'object') {
            ;(['classes', 'files', 'styles', 'scripts', 'tags', 'templates']).forEach(k => {
                if (buildObject[k] && typeof buildObject[k] == 'object') {
                    window.LiveElement.Element[k] = {...window.LiveElement.Element[k], ...buildObject[k]}
                }
            })
            if (buildObject.classes && typeof buildObject.classes == 'object' && buildObject.definitions && typeof buildObject.definitions == 'object') {
                window.LiveElement.Element.definitions = window.LiveElement.Element.definitions || {}
                Object.keys(buildObject.definitions).forEach(tagName => {
                    var componentName = window.LiveElement.Element.classes[tagName]
                    window.LiveElement.Element.elements[componentName] = Function('return ' + window.LiveElement.Element.scripts[componentName])()
                    window.LiveElement.Element.definitions[tagName] = Function(`var componentName = "${componentName}"; return ${buildObject.definitions[tagName]}`)()
                    window.LiveElement.Element.defineCustomElement(tagName)
                })
            }
            return true
        } else {
            return false
        }
    }}, 
    activate: {configurable: false, enumerable: false, writable: false, value: function(root=null, prefix=null, namespace=null) {
        namespace = namespace || 'elements'
        window.LiveElement.Element.root = (window.LiveElement.Element.root || `${window.location.origin}${window.location.pathname}`.split('/').slice(0,-1).join('/') + '/' + namespace)
        window.LiveElement.Element.prefix = prefix ? prefix : (namespace=='elements'?'element':namespace.replace(/\//g, '-'))
        Reflect.ownKeys(window).filter(k => k.startsWith('HTML') && k.endsWith('Element') ).forEach(nativeClassName => {
            if (!window.LiveElement.Element.elements[nativeClassName]) {
                if (nativeClassName == 'HTMLImageElement') {
                    window.LiveElement.Element.elements[nativeClassName] = window.LiveElement.Element.base(window['Image'])
                } else if (nativeClassName == 'HTMLAudioElement') {
                    window.LiveElement.Element.elements[nativeClassName] = window.LiveElement.Element.base(window['Audio'])
                } else {
                    window.LiveElement.Element.elements[nativeClassName] = window.LiveElement.Element.base(window[nativeClassName])
                }
            }
        })
    }}, 
    load: {configurable: false, enumerable: false, writable: false, value: function(elements=null, root=null, prefix=null, namespace=null) {
        window.LiveElement.Element.activate(root, prefix, namespace)
        if (elements && typeof elements === 'object' &&  (['definitions', 'classes', 'files', 'styles', 'scripts', 'tags', 'templates']).every(k => elements[k])) {
            return Promise.resolve(window.LiveElement.Element.wake(elements))
        } else {
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
                } else if (elements && typeof elements === 'object' &&  (['definitions', 'classes', 'files', 'styles', 'scripts', 'tags', 'templates']).every(k => elements[k])) {
                    return Promise.resolve(window.LiveElement.Element.wake(elements))
                }else {
                    return Promise.resolve(null)
                }
            }).catch(err => {
                console.log(err)
            })
        }
    }}, 
    base: {configurable: false, enumerable: false, writable: false, value: function(baseClass=undefined) {
        baseClass = baseClass || window.HTMLElement
        return class extends baseClass {
            constructor() {
                super()
                var $this = this
                Object.defineProperty($this, '__dict', {configurable: false, enumerable: false, value: {}})
                ;($this.constructor.__allProperties || []).forEach(attrName => {
                    var canonicalAttrName = attrName.toLowerCase()
                    var setterFunc = (typeof $this[attrName] === 'function') ? $this[attrName] : undefined
                    delete $this[attrName]
                    Object.defineProperty($this, attrName, {configurable: false, enumerable: true, set: (value) => {
                        if (setterFunc) {
                            $this.__dict[canonicalAttrName] = setterFunc($this, value)
                        } else {
                            $this.__dict[canonicalAttrName] = value
                        }
                    }, get: () => $this.__dict[canonicalAttrName] })
                    if (canonicalAttrName != attrName) {
                        Object.defineProperty($this, canonicalAttrName, {configurable: false, enumerable: false, set: (value) => {
                            $this[attrName] = value
                        }, get: () => $this[attrName] })
                    }
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
                $this.__queuedAttributes = {}
            }
            processQueuedAttributes() {
                var $this = this
                Object.keys($this.__queuedAttributes).filter(k => {
                    if ($this.__queuedAttributes[k].requires && typeof $this.__queuedAttributes[k].requires == 'function') {
                        return $this.__queuedAttributes[k].requires()
                    } else {
                        return true
                    }
                }).forEach(k => {
                    if ($this.__queuedAttributes[k].attribute && $this.__queuedAttributes[k].value) {
                        $this.setAttribute($this.__queuedAttributes[k].attribute, $this.__queuedAttributes[k].value)
                        if (typeof $this.__queuedAttributes[k].callback == 'function') {
                            $this.__queuedAttributes[k].callback()
                        }
                    }
                    delete $this.__queuedAttributes[k]
                })
                if (!Object.keys($this.__queuedAttributes).length) {
                    window.clearInterval($this.__queuedAttributeInterval)
                }
            }
            addQueuedAttribute(attribute, value, requires, callback) {
                var $this = this
                $this.__queuedAttributes[`${Date.now()}-${parseInt(Math.random() * 1000000)}`] = {attribute: attribute, value: value, requires: requires, callback: callback}
                $this.__queuedAttributeInterval = $this.__queuedAttributeInterval || window.setInterval(function() {
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
    }}, 
    render: {configurable: false, enumerable: false, writable: false, value: function(element, asClass, renderFunction=true, style=true, template=true) {
        if (element && typeof element == 'object' && element.constructor._rdfs_label) {
            var useStyle = style && typeof style == 'string' ? (window.LiveElement.Element.styles[style] ? window.LiveElement.Element.styles[style] : style) : undefined
            useStyle = useStyle || (style && typeof style == 'boolean' && asClass && window.LiveElement.Element.styles[asClass] ? window.LiveElement.Element.styles[asClass] : undefined)
            useStyle = style === false ? undefined : useStyle
            if (useStyle) {
                var styleNode = document.createElement('style')
                styleNode.innerHTML = useStyle
                var existingStyleNode = element.shadowRoot.querySelector('style')
                existingStyleNode.after(styleNode)
            }
            var useTemplate = template && typeof template == 'string' ? (window.LiveElement.Element.templates[template] ? window.LiveElement.Element.templates[template] : template) : undefined
            useTemplate = useTemplate || (template && typeof template == 'boolean' && asClass && window.LiveElement.Element.templates[asClass] ? window.LiveElement.Element.templates[asClass] : undefined)
            useTemplate = template === false ? undefined : useTemplate
            if (useTemplate) {
                var mainStyleNode = element.shadowRoot.querySelector('style')
                var renderStyleNode = element.shadowRoot.querySelector('style + style')
                mainStyleNode = mainStyleNode ? mainStyleNode.cloneNode(true) : undefined
                renderStyleNode = renderStyleNode ? renderStyleNode.cloneNode(true) : undefined
                element.shadowRoot.innerHTML = useTemplate
                if (renderStyleNode) {
                    element.shadowRoot.prepend(renderStyleNode)
                }
                if (mainStyleNode) {
                    element.shadowRoot.prepend(mainStyleNode)
                }
            }
            var useFunction = renderFunction && typeof renderFunction == 'function' ? renderFunction : undefined
            useFunction = useFunction || (renderFunction && typeof renderFunction == 'boolean' && asClass && window.LiveElement.Element.elements[asClass] && typeof window.LiveElement.Element.elements[asClass].__render == 'function' ? window.LiveElement.Element.elements[asClass].__render : undefined)
            useFunction = renderFunction === false ? undefined : useFunction
            if (useFunction && typeof useFunction == 'function') {
                useFunction(element, asClass, style, template)
            }
        }
    }}
})
var undefinedElementHideStyleElement = document.createElement('style')
undefinedElementHideStyleElement.innerHTML = ':not(:defined) {display: none;}'
document.head.prepend(undefinedElementHideStyleElement)