export default class DataBase {
	static DB_NAME = 'DataSource'

	static connect(name, onConnect, onError) {
		new DataBase(name, onConnect, onError)
	}

	constructor(name, onConnect, onError) {
		console.log('constructor', name)
		this.name = name
		this.isNewTable = false
		this._checkAndUpgradeDatabase(onConnect, onError)
	}

	_checkAndUpgradeDatabase(onConnect, onError) {
		const openRequest = indexedDB.open(DataBase.DB_NAME)

		openRequest.onsuccess = (event) => {
			const db = event.target.result
			const currentVersion = db.version

			db.close()

			if (!db.objectStoreNames.contains(this.name)) {
				console.log('not found', this.name)
				// If store doesn't exist, open with a new version to create it
				this._connect(currentVersion + 1, onConnect, onError)
			} else {
				console.log('found', this.name)
				// If store exists, just open normally
				this._connect(currentVersion, onConnect, onError)
			}
		}

		openRequest.onerror = (event) => {
			console.error('IndexedDB error:', event.target.errorCode)
			onError && onError(event.target.errorCode)
		}
	}

	_connect(version, onConnect, onError) {
		const request = indexedDB.open(DataBase.DB_NAME, version)

		request.onupgradeneeded = (event) => {
			console.log('creating', this.name)
			this.db = event.target.result
			if (!this.db.objectStoreNames.contains(this.name)) {
				this.db.createObjectStore(this.name, {autoIncrement: true})
				this.isNewTable = true
			}
		}

		request.onsuccess = (event) => {
			this.db = event.target.result
			onConnect(this)
		}

		request.onerror = (event) => {
			console.error('IndexedDB error:', event.target.errorCode)
			onError(event.target.errorCode)
		}
	}

	_handleQuotaError() {
		alert('Storage quota exceeded. Please allow more storage space for this website in your browser settings.')
	}

	_executeTransaction(operation, items, onSuccess, onError, rights='readwrite') {
		console.log(operation, this, this.name, rights)
		const transaction = this.db.transaction([this.name], rights)
		const store = transaction.objectStore(this.name)
	
		let request
		switch (operation) {
			case 'add':
				request = store.add(items)
				break
			case 'addAll':
				items.forEach((item) => store.add(item))
				onSuccess && onSuccess() // call success after all items added
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