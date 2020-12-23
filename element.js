/* global fetch customElements HTMLElement CustomEvent */
window.Cloudouble.Element = window.Cloudouble.Element || Object.defineProperties({}, {
    version: {configurable: false, enumerable: true, writable: false, value: '1.3.0'}, 
    root: {configurable: false, enumerable: true, writable: true, value: null}, 
    prefix: {configurable: false, enumerable: true, writable: true, value: null}, 
    tags: {configurable: false, enumerable: true, writable: true, value: {}}, 
    elements: {configurable: false, enumerable: true, writable: true, value: {}}, 
    templates: {configurable: false, enumerable: false, writable: true, value: {}}, 
    loadJSON: {configurable: false, enumerable: false, writable: false, value: function(url) {
        url = url.indexOf('https://') === 0 ? url : `${window.Cloudouble.Element.root}/${url}`
        url = (url.lastIndexOf('.json') == (url.length - '.json'.length)) ? url : `${url}.json`
        return fetch(url).then(r => r.json())
    }}, 
    loadHTML: {configurable: false, enumerable: false, writable: false, value: function(url) {
        url = url.indexOf('https://') === 0 ? url : `${window.Cloudouble.Element.root}/${url}`
        url = (url.lastIndexOf('.html') == (url.length - '.html'.length)) ? url : `${url}.html`
        return fetch(url).then(r => r.text())
    }}, 
    load: {configurable: false, enumerable: false, writable: false, value: function(elements=null, root=null, prefix=null, namespace=null) {
        namespace = namespace || 'cloudouble/element'
        window.Cloudouble.Element.root = root ? String(root) : (window.Cloudouble.Element.root || `${window.location.origin}${window.location.pathname}`.split('/').slice(0,-1).join('/') + '/' + namespace)
        window.Cloudouble.Element.prefix = prefix ? prefix : namespace.replace(/\//g, '-')
        window.Cloudouble.Element.elements.Base = window.Cloudouble.Element.Base;
        return ((elements && typeof elements == 'object' && elements.constructor.name == 'Array') ? Promise.resolve(elements) : window.Cloudouble.Element.loadJSON(elements ? String(elements) : 'index')).then(elements => {
            if (elements && typeof elements === 'object' && elements.constructor.name === 'Array') {
                var dependingClasses = {}
                var promises = []
                var registerCustomComponent = function(componentClassName, scriptText, tagName, styleDefinition, templateDefinition, baseClassName) {
                    window.Cloudouble.Element.elements[componentClassName] = Function('return ' + scriptText)()
                    window.Cloudouble.Element.tags[componentClassName] = tagName
                    customElements.define(tagName, class extends window.Cloudouble.Element.elements[componentClassName] {
                        constructor() {
                            super()
                            let shadowRoot = this.shadowRoot || this.attachShadow({mode: 'open'})
                            shadowRoot.innerHTML = ''
                            let styleNode = document.createElement('style')
                            let inheritedStyleList = []
                            if (window.Cloudouble.Element.tags[baseClassName]) {
                                let baseElementInstance = document.createElement(window.Cloudouble.Element.tags[baseClassName])
                                let baseClassStyleDefinition = baseElementInstance.shadowRoot.querySelector('style').innerHTML
                                inheritedStyleList.push(baseClassStyleDefinition)
                                if (templateDefinition.indexOf('<!-- ELEMENT BASE -->') > -1) {
                                    baseElementInstance.shadowRoot.querySelector('style').remove()
                                    baseElementInstance.shadowRoot.querySelector('slot:not([name])').setAttribute('name', baseClassName.toLowerCase())
                                    templateDefinition = templateDefinition.replace(new RegExp('<!-- ELEMENT BASE -->', 'g'), baseElementInstance.shadowRoot.innerHTML)
                                }
                            }
                            inheritedStyleList.push(`/** ${tagName} styles */\n\n` + styleDefinition)
                            styleNode.innerHTML = inheritedStyleList.join("\n\n\n")
                            shadowRoot.appendChild(styleNode)
                            let templateNode = document.createElement('template')
                            templateNode.innerHTML = templateDefinition
                            shadowRoot.appendChild(templateNode.content.cloneNode(true))
                        }
                    })
                }
                elements.forEach(componentName => {
                    promises.push(window.Cloudouble.Element.loadHTML(componentName.toLowerCase()).then(definitionText => {
                        if (window.Cloudouble.Element.prefix !== 'cloudouble-element') {
                            definitionText = definitionText.replace(/cloudouble-element-/g, `${window.Cloudouble.Element.prefix}-`)
                        }
                        window.Cloudouble.Element.templates[componentName] = definitionText
                        var tagName = `${window.Cloudouble.Element.prefix}-${componentName.toLowerCase()}`
                        var templateDefinition = definitionText.slice(definitionText.indexOf('<template>')+10, definitionText.lastIndexOf('</template>')).trim()
                        var styleDefinition = definitionText.slice(definitionText.indexOf('<style>')+7, definitionText.lastIndexOf('</style>')).trim()
                        var scriptText = definitionText.slice(definitionText.indexOf('<script>')+8, definitionText.lastIndexOf('</script>'))
                        scriptText = scriptText.replace(/\/\/.*[\n\r]+/, '').replace(/\/\*.*\*\//, '').trim().replace(/class .* extends/, 'class extends')
                        var componentClassName = `${componentName[0].toUpperCase()}${componentName.slice(1).toLowerCase()}`
                        var baseClassRegExp = new RegExp(`class\\s+extends\\s+window\\.Cloudouble\\.Element\\.elements\\.(?<baseclass>[A-Z][a-z0-9]+)\\s+\\{`)
                        var baseclassMatches = scriptText.match(baseClassRegExp)
                        if (baseclassMatches && baseclassMatches.groups && baseclassMatches.groups.baseclass) {
                            if (window.Cloudouble.Element.elements[baseclassMatches.groups.baseclass]) {
                                registerCustomComponent(componentClassName, scriptText, tagName, styleDefinition, templateDefinition, baseclassMatches.groups.baseclass)
                            } else {
                                dependingClasses[baseclassMatches.groups.baseclass] = dependingClasses[baseclassMatches.groups.baseclass] || []
                                dependingClasses[baseclassMatches.groups.baseclass].push([componentClassName, scriptText, tagName, styleDefinition, templateDefinition, baseclassMatches.groups.baseclass])
                            }
                        }
                    }))
                })
                return Promise.all(promises).then(() => {
                    var counter = 1000
                    while(counter && Object.keys(dependingClasses).length) {
                        Object.keys(dependingClasses).forEach(baseClassName => {
                            if (window.Cloudouble.Element.elements[baseClassName]) {
                                dependingClasses[baseClassName].forEach(argsArray => {
                                    registerCustomComponent(...argsArray)
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
    Base: {configurable: false, enumerable: true, writable: false, value: class extends HTMLElement {
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
        setupUpdatePropertyPropagation() {
            var $this = this
            Array.from($this.shadowRoot.querySelectorAll('[updateproperty]')).forEach(updatepropertyElement => {
                updatepropertyElement.addEventListener('change', event => {
                    var updateproperty = updatepropertyElement.getAttribute('updateproperty')
                    $this.setAttribute(updateproperty, updatepropertyElement.value)
                    $this.dispatchEvent(new CustomEvent(`${updateproperty}-change`, {detail: {[updateproperty]: updatepropertyElement.value}}))
                })
            })
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
    }}
})
var undefinedElementHideStyleElement = document.createElement('style')
undefinedElementHideStyleElement.innerHTML = ':not(:defined) {display: none;}'
document.head.prepend(undefinedElementHideStyleElement)