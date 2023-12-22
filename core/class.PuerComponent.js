import $                 from './class.Puer.js'
import BasePuerComponent from './class.BasePuerComponent.js'
import PuerProxy         from './class.PuerProxy.js'


class PuerComponent extends BasePuerComponent {
	constructor(props, children) {
		super(props, children)	
		this.state     = new PuerProxy({}, '_onStateChange', this)
		this.classes   = this._computeClasses()
		this.isCustom  = true
		this.listeners = {}
	}

	/********************** FRAMEWORK **********************/
	
	__ready() {
		super.__ready()
		for (const prop in this.props) {
			this._onPropChange(prop)
		}
	}

	/*********************** PRIVATE ***********************/

	_onPropChange(prop) {
		this._applyProp(prop)
		const propCamelized = $.String.camelToUpper(prop)
		const methodName    = `onProp${propCamelized}Change`
		return this[methodName] && this[methodName](this.props[prop])
	}
	
	_onStateChange(prop) {
		this._applyProps()
		const propCamelized = $.String.camelToUpper(prop)
		const methodName    = `onState${propCamelized}Change`
		return this[methodName] && this[methodName](this.state[prop])
	}

	_setupRoot() {
		$.owner = this
		this.root  = this.render()
		$.owner = null
        this.root.parent = this
	}

	_setupElement() {
		this.element = this.root.element
	}

	_computeClasses() {
		console.log('VALUE', this.classes.value)
		return this.getPropsInProto('chainName', 'PuerComponent')
			.map(s => $.String.camelToKebab(s))
			.concat(this.classes.value)
	}

	/*********************** PUBLIC ***********************/

	render() {
		return $.div()
	}

	on(name, f, options) {
		this.listeners[name] = (...args) => {
			if (this.isActive && args[0].detail.targetComponent.isActive) {
				f.bind(this)(...args)
			}
		}
		$.Events.on(name, this.listeners[name], options)
	}

	once(name, f, options) {
		$.Events.once(name, f.bind(this), options)
	}

	off(name) {
		this.listeners[name] && $.Events.off(name, this.listeners[name])
	}

	trigger(name, data) {
		if (this.isActive) {
			data.targetComponent = this
			$.Events.trigger(name, data)
		}
	}
}

PuerComponent.prototype.chainName = 'PuerComponent'

export default PuerComponent