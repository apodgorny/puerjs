import $ from './class.Puer.js'


class PuerApp extends $.Component {
    constructor(props, children) {
    	super(props, children)
    	this.props.default('onReady', () => {})
    	this.__render()
    	this.css('display', 'none')
	}

	_onAppClick(event) {
		this.trigger($.Event.APP_CLICK, {event: event})
	}

	_onAppKeyUp(event) {
		this.trigger($.Event.APP_KEYUP, {event: event})
		if (event.keyCode === 27) {
			this.trigger($.Event.APP_ESCAPE, {event: event})
		}
	}

	__ready() {
		super.__ready()
		$.Router.start()
		this.props.onReady && this.props.onReady()
		this.css('display', 'block') // Display after css has loaded
	}

	__render() {
		super.__render()
		document.body.appendChild(this.element)
		this.__rendered()

		this._on('click', this._onAppClick)
		this._on('keyup', this._onAppKeyUp)
		return this.element
	}

	__complete() {
		this.onComplete()
	}

	route(path, query=null) {
		$.Router.navigate(path, query)
	}


	toTreeString(root, indent='') {
		let s = ''
		if (root) {
			s += indent + root.toString() + '\n'
		} else {
			root = this.root
			s += indent + this.toString() + '\n'
		}
		if (root.isCustom) {
			s += this.toTreeString(root.root, indent + '  ')
		} else {
			for (let child of root.children) {
				s += this.toTreeString(child, indent + '  ')
			}
		}
		return s
	}
}

$.define(PuerApp)
export default PuerApp