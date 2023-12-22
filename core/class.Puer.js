import PuerComponent      from './class.PuerComponent.js'
import PuerRouter         from './class.PuerRouter.js'
import PuerEvents         from './class.PuerEvents.js'
import PuerError          from './class.PuerError.js'
import PuerHtmlElement    from './class.PuerHtmlElement.js'
import PuerTextElement    from './class.PuerTextElement.js'

import StringMethods      from '../library/class.StringMethods.js'
import ObjectMethods      from '../library/class.ObjectMethods.js'
import DateMethods        from '../library/class.DateMethods.js'
import SetMethods         from '../library/class.SetMethods.js'
import Request            from '../library/class.Request.js'
import DataSet            from '../library/class.DataSet.js'
import DataStore          from '../library/class.DataStore.js'
import DataSource         from '../library/class.DataSource.js'
import Reference          from '../library/class.Reference.js'
import RouteRoot          from '../library/class.Route.js'


class PuerConstructor {
	static instance = null

	constructor() {
		if (!PuerConstructor.instance) {
			this.app
			this.owner
			this.path
			this.appPath
			this.isRouting = true
			this._cssUrls  = new Set()
			this._cssCount = 0
			this.components = {}
			PuerConstructor.instance = this

			this._init()
		}
		return PuerConstructor.instance
	}

	/********************** PRIVATE **********************/

	_init() {
		this._setTimezoneCookie()
		this._classToType = {}
		'Boolean Number String Function Array Date RegExp Object Error Symbol Undefined Null'.split(' ')
			.forEach(name => {
				this._classToType['[object ' + name + ']'] = name.toLowerCase()
			})
		this.Error  = PuerError
		this.Event  = {}
		this.Events = new PuerEvents(this)
	}

	_setTimezoneCookie() {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		document.cookie = 'timezone=' + timezone + ';path=/;max-age=31536000'; // one year
	}

	_onCssLoad() {
		this._cssCount --
		if (this._cssCount == 0) {
			this.app.__ready()
		}
	}

	_loadCss(componentUrl) {
		if (componentUrl) {
			let cssUrl = componentUrl.includes('puerjs') 
				? this.path + componentUrl.split(this.path)[1].replace(/\bjs\b/g, 'css')
				: componentUrl.replace(/\bjs\b/g, 'css')

			if (!this._cssUrls.has(cssUrl)) {
				let styleElement = document.createElement('link')
				styleElement.setAttribute('type', 'text/css')
				styleElement.setAttribute('rel', 'stylesheet')
				styleElement.setAttribute('href', cssUrl)
				styleElement.addEventListener('load',  this._onCssLoad.bind(this), false)
				styleElement.addEventListener('error', this._onCssLoad.bind(this), false)
				document.head.appendChild(styleElement)
				this._cssUrls.add(cssUrl)
				this._cssCount ++
			}
		}
	}

	_toClassesArray(value) {
		if (value) {
			if (typeof value == 'function') {
				value = [value]
			} else {
				value = value.split(' ')
			}
		} else {
			value = []
		}
		return value
	}

	_getConstructorArgs(args) {
		let [ cssClass,  props,    children ] = this.arganize(args,
			[ 'string',  'object', 'array', ],
			[ '',        {},       [],      ]
		)
		if (props.text && this.isString(props.text)) {
			props.text = this.String.decodeHtmlEntities(props.text)
		}
		props.classes = this._toClassesArray(props.classes)
		cssClass      = this._toClassesArray(cssClass)
		props.classes = props.classes.concat(cssClass)
		return [props, children]
	}

	_defineGetter(name, f) {
		Object.defineProperty(this, name, {
			get: function() {
				// console.log('start referencing')
				return f
			}
		})
	}

	_defineText() {
		let className = 'PuerTagText'
		Object.defineProperty(PuerTextElement, 'name', { value: className })
		PuerTextElement.prototype.chainName = 'text'

		this._defineGetter('text', (text) => {
			return new PuerTextElement(text)
		})
	}

	_defineTag(name) {
		let className = 'PuerTag' + StringMethods.capitalize(name)
		eval(
			`class ${className} extends PuerHtmlElement {};` +
			`window.${className} = ${className}`
		)
		Object.defineProperty(window[className], 'name', { value: className })
		window[className].prototype.chainName = name

		this._defineGetter(name, (... args) => {
			return new window[className](... this._getConstructorArgs(args))
		})
	}

	_defineComponent(cls, importUrl) {
		this._loadCss(importUrl)
		cls.prototype.chainName = cls.name
		window[cls.name] = cls
		
		this._defineGetter(cls.name, (... args) => {
			return new cls(... this._getConstructorArgs(args))
		})
	}

	define(cls, importUrl) {
		if (typeof cls === 'string') {
			if (window[cls]) {
				throw new PuerError(`Could not define tag "${cls}": name occupied`, $, 'define')
			} else {
				if (cls === 'text') {
					return this._defineText()
				}
				return this._defineTag(cls)
			}
		}
		if (this[cls.name]) {
			throw new PuerError(`Could not define component "$.${cls.name}": name occupied`, $, 'define')
		}
		return this._defineComponent(cls, importUrl)
	}

	/*********************** PUBLIC ***********************/

	isFunction(o)  { return this.type(o) === 'function'  }
	isBoolean(o)   { return this.type(o) === 'boolean'   }
	isObject(o)    { return this.type(o) === 'object'    }
	isString(o)    { return this.type(o) === 'string'    }
	isNumber(o)    { return this.type(o) === 'number'    }
	isRegexp(o)    { return this.type(o) === 'regexp'    }
	isSymbol(o)    { return this.type(o) === 'symbol'    }
	isError(o)     { return this.type(o) === 'error'     }
	isArray(o)     { return this.type(o) === 'array'     }
	isDate(o)      { return this.type(o) === 'date'      }
	isUndefined(o) { return this.type(o) === 'undefined' }
	isNull(o)      { return this.type(o) === 'null'      }

	isPrimitive(o) {
		return [
			'string',
			'number',
			'boolean',
			'symbol',
			'undefined',
			'null'
		].includes(this.type(o))
	}

	application(cls, importUrl, init) {
		this._defineComponent(cls, importUrl)
		this.app    = this[cls.name]()
		this.Router = new PuerRouter(this.app)
		init()
		this.app.__init()
		return $
	}

	router(getRoutes) {
		return this.Router.define(getRoutes)
	}

	defer(f, timeout=1) {
		setTimeout(f, timeout)
	}

	sync(asyncFunc) {
		return function(...args) {
			let callback = null
			if (this.isFunction(args.at(-1))) {
				callback = args.pop()
			}
 			asyncFunc(...args).then(result => {
				callback && callback(result, null)
			}).catch(error => {
				callback && callback(null, error)
			})
		}
	}

	arganize(args, types, defaults, norm_args=[]) {
		if (types.length) {
			if (this.type(args[0]) == types.shift()) {
				defaults.shift()
				norm_args.push(args.shift())
			} else {
				norm_args.push(defaults.shift())
			}
			this.arganize(args, types, defaults, norm_args)
		}
		return norm_args
	}

	type(o) {
		if (o == null) { return o + '' }
		const className = Object.prototype.toString.call(o)
		return this._classToType[className] || typeof o
	}

	timer(name) {
		const time = Date.now()
		if (this._time) {
			console.log('Timer end:', this._time_name, `${time - this._time} ms`)
		}
		if (name) {
			console.log('Timer start:', name)
			this._time      = time
			this._time_name = name
		} else {
			this._time      = undefined
			this._time_name = undefined
		}
	}

	log( ... args ) {
		const newArgs = []
		for (const arg of args) {
			if ($.isString(arg) || $.isNumber(arg) || $.isBoolean(arg)) {
				newArgs.push(arg)
			} else {
				newArgs.push(JSON.stringify(arg, null, 4))
			}
		}
		console.log( ... newArgs )
	}

}

const $ = new PuerConstructor()

$.Component          = PuerComponent

$.String             = StringMethods
$.Object             = ObjectMethods
$.Date               = DateMethods
$.Set                = SetMethods
$.Request            = Request

$.DataSet            = DataSet
$.DataStore          = DataStore
$.DataSource         = DataSource

$.Reference          = Reference

$.RouteRoot          = RouteRoot

$.Reference.PUER  = $
$.DataSource.PUER = $
$.DataSet.PUER    = $
$.DataStore.PUER  = $

window.$ = $
export default $
