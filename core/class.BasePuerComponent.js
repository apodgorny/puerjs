import Puer             from './class.Puer.js'
import PuerProps        from './class.PuerProps.js'
import PuerObject       from './class.PuerObject.js'
import PuerComponentSet from './class.PuerComponentSet.js'


class BasePuerComponent extends PuerObject {
	constructor(props, children) {
		super()
		this.owner    = Puer.owner
		this.id       = Puer.String.randomHex(4)
		this.element  = null
		this.parent   = null
		this.root     = null
		this.children = new PuerComponentSet (children, this._onChildrenChange, this)
		this.props    = new PuerProps        (props,    '_onPropChange',              this)

		this.events   = this.props.extractEvents(this.owner)
		this.classes  = this.props.pop('classes') || []

		this.isCustom  = false
		this._isActive = true

		this.elementCopy       = null
		this.parentElementCopy = null

		this._listenerMap = new WeakMap()
		
		// this._setupEventHandlers()
	}

	/********************** FRAMEWORK **********************/

	__render() {
		this._setupRoot()
		this._cascade('__render')
		this._setupElement()
		this._createText()
		this.addCssClass(... this.classes.map(c => Puer.dereference(c)))
		this._addEvents()
		this.onRender && this.onRender()
	}

	__rendered() {
		this._cascade('__rendered')
		this._applyProps()
	}

	__route(paths) {
		let hasMatch = false
		if (this.props.route) {
			const [routeName, routeValue] = this.props.route.split(':')
			for (const path of paths) {

				if (routeName == path.name) {

					hasMatch = true
					if (routeValue === path.value) {
						if (this.onActivate) {
							this.onActivate()
						} else {
							this.activate()
						}
						this._cascade('__route', [path.components])
					} else {
						if (this.onDeactivate) {
							this.onDeactivate()
						} else {
							this.deactivate()
						}
					}
				}
			}
		}
		if (!hasMatch) {
			this.activate()
			this._cascade('__route', [paths])
		}
	}

	__routeChange() {
		this.onRoute && this.onRoute(Puer.Router.path)
		this._cascade('__routeChange', [])
	}

	__ready() {
		this._cascade('__ready')
		this.onReady && this.onReady()
	}

	/******************** CHAIN GETTERS ********************/

	getImmediateChainDescendants(chainName) {
		let items = []
		if (this.isCustom) {
			if (chainName === this.root.chainName) {
				items.push(this.root)
			}
		} else {
			for (const child of this.children) {
				if (chainName === child.chainName) {
					items.push(child)
				}
			}
		}
		return items
	}

	getChainDescendants(chainName, firstCall=true) {
		let items = []
		if (!firstCall && this.hasPropInProto('chainName', chainName)) {
			items.push(this)
		} else if (this.isCustom) {
			if (chainName === this.root.chainName) {
				items.push(this.root)
			}
			let rootItems = this.root.getChainDescendants(chainName, false)
			if (rootItems) {
				items = items.concat(rootItems)
			}
		} else {
			if (this.children) {
				for (const child of this.children) {
					if (child) {
						const childItems = child.getChainDescendants(chainName, false)
						if (childItems) {
							items = items.concat(childItems)
						}
					}
				}
			} else {
				items = []
			}
		}
		return items
	}

	getChainAncestor(chainName, fistCall=true) {
		let item = fistCall ? this.parent : this
		if (!item) {
			return []
		} else if (item.hasPropInProto('chainName', chainName)) {
			return [item]
		}

		return !item.parent
			? []
			: item.parent.getChainAncestor(chainName, false)
	}

	getCustomParent() {
		if (this.isCustom) {
			return this
		} else {
			if (this.parent) {
				return this.parent.getCustomParent()
			}
			return null
		}
	}

	get $   () { return new PuerComponentSet([this]).$   }
	get $$  () { return new PuerComponentSet([this]).$$  }
	get $$$ () { return new PuerComponentSet([this]).$$$ }


	/*********************** PRIVATE ***********************/

	_getSubRoute() {
		let route = ''
		if (this.props.route && this._isActive) {
			route += this._cascade('_getSubRoute', [])
			route = this.props.route + route
		}
		return route
	}

	_getRoute() {}

	_onChildrenChange() {
		console.log(`${this.className}._onChildrenChange`)
		this._applyProps()
	}

	_onPropChange(prop) {
		if (this.className === 'PuerTagDiv' && prop === 'text') {
			debugger
			// console.log('props', this.props)
		}
		this._applyProp(prop)
	}

	_createText() {
		const value = this.props.text 
		if (value) {
			const component = text(value)

			const root = this.isCustom
				? this.root
				: this

			component.parent = root
			root.children.unshift(component)

			component.__render()

			if (this.element.firstChild) {
				this.element.insertBefore(component.element, this.element.firstChild)
			} else {
				this.element.appendChild(component.element)
			}

		}
	}

	_applyProps() {
		for (const prop in this.props) {
			this._applyProp(prop)
		}
	}

	_applyProp(prop) {
		if (this.element) {
			const value = Puer.dereference(this.props[prop])
			if (prop.startsWith('css')) {
				const cssProp = Puer.String.camelToLower(prop.replace(/^css/, ''))
				this.css(cssProp, value)
			} else if (prop === 'text') {
				const textElement = this.getTextElement()
				if (textElement) {
					textElement.nodeValue = value
				} else {
					const component = text(this.props.text)
					this.prepend(component)
				}
			} else if (typeof value !== 'function' || typeof value !== 'object') {
				if (Puer.isAttr(prop)) {
					this.attr(prop, value)
				}
			}
		}
	}

	_addEvents() {
		for (const name in this.events) {
			this._on(name, this.events[name])
		}
	}

	_on(name, f, options) {
		let targetComponent = this
		let _f = function(event) {
			event.targetComponent = targetComponent
			return f.call(this, event)
		}
		_f = _f.bind(this.getCustomParent())
		this._listenerMap.set(f, _f)
		this.element.addEventListener(name, _f, options)
	}

	_off(name, f, options) {
		if (this._listenerMap.has(listener)) {
			const _f = this._listenerMap.get(f)
			this.element.removeEventListener(name, _f, options)
			this._listenerMap.delete(f)
		}
	}

	_cascade(methodName, args=[]) {
		if (this.isCustom) {
			this.root[methodName](... args)
		} else {
			this.children.forEach(child => child[methodName](... args))
		}
	}

	_setupEventHandlers() {
		for (const prop of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
			if (typeof this[prop] === 'function' && prop.startsWith('on')) {
				const originalMethod = this[prop].bind(this)

				this[prop] = () => {
					if (Object.getPrototypeOf(this)[prop]) {
						Object.getPrototypeOf(this)[prop].call(this)
					}
					originalMethod()
				}
			}
		}
	}
	
	/*********************** CASTING ***********************/

	toString() {
		return `${this.className}(${this.props.toString()})`
	}

	/********************* PREDICATES *********************/

	isActive() {
		// this.props.route && console.log(this.className, this._isActive, this.props.route)
		if (!this._isActive) {
			return false
		}
		return this.parent ? this.parent.isActive() : true
	}

	/********************* DIRECTIVES *********************/

	activate() {
		if (!this._isActive && this.elementCopy) {
			this.element = this.elementCopy
			this.parentElementCopy.appendChild(this.element)
			this.elementCopy = null
			this._isActive    = true
		}
	}

	deactivate() {
		if (this._isActive) {
			this.elementCopy       = this.element
			this.parentElementCopy = this.element.parentNode
			this.element.remove()
			this.element  = null
			this._isActive = false
		}
	}

	route(path, relative=false) {
		if (path.startsWith('*')) {
			relative = true
			path     = path.substring(1)
		}
		if (this.props.route) {
			const [routeName, routeValue] = this.props.route.split(':')
			if (relative) {
				path = `${routeName}:${routeValue}[${path}]`
			}
		}
		this.parent.route(path, relative)
	}

	as(mixinClass) {
		const handler = {
			get: (target, prop, receiver) => {
				if (prop in mixinClass.prototype) {
					return mixinClass.prototype[prop].bind(target)
				}
				return Reflect.get(target, prop, receiver)
			}
		}
		return new Proxy(this, handler)
	}

	/********************* DOM METHODS *********************/

	findAll(selector) {
		return this.element.querySelectorAll(selector)
	}

	find(selector) {
		return this.element.querySelector(selector)
	}

	getTextElement() {
		return Array.from(this.element.childNodes).find(child => child.nodeType === 3)
	}

	addCssClass() {
		this.element.classList.add(... arguments)
	}

	removeCssClass() {
		this.element.classList.remove(... arguments)
	}

	toggleCssClass() {
		for (const c of arguments) {
			this.element.classList.toggle(c)
		}
	}

	hasCssClass(c) {
		return this.element.classList.contains(c)
	}

	css(prop, value) {
		let styles = {}
		if (value) {
			styles[prop] = value
		} else {
			styles = prop
		}
		for (let [property, value] of Object.entries(styles)) {
            this.element.style[property] = value
        }
	}

	attr(name, value=null) {
		if (value) {
			this.element.setAttribute(name, value)
		}
		return this.element.getAttribute(name)
	}

	append(component) {
		component.__render()
		component.__ready()
		component._applyProps()


		const root = this.isCustom
			? this.root
			: this

		component.parent = root
		root.children.push(component)

		this.element.appendChild(component.element)
	}

	prepend(component) {
		component.__render()
		component.__ready()
		component._applyProps()


		const root = this.isCustom
			? this.root
			: this

		component.parent = root
		root.children.unshift(component)

		if (this.element.firstChild) {
			this.element.insertBefore(component.element, this.element.firstChild)
		} else {
			this.element.appendChild(component.element)
		}
	}
	
	remove() {
		this.element.remove()
		if (this.parent.isCustom) {
			this.parent.root = null
		} else {
			const index = this.parent.children.indexOf(this)
			delete this.parent.children[index]
		}
	}

	removeChildren() {
		const root = this.isCustom
			? this.root
			: this

		while (root.children.length) {
			root.children[0].remove()
		}				
	}

	hide() {
		this.css({display: 'none'})
	}

	show(display='block') {
		this.css({display: display}) // TODO: restore previous display value
	}
}

BasePuerComponent.prototype.chainName = 'BasePuerComponent'

export default BasePuerComponent