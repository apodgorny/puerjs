class Reference {
	static PUER = null // set in Puer

	constructor(id) {
		this.id          = id
		this.isReference = true
		this._accessors  = []

		const proxy = new Proxy(this, {
			get(target, prop) {
				if (target[prop]) {
					if (typeof target[prop] === 'function') {
						return target[prop].bind(target)
					} else {
						return target[prop]
					}
				} else if (typeof prop == 'string') {
					// console.log('ORIGINAL', prop, target._accessors)
					const refClone = target.clone()
					refClone._accessors.push(prop)
					// console.log('CLONE', prop, refClone._accessors)
					return refClone
				}
				return proxy
			},
			set(target, prop, value) {
				if (!target[prop] && typeof prop == 'string') {
					let _value = target.rootValue
					for (const accessor of target._accessors) {
						_value = _value[accessor]
					}
					_value[prop] = value
					// target._accessors.push(prop)
					// target._accessors = [] TODO
				}
				return true
			}
		})
		return proxy
	}

	get rootValue() { // root value
		return Reference.PUER.DataStore.get(this.id)
	}

	set rootValue(value) { // root value
		Reference.PUER.DataStore.set(this.id, value)
	}

	reuse(id) {
		this.id = id
		this._accessors = []
	}

	dereference() {
		let value = this.rootValue
		for (const accessor of this._accessors) {
			if (!value) {
				break
			}
			value = value[accessor]
		}
		return value || ''
	}

	clone() {
		const ref =  new Reference(this.id)
		// console.log('clone BEFORE', this._accessors)
		for (const accessor of this._accessors) {
			ref._accessors.push(accessor)
		}
		// console.log('clone AFTER', ref._accessors)
		return ref
	}

	toString() {
		return JSON.stringify({
			reference : '#' + this.id,
			value     : this.rootValue
		})
	}
}

export default Reference