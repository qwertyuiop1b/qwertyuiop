class Point {
	x;
	y;
	#z;  // 私有变量

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	// 生成器
	*[Symbol.iterator]() {
		yield this.x
		yield this.y
		yield this.#z
	}

	// 普通函数
	[Symbol.iterator]() {
		let fields = ['x', 'y', '#z']
		let that = this
		return {
			next() {
				const key = fields.shift()
				return key ? {
					value: that[key],
					done: false
				} : {
					value: undefined,
					done: true
				}
			}
		}
	}

}