export default class DataBase {

	static connect(name, onConnect, onError) {
		new DataBase(name, onConnect, onError)
	}

	constructor(name, onConnect, onError) {
		this.name       = name
		this._connect(onConnect, onError)
	}

	_connect(onConnect, onError) {
		const request = indexedDB.open(this.name, 1)

		request.onupgradeneeded = (event) => {
			this.db = event.target.result
			if (!this.db.objectStoreNames.contains(this.name)) {
				this.db.createObjectStore(this.name, {autoIncrement: true})
			}
		}

		request.onsuccess = (event) => {
			this.db = event.target.result
			onConnect(this)
		}

		request.onerror = (event) => {
			console.error('IndexedDB error:', event.target.errorCode)
			if (onError) {
				onError(event.target.errorCode)
			} else {
				throw event.target.error
			}
		}
	}

	_handleQuotaError() {
		alert('Storage quota exceeded. Please allow more storage space for this website in your browser settings.')
	}

	_executeTransaction(operation, items, onSuccess, onError, rights='readwrite') {
		const transaction = this.db.transaction([this.name], rights)
		const store       = transaction.objectStore(this.name)

		let request
		switch (operation) {
			case 'add':
				request = store.add(items)
				break
			case 'addAll':
				items.forEach((item) => store.add(item))
				onSuccess && onSuccess() // call success after all items added
				break
			case 'update':
				request = store.update(items)
				break
			case 'delete':
				request = store.delete(items)
				break
			case 'readAll':
				// const range = IDBKeyRange.bound(items.from, items.from + items.max - 1)
				request = store.getAll()
				break
			case 'count':
				request = store.count()
				break
			case 'clear':
				request = store.clear()
				break
			default:
				onError('Invalid operation')
		}
		if (request) {
			request.onsuccess = (request, event) => {
				onSuccess && onSuccess(request.target.result)
			}
			request.onerror = (request, event) => {
				if (onError) {
					onError(request.target.error)
				} else {
					throw request.target.error
				}
			}
		}
	}

	addItem(item, onSuccess, onError) {
		this._executeTransaction('add', item, onSuccess, onError)
	}

	addItems(items, onSuccess, onError) {
		this._executeTransaction('addAll', items, onSuccess, onError)
	}

	udpateItem(item, onSuccess, onError) {
		this._executeTransaction('update', item, onSuccess, onError)
	}

	deleteItem(key, onSuccess, onError) {
		this._executeTransaction('delete', key, onSuccess, onError)
	}

	clear(onSuccess, onError) {
		this._executeTransaction('clear', null, onSuccess, onError)
	}

	readItems(from, max, onSuccess, onError) {
		this._executeTransaction('readAll', {from, max}, onSuccess, onError, 'readonly')
	}

	getCount(onSuccess, onError) {
		this._executeTransaction('count', null, onSuccess, onError, 'readonly')
	}
}
