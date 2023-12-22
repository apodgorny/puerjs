import $         from './class.Puer.js'
import PuerProxy from './class.PuerProxy.js'

class PuerProps extends PuerProxy {
	constructor(props={}, onChange, owner) {
		return super(props, onChange, owner)
	}

	default(prop, defaultValue) {
		if (!this.references.hasOwnProperty(prop)) {
			this.setProp(prop, defaultValue)
		}
	}

	require(prop) {
		if (!this.references.hasOwnProperty(prop)) {
			throw new $.Error(`Property "${prop}" is required but not set.`, this.owner, 'require')
		}
	}

	extractEvents(owner) {
		const events = {}
		for (const prop in this.references) {
			let value = this.references[prop]
			if (typeof value === 'function' && $.isEvent(prop)) {
				events[prop.substring(2).toLowerCase()] = value.bind(owner)
				delete this.references[prop]
			}
		}
		return events
	}

	pop(prop) {
		if (!this.references.hasOwnProperty(prop)) {
			return null
		}
		const value = this.references[prop]
		delete this.references[prop]
		return value
	}
}

export default PuerProps