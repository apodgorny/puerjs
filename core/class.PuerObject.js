class PuerObject {
	constructor() {
		this.classProperties = Object.getOwnPropertyNames(this.constructor.prototype)
		this.className       = this.constructor.name
	}

	isInstanceProperty(prop) { return Object.prototype.hasOwnProperty.call(this, prop) }
	isClassProperty(prop)    { return this.classProperties.includes(prop.toString()) }
	isComputedProperty(prop) { return !this.isOwnProperty(prop) && !this.isClassProperty(prop) }

	getProperties() {
		let props = new Set()
		let o     = this
		do {
			Object.getOwnPropertyNames(o).map(item => props.add(item))
		} while ((o = Object.getPrototypeOf(o)))
		return [ ... props.keys()]
	}

	getMethods() {
		return this.getProperties().filter(item => typeof this[item] === 'function')
	}

	hasOwnMethod(method) {
		return this.hasOwnProperty(method) && typeof this[method] === 'function'
	}

	hasProto(className) {
		let proto = this
		do {
			if (proto.hasOwnProperty(propName) && proto.constructor.name === className) {
				return true
			}
		} while (proto && (proto = Object.getPrototypeOf(proto)))
		return false
	}

	hasPropInProto(propName, propValue) {
		let proto = this
		do {
			if (proto[propName] === propValue) {
				return true
			}
			proto = Object.getPrototypeOf(proto)
		} while (proto !== null)
		return false
	}

	getPropsInProto(propName, untilValue=null) {
		let props = []
		let proto = this
		do {
			if (proto.hasOwnProperty(propName) && proto[propName]) {
				props.unshift(proto[propName])
			}
			proto = Object.getPrototypeOf(proto)
			if (proto.hasOwnProperty(propName) && proto[propName] && proto[propName] == untilValue) {
				props.unshift(proto[propName])
				break
			}
		} while (proto !== null)
		return props
	}
}

PuerObject.prototype.chainName = 'PuerObject'

export default PuerObject