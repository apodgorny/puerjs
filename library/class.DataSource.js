import DataBase from './class.DataBase.js'
import DataSet  from './class.DataSet.js'

export default class DataSource {
	
	/**************************************************************/

	static define(cls, url, isSingular=false, isCacheable=true) {
		if (DataSource.hasOwnProperty(cls.name)) {
			throw `DataSource class already has property "${cls.name}"`
		}

		const dataSource = new cls(url, isSingular, isCacheable)
		Object.defineProperty(DataSource, cls.name, {
			get: function() {
				return dataSource
			}
		})
		return dataSource
	}

	static PUER = null // set in puer

	/**************************************************************/

	constructor(url, isSingular, isCacheable) {
		this.itemIds     = []
		this.url         = url
		this.count       = null
		this.db          = null
		this.dataSets    = {}
		this.listeners   = {}
		this.isSingular  = isSingular
		this.isCacheable = isCacheable
		this.isLoaded    = false

		this._load((itemIds) => {
			this._initDataSets()
			this.isLoaded = true
		})
	}

	_initDataSets() {
		for (const dataSetName in this.dataSets) {
			this.dataSets[dataSetName].init(this.itemIds)
		}
	}

	_connect(callback) {
		const _this = this
		DataBase.connect(this.constructor.name, db => {
			_this.db = db
			callback(db)
		})
	}

	_load(onLoad, invalidate=false) {
		const _this = this

		if (this.isCacheable) {
			this._connect(db => {
				db.getCount(count => {
					if (count > 0) {
						_this.count = count
						_this._loadFromDb(onLoad)
					} else {
						_this._loadFromUrl(onLoad)
					}
				})
			})
		} else {
			this._loadFromUrl(onLoad)
		}
	}

	_loadFromUrl(onLoad) {
		console.log('loading from URL')
		DataSource.PUER.Request.get(this.url, (items) => {
			this.isCacheable && this.db.clear()
			this.addItems(items)
			onLoad()
		})
	}

	_loadFromDb(onLoad) {
		console.log('loading from DB')
		const _this = this

		this.db.readItems(0, _this.count, (items) => {
			for (const item of items) {
				_this._addItemToStore(item)
				for (const dataSetName in _this.dataSets) {
					_this.dataSets[dataSetName].addItem(item)
				}
			}
			onLoad()
		})
	}

	_addItemToDb(item) {
		this.isCacheable && this.db.addItem(item)
	}
	
	_addItemToStore(item) {
		const itemId = DataSource.PUER.DataStore.set(null, item).id
		item.dataId = itemId
		this.itemIds.push(itemId)
	}

	/******************************************************************/

	on(name, f, options) {
		this.listeners[name] = (...args) => {
			f.bind(this)(...args)
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
		data.targetComponent = this
		$.Events.trigger(name, data)
	}

	/******************************************************************/

	addItem(item) {
		item = this.adaptItem(item)

		this.isCacheable && this._addItemToDb(item)
		this._addItemToStore(item)

		for (const dataSetName in this.dataSets) {
			this.dataSets[dataSetName].addItem(item)
		}
	}

	addItems(items) {
		items = this.adaptItems(items)

		if (this.isSingular) {
			this.addItem(items)
		} else {
			for (const item of items) {
				this.addItem(item)
			}
		}
	}

	removeItem(item) {
		for (const dataSetName in this.dataSets) {
			this.dataSets[dataSetName].removeItem(item.dataId)
		}
	}

	/******************************************************************/

	adaptItems (items) { return items }
	adaptItem  (item)  { return item  }

	defineDataSet(name) {
		const ds = DataSet.define(name)
		if (this.isLoaded) {
			ds.init(this.itemIds)
		}
		this.dataSets[name] = ds
		return ds
	}
}
