import ReferenceOwner from './class.ReferenceOwner.js'


export default class DataStore {
	static PUER       = null // set in puer
	static values     = {}
	static references = {}
	static owners     = {}
	static _id        = 0

	static _nextId() {
		return DataStore._id ++
	}

	static get(id) {
		if (DataStore.PUER.isArray(id)) {
			const items = []
			for (const _id of id) {
				items.push(DataStore.get(_id))
			}
			return items
		} else {
			const value = DataStore.values[id]
			if (DataStore.PUER.isPrimitive(value)) {
				return value
			}
			return DataStore.references[id] || null
		}
	}

	static set(id, value) {
		if (value && value.isReference) {
			return value.id
		}
		const isChanged = !id || (DataStore.values[id] !== value)
		id = id || DataStore._nextId()
		DataStore.values[id]     = value
		DataStore.references[id] = new DataStore.PUER.Reference(id)
		if (isChanged) {
			DataStore.updateOwners(id)
		}
		return DataStore.references[id]
	}

	static unset(id) {
		delete DataStore.values[id]
	}

	static has(id) {
		return DataStore.values.hasOwnProperty(id)
	}

	static updateOwners(id) {
		if (DataStore.owners.hasOwnProperty(id)) {
			for (const owner of DataStore.owners[id]) {
				owner.update()
			}
		}
	}

	static addOwner(id, prop, owner, updateMethod) {
		if (!DataStore.owners.hasOwnProperty(id)) {
			DataStore.owners[id] = []
		}
		const referenceOwner = new ReferenceOwner(owner, prop, updateMethod)
		DataStore.owners[id].push(referenceOwner)
		referenceOwner.update()
	}
}